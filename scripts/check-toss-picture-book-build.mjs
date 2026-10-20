import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = resolve(root, 'apps/toss');
const manifest = JSON.parse(await readFile(resolve(app, 'src/data/picture-book-images.json'), 'utf8'));
const books = JSON.parse(await readFile(resolve(app, 'src/data/picture-books.json'), 'utf8'));
let count = 0;
for (const book of books) for (const page of book.pages) {
  const data = await readFile(resolve(app, 'dist', page.image));
  const expected = manifest[page.image.split('/').at(-1)];
  if (!expected || createHash('sha256').update(data).digest('hex') !== expected.webpSha256) {
    throw new Error(`Built picture-book image differs: ${page.image}`);
  }
  count++;
}
async function bytesIn(directory) {
  let size = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    size += entry.isDirectory() ? await bytesIn(path) : (await stat(path)).size;
  }
  return size;
}
const bytes = await bytesIn(resolve(app, 'dist'));
// Official FAQ: the uncompressed app bundle must be at most 100 MB.
if (bytes > 100_000_000) throw new Error(`Toss web bundle exceeds 100 MB: ${bytes} bytes`);
console.log(`PASS: ${books.length} books / ${count} built images; dist ${bytes} bytes (<100 MB).`);
