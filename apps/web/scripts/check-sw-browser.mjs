// Uses only Node built-ins and an installed Chromium. Every origin/profile is disposable.
// Run after the PWA build: node apps/web/scripts/check-sw-browser.mjs
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve, join, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';

const dist = resolve('apps/web/dist');
const worker = await readFile(join(dist, 'sw.js'), 'utf8');
const urls = JSON.parse(worker.match(/const URLS = (.*);/)[1]);
// Fixed pre-repair worker fixture: independent of future Git HEAD changes.
const legacy = `
const CACHE = "t-crossword-shell-0123456789abcdef";
const URLS = ${JSON.stringify(urls.map(url => url === '/' ? '/index.html' : url))};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)));
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('t-crossword-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html'))
      .then(cached => cached || fetch(event.request)));
  } else if (url.pathname.startsWith('/picture-books/')) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }));
  } else if (URLS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname))
      .then(cached => cached || fetch(event.request)));
  }
});
`;
const servers = [], sockets = [];
const states = new Map();
for (const port of [5199, 5200, 5201]) {
  const state = { mode: port === 5200 ? 'old' : 'new', offline: false };
  states.set(port, state);
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (state.offline) { req.socket.destroy(); return; }
    res.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/index.html') { res.writeHead(308, { Location: '/' }); res.end(); return; }
    if (url.pathname === '/probe') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>SW test</title>SW test'); return; }
    if (url.pathname === '/sw.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end(state.mode === 'old' ? legacy : ['next', 'fail'].includes(state.mode)
        ? worker.replaceAll(worker.match(/const CACHE = "([^"]+)"/)[1], 't-crossword-shell-v2-' + state.mode + '-test') : worker);
      return;
    }
    if (state.mode === 'fail' && url.pathname.startsWith('/assets/')) { res.writeHead(503); res.end('Install failure'); return; }
    let file = resolve(dist, '.' + url.pathname);
    if (!file.startsWith(dist + sep) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
    res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' }[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  servers.push(server);
}
const profile = await mkdtemp(join(tmpdir(), 'mnu-sw-recovery-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
let debugPort, browserSocket;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const deadline = setTimeout(() => { console.error('Browser test timeout'); cleanup(1); }, 120000);
function cleanup(code) {
  clearTimeout(deadline);
  browserSocket?.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
  for (const socket of sockets) socket.close();
  chrome.kill();
  for (const server of servers) { server.closeAllConnections(); server.close(); }
  setTimeout(() => process.exit(code), 500);
}
async function page(port, route = '/probe') {
  const target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl); sockets.push(socket);
  await new Promise(r => socket.onopen = r);
  let seq = 0; const pending = new Map(); const errors = [], failed = [], navigations = [];
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'ServiceWorker.workerErrorReported') errors.push(m.params.errorMessage);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if (m.method === 'Network.loadingFailed') failed.push(m.params);
    if (m.method === 'Page.frameNavigated' && !m.params.frame.parentId) navigations.push(m.params.frame.url);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('ServiceWorker.enable');
  const navigate = async route => { const result = await send('Page.navigate', { url: `http://127.0.0.1:${port}${route}` }); await sleep(300); return result; };
  await navigate(route);
  return { send, evaluate, navigate, errors, failed, navigations };
}
async function until(fn, label) {
  for (let i = 0; i < 120; i++) { try { if (await fn()) return; } catch { /* Navigation may replace the execution context. */ } await sleep(100); }
  throw Error('Timed out: ' + label);
}
const register = p => p.evaluate("navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>true)");
const current = p => p.evaluate("caches.keys().then(keys=>keys.filter(k=>k.startsWith('t-crossword-shell-v2-')))");
const app = p => until(() => p.evaluate("!!document.querySelector('nav')"), 'app render');
try {
  await until(async () => {
    debugPort = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
    return Boolean(debugPort);
  }, 'Chromium');
  const version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
  browserSocket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserSocket.onopen = r);
  const fresh = await page(5199);
  assert.equal((await fetch('http://127.0.0.1:5199/index.html', { redirect: 'manual' })).status, 308);
  await register(fresh);
  await fresh.navigate('/'); await app(fresh);
  assert.deepEqual(await fresh.evaluate("Promise.all([caches.keys(),caches.keys().then(async keys=>{const c=await caches.open(keys.find(k=>k.startsWith('t-crossword-shell-v2-')));const r=await c.match('/');return {redirected:r.redirected,status:r.status,index:!!await c.match('/index.html')}})])"), [await fresh.evaluate('caches.keys()'), { redirected: false, status: 200, index: false }]);
  for (const route of ['/quiz', '/word-bank', '/settings', '/']) { await fresh.navigate(route); await app(fresh); }
  await fresh.send('Page.reload'); await app(fresh);
  console.log('PASS fresh install, 308 canonical cache, reload and SPA direct routes');

  const old = await page(5200);
  const other = await page(5200);
  await register(old);
  await until(() => other.evaluate('Boolean(navigator.serviceWorker.controller)'), 'legacy claim');
  await sleep(100);
  const oldCache = await old.evaluate("caches.open('t-crossword-shell-0123456789abcdef').then(c=>c.match('/index.html')).then(r=>({redirected:r.redirected,status:r.status}))");
  assert.deepEqual(oldCache, { redirected: true, status: 200 });
  const record = JSON.stringify({ completedWordIds: ['preserved-word'], bookmarkedWordIds: [], hintUsedWordIds: [], dismissedMistakeWordIds: [] });
  await old.evaluate(`localStorage.setItem('t-crossword.word-progress.v1',${JSON.stringify(record)}); caches.open('another-service').then(c=>c.put('/keep',new Response('keep')))`);
  await old.evaluate("caches.open('t-crossword-shell-0123456789abcdef').then(c=>c.put('/assets/legacy-only-hash.js',new Response('/* old exact module */',{headers:{'content-type':'text/javascript'}})))");
  // A functioning old tab's existing controllerchange handler must reload only once.
  await other.evaluate("history.replaceState(null,'','/quiz');navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true})");
  const failedNavigation = await old.navigate('/');
  assert.ok(failedNavigation.errorText || old.failed.some(x => x.errorText === 'net::ERR_FAILED'));
  console.log('PASS legacy redirected cache and ERR_FAILED reproduced');
  states.get(5200).mode = 'new';
  const before = old.navigations.length + other.navigations.length;
  await other.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update()).then(()=>true)");
  await until(() => current(other).then(keys => keys.length > 0), 'recovery cache');
  await sleep(2400);
  // Chromium error documents may no longer be WindowClients; retrying a navigation is sufficient.
  const autoRecovered = await old.evaluate("!!document.querySelector('nav')");
  if (!autoRecovered) await old.navigate('/');
  await app(old); await app(other);
  assert.equal(await old.evaluate("localStorage.getItem('t-crossword.word-progress.v1')"), record);
  assert.equal(await other.evaluate("caches.has('another-service')"), true);
  assert.equal(await other.evaluate("caches.has('t-crossword-shell-0123456789abcdef')"), true);
  assert.equal(await other.evaluate("fetch('/assets/legacy-only-hash.js').then(r=>r.text())"), '/* old exact module */');
  assert.equal(await other.evaluate("location.pathname"), '/quiz');
  const recoveredKeys = await current(other);
  assert.equal(await other.evaluate("caches.open('t-crossword-shell-state').then(c=>c.match('/__sw_redirect_recovery_v1__')).then(Boolean)"), true);
  const navigationCount = old.navigations.length + other.navigations.length - before;
  await sleep(1800);
  assert.equal(old.navigations.length + other.navigations.length - before, navigationCount, 'reload loop');
  assert.ok(navigationCount <= 3, 'duplicate reloads');
  console.log('PASS recovery activation, multiple tabs, storage/old assets retained, no reload loop', JSON.stringify({ autoRecoveredErrorDocument: autoRecovered, navigations: navigationCount }));

  states.get(5200).mode = 'next';
  await other.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update()).then(()=>true)");
  await until(() => other.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r.waiting)"), 'normal update waits');
  assert.equal(await other.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.active.state)"), 'activated');
  console.log('PASS subsequent normal update waits for user approval');

  assert.equal(fresh.errors.length, 0, JSON.stringify(fresh.errors));

  const failure = await page(5201); await register(failure);
  const healthyKey = (await current(failure))[0];
  states.get(5201).mode = 'fail';
  await failure.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update()).then(()=>true)");
  await until(() => failure.evaluate("navigator.serviceWorker.getRegistration().then(r=>!r.installing)"), 'failed install settled');
  assert.equal(await failure.evaluate(`caches.open(${JSON.stringify(healthyKey)}).then(c=>c.match('/')).then(r=>r.status===200&&!r.redirected)`), true);
  assert.equal(await failure.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.active.state)"), 'activated');
  assert.equal(await failure.evaluate("caches.open('t-crossword-shell-state').then(c=>c.match('/__sw_redirect_recovery_v1__')).then(Boolean)"), false);
  states.get(5201).mode = 'new';
  await failure.navigate('/quiz'); await app(failure);
  console.log('PASS failed install preserves old active worker/cache and does not mark recovery complete');
  console.log('EXPECTED install-failure console errors', fresh.errors.length);
  // ServiceWorker.enable reports workers for all test origins, including deliberate failures.
  fresh.errors.length = 0;

  states.get(5199).offline = true;
  await fresh.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  for (const route of ['/', '/quiz', '/word-bank', '/settings']) { await fresh.navigate(route); await app(fresh); }
  await fresh.navigate('/quiz');
  await until(() => fresh.evaluate("!!document.querySelector('.mnu-web-quiz-board-frame button')"), 'offline puzzle');
  assert.equal(fresh.errors.length, 0, JSON.stringify(fresh.errors));
  assert.equal(fresh.failed.filter(x => x.type === 'Script' || x.type === 'Stylesheet').length, 0, 'asset version failure');
  console.log('PASS offline navigation and puzzle generation, no fresh-worker console or JS/CSS failures');
  console.log('BROWSER PASS', JSON.stringify({ profile, recoveryCache: recoveredKeys }));
  cleanup(0);
} catch (error) { console.error(error); cleanup(1); }
