import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const books = [];
let pending = 0;
for (const level of ['beginner', 'intermediate', 'advanced']) {
  const source = resolve(root, 'content', level === 'beginner' ? 'beginner-poems' : `${level}-readings`);
  const entries = JSON.parse(await readFile(resolve(source, level === 'beginner' ? 'poems.json' : 'books.json'), 'utf8'));
  for (const book of entries) {
    // Approval must be explicit in the source after editorial and rights review.
    if (book.reviewStatus !== 'approved') { pending++; continue; }
    if (!/^[a-z0-9-]+$/.test(book.id)) throw new Error('Invalid book ID');
    const pages = [];
    const originalPages = level === 'beginner' ? [{ title: book.title, text: book.poem, translation: book.translation, image: book.image }] : book.pages;
    for (const [index, page] of originalPages.entries()) {
      const image = resolve(source, page.image);
      if (!image.startsWith(source + sep)) throw new Error('Image outside content directory');
      const imagePath = `picture-books/${book.id}-${index + 1}.png`;
      const destination = resolve(root, 'apps/toss/public', imagePath);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(image, destination);
      pages.push({ title: page.title, text: page.text, translation: page.translation, image: imagePath });
    }
    books.push({ id: book.id, level, title: book.title, koreanTitle: book.koreanTitle ?? '', genre: book.genre ?? 'poem', pages });
  }
}
const destination = resolve(root, 'apps/toss/src/data/picture-books.json');
const imageDirectory = resolve(root, 'apps/toss/public/picture-books');
const expectedImages = new Set(books.flatMap((book) => book.pages.map((page) => page.image.split('/').at(-1))));
let existingImages = [];
try { existingImages = await readdir(imageDirectory); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (existingImages.some((name) => !expectedImages.has(name))) {
  throw new Error('Unlisted picture-book assets remain. Review them before building; no files were deleted.');
}
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(books, null, 2) + '\n');
console.log(`Toss picture books: ${books.length} approved; ${pending} pending review (excluded).`);
