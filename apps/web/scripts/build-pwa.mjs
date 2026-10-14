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
const hash = createHash('sha256');
for (const file of files) hash.update(relative(dist, file)).update(await readFile(file));
const cache = `t-crossword-shell-${hash.digest('hex').slice(0, 16)}`;
const urls = files.map((file) => '/' + relative(dist, file).replaceAll('\\', '/'));
await writeFile(resolve(dist, 'sw.js'), `
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls)};
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
  } else if (URLS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname))
      .then(cached => cached || fetch(event.request)));
  }
});
`);
console.log(`PWA: ${urls.length} files precached (${cache})`);
