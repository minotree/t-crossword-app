import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';

const dist = resolve('dist');
async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesIn(path));
    else if (entry.name !== 'sw.js') result.push(path);
  }
  return result;
}
const files = (await filesIn(dist)).sort();
// Include generator changes as well as assets in the cache identity.
const hash = createHash('sha256').update('shell-v2').update(await readFile(new URL(import.meta.url)));
for (const file of files) hash.update(relative(dist, file)).update(await readFile(file));
const cache = `t-crossword-shell-v2-${hash.digest('hex').slice(0, 16)}`;
// Picture books load on demand so installing the app does not download every illustration.
const urls = [...new Set(files.map((file) => '/' + relative(dist, file).replaceAll('\\', '/'))
  .filter((url) => !url.startsWith('/picture-books/'))
  .map(url => url === '/index.html' ? '/' : url))];
await writeFile(resolve(dist, 'sw.js'), `
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls)};
const PREFIX = 't-crossword-shell-';
const STATE = PREFIX + 'state';
const RECOVERY = '/__sw_redirect_recovery_v1__';
const PENDING = '/__sw_redirect_recovery_pending__';

// Only successful same-origin HTML cache entries may lose redirect metadata.
// Live network responses (including redirects and HTTP errors) pass through unchanged.
function safeHtml(response) {
  if (!response || response.status !== 200 || !/^text\\/html(?:;|$)/i.test(response.headers.get('content-type') || '')) return null;
  if (response.url && new URL(response.url).origin !== self.location.origin) return null;
  if (response.type !== 'basic' && response.type !== 'default') return null;
  return response.redirected ? new Response(response.body, {
    status: response.status, statusText: response.statusText, headers: response.headers,
  }) : response;
}
async function offlineHtml() {
  const keys = await caches.keys();
  for (const key of [CACHE, ...keys.filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== STATE).reverse()]) {
    const cache = await caches.open(key);
    for (const path of ['/', '/index.html']) {
      const response = safeHtml(await cache.match(path));
      if (response) return response;
    }
  }
  return null;
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(URLS);
    const html = safeHtml(await cache.match('/'));
    if (!html) throw new Error('Precached app HTML is invalid');
    await cache.put('/', html);
    const keys = await caches.keys();
    const legacy = keys.some(key => /^t-crossword-shell-[a-f0-9]{16}$/.test(key));
    const state = await caches.open(STATE);
    // Incident-only migration. A durable marker keeps subsequent builds approval-based.
    if (self.registration.active && legacy && !await state.match(RECOVERY)) {
      await cache.put(PENDING, new Response('1'));
      await self.skipWaiting();
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    if (!safeHtml(await cache.match('/'))) throw new Error('App HTML not ready');
    const recovery = Boolean(await cache.match(PENDING));
    if (recovery) {
      const state = await caches.open(STATE);
      await state.put(RECOVERY, new Response(CACHE));
      await cache.delete(PENDING);
      // Retain previous assets while old documents are reloading during incident recovery.
    } else {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== STATE)
        .map(key => caches.delete(key)));
    }
    await self.clients.claim();
    // Existing app tabs reload once through PwaStatus's controllerchange handler.
    // Do not navigate clients here: it races that reload and can restore a stale SPA URL.
    // Chromium network-error documents need a user retry; they are not app WindowClients.
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      let cached = null;
      try { cached = safeHtml(await (await caches.open(CACHE)).match('/')); }
      catch { /* Cache Storage failure must not block an online navigation. */ }
      if (cached) return cached;
      try { return await fetch(event.request); }
      catch (error) {
        let fallback = null;
        try { fallback = await offlineHtml(); }
        catch { /* Preserve the original network error if storage is unavailable too. */ }
        if (fallback) return fallback;
        throw error;
      }
    })());
  } else if (url.pathname.startsWith('/picture-books/')) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) {
        try { await cache.put(event.request, response.clone()); }
        catch { console.warn('Picture book could not be cached.'); }
      }
      return response;
    }));
  } else if (url.pathname.startsWith('/assets/') && !URLS.includes(url.pathname)) {
    // Exact URLs only: never replace an old hashed module with a different version.
    event.respondWith((async () => {
      for (const key of await caches.keys()) {
        if (!key.startsWith(PREFIX) || key === STATE) continue;
        const cached = await (await caches.open(key)).match(event.request);
        if (cached) return cached;
      }
      return fetch(event.request);
    })());
  } else if (URLS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname))
      .then(cached => cached || fetch(event.request)));
  }
});
`);
console.log(`PWA: ${urls.length} files precached (${cache})`);
