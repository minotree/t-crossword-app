import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const digest = value => createHash('sha256').update(value).digest('hex');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const approvals = await readJson(resolve(root, 'content/picture-book-approval.json'));
const manifest = await readJson(resolve(root, 'apps/mobile/src/data/picture-book-images.json'));
const books = [];
const names = new Set();
for (const [level, directory, filename] of [
  ['beginner', 'beginner-poems', 'poems.json'],
  ['intermediate', 'intermediate-readings', 'books.json'],
  ['advanced', 'advanced-readings', 'books.json'],
]) {
  const source = resolve(root, 'content', directory);
  for (const book of await readJson(resolve(source, filename))) {
    if (book.reviewStatus !== 'approved') continue;
    if (!/^[a-z0-9-]+$/.test(book.id)) throw new Error('Invalid book ID');
    const approval = approvals.books.find(item => item.id === book.id);
    if (!approval || approval.contentSha256 !== digest(JSON.stringify(book))) throw new Error(`Review changed content: ${book.id}`);
    const pages = level === 'beginner' ? [{ title: book.title, text: book.poem, translation: book.translation, image: book.image }] : book.pages;
    const result = [];
    for (const [index, page] of pages.entries()) {
      const original = resolve(source, page.image);
      if (!original.startsWith(source + sep)) throw new Error('Image outside content directory');
      const name = `${book.id}-${index + 1}.webp`;
      names.add(name);
      const hash = digest(await readFile(original));
      const image = manifest[name];
      if (approval.imageSha256[index] !== hash || !image || image.sourceSha256 !== hash ||
          image.webpSha256 !== digest(await readFile(resolve(root, 'apps/mobile/public/picture-books', name)))) {
        throw new Error(`Review/regenerate mobile image: ${name}`);
      }
      result.push({ title: page.title, text: page.text, translation: page.translation, image: `picture-books/${name}` });
    }
    books.push({ id: book.id, level, title: book.title, koreanTitle: book.koreanTitle ?? '', genre: book.genre ?? 'poem', pages: result });
  }
}
const existing = await readdir(resolve(root, 'apps/mobile/public/picture-books'));
if (existing.some(name => !names.has(name))) throw new Error('Unlisted mobile images; review without deleting user files.');
await writeFile(resolve(root, 'apps/mobile/src/data/picture-books.json'), JSON.stringify(books, null, 2) + '\n');
console.log(`PASS: ${books.length} approved mobile books / ${names.size} images; source and image hashes verified.`);
