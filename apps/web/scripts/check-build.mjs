import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const dist = new URL('../dist/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', dist), 'utf8'));
const sw = await readFile(new URL('sw.js', dist), 'utf8');
const precache = JSON.parse(sw.match(/const URLS = (\[[^;]+\]);/)[1]);
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports ?? []) visit(dependency);
}
visit('index.html');

test('initial static imports exclude reading and vocabulary feature chunks', async () => {
  assert.deepEqual([...initial], ['index.html']);
  const entry = await readFile(new URL(manifest['index.html'].file, dist), 'utf8');
  assert.ok(!entry.includes('The Memory Deposit'));
  const size = (await stat(new URL(manifest['index.html'].file, dist))).size;
  assert.ok(size < 650_000, `Initial JavaScript grew to ${size} bytes`);
});

test('all four lazy pages and shared vocabulary are available in the PWA precache', async () => {
  const pages = ['QuizPage', 'WordBankPage', 'PictureBooksPage', 'SettingsPage'];
  for (const page of pages) {
    const key = `src/pages/${page}.tsx`;
    assert.ok(manifest['index.html'].dynamicImports.includes(key));
    assert.ok(precache.includes('/' + manifest[key].file));
    for (const dependency of manifest[key].imports ?? []) {
      assert.ok(precache.includes('/' + manifest[dependency].file));
    }
    await stat(new URL(manifest[key].file, dist));
  }
  assert.ok(!precache.some(url => url.startsWith('/picture-books/')));
});

test('the generated worker serves cached lazy JavaScript without using the network', async () => {
  const listeners = new Map();
  const cached = new Map(precache.map(url => [url, { url }]));
  let networkCalls = 0;
  runInNewContext(sw, {
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, callback) => listeners.set(name, callback) },
    URL,
    caches: { open: async () => ({ match: async path => cached.get(path) }) },
    fetch: () => { networkCalls++; throw new Error('Offline'); },
  });
  for (const key of manifest['index.html'].dynamicImports) {
    const path = '/' + manifest[key].file;
    let response;
    listeners.get('fetch')({
      request: { url: 'https://example.test' + path, method: 'GET', mode: 'cors' },
      respondWith: promise => { response = promise; },
    });
    assert.equal((await response).url, path);
  }
  assert.equal(networkCalls, 0);
});


test('HTML precache uses the canonical root once and has an explicit format version', () => {
  assert.ok(precache.includes('/'));
  assert.ok(!precache.includes('/index.html'));
  assert.equal(new Set(precache).size, precache.length);
  assert.match(sw, /const CACHE = "t-crossword-shell-v2-/);
});

function navigationWorker(cached, network, storageUnavailable = false) {
  const listeners = new Map();
  runInNewContext(sw, {
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, callback) => listeners.set(name, callback) },
    URL, Response, caches: { open: async () => {
      if (storageUnavailable) throw Error('Cache Storage unavailable');
      return { match: async path => cached.get(path) };
    }, keys: async () => [] }, fetch: network,
  });
  return async () => {
    let result;
    listeners.get('fetch')({ request: { url: 'https://example.test/quiz', method: 'GET', mode: 'navigate', redirect: 'manual' }, respondWith: promise => { result = promise; } });
    return result;
  };
}

test('redirected same-origin HTML is normalized with body/status/headers intact', async () => {
  const response = new Response('<html>offline</html>', { headers: { 'content-type': 'text/html; charset=utf-8', 'x-test': 'preserved' } });
  Object.defineProperties(response, { redirected: { value: true }, url: { value: 'https://example.test/' } });
  const navigate = navigationWorker(new Map([['/', response]]), () => { throw Error('Should not fetch'); });
  const result = await navigate();
  assert.equal(result.redirected, false);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('x-test'), 'preserved');
  assert.equal(await result.text(), '<html>offline</html>');
});

test('invalid HTML caches fall back to network without rewriting redirects or errors', async () => {
  for (const cached of [new Response('bad', { status: 500 }), new Response('json', { headers: { 'content-type': 'application/json' } }), Object.defineProperty(new Response('external', { headers: { 'content-type': 'text/html' } }), 'url', { value: 'https://other.test/' })]) {
    for (const status of [302, 404, 500]) {
      const response = new Response(null, { status, headers: status === 302 ? { location: '/elsewhere' } : {} });
      assert.equal(await navigationWorker(new Map([['/', cached]]), async () => response)(), response);
    }
  }
});

test('network failure can recover an older valid HTML key without network conversion', async () => {
  const response = new Response('legacy offline', { headers: { 'content-type': 'text/html' } });
  const result = await navigationWorker(new Map([['/index.html', response]]), async () => { throw Error('Offline'); })();
  assert.equal(await result.text(), 'legacy offline');
  await assert.rejects(navigationWorker(new Map(), async () => { throw Error('Offline'); }), /Offline/);
});

test('Cache Storage failure permits online navigation and preserves the original offline error', async () => {
  const response = new Response('online');
  assert.equal(await navigationWorker(new Map(), async () => response, true)(), response);
  await assert.rejects(navigationWorker(new Map(), async () => { throw Error('Network offline'); }, true), /Network offline/);
});
