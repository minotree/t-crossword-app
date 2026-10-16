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
