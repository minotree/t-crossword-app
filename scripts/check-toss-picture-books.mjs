import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { prepareTossPictureBooks } from './prepare-toss-picture-books.mjs';

const hash = (v) => createHash('sha256').update(v).digest('hex');
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 't-crossword-books-'));
  t.after(async () => {
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    await rm(root, { recursive: true, force: true });
  });
  const put = async (path, value) => {
    const destination = join(root, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, typeof value === 'string' ? value : JSON.stringify(value));
  };
  const book = { id: 'beginner-test', level: 'beginner', title: 'Test', poem: 'Read with me.', translation: '함께 읽어요.', image: 'images/test.png', reviewStatus: 'approved' };
  await put('content/beginner-poems/poems.json', [book, { ...book, id: 'draft-test', reviewStatus: 'draft-unreviewed' }]);
  await put('content/intermediate-readings/books.json', []);
  await put('content/advanced-readings/books.json', []);
  await put('content/beginner-poems/images/test.png', 'original');
  await put('apps/toss/public/picture-books/beginner-test-1.webp', 'compressed');
  await put('content/picture-book-approval.json', { books: [{ id: book.id, contentSha256: hash(JSON.stringify(book)), imageSha256: [hash('original')] }] });
  await put('apps/toss/src/data/picture-book-images.json', { 'beginner-test-1.webp': { sourceSha256: hash('original'), webpSha256: hash('compressed') } });
  return { root, put, book };
}

test('includes reviewed content as WebP and excludes drafts', async (t) => {
  const { root } = await fixture(t);
  const books = await prepareTossPictureBooks(root);
  assert.equal(books.length, 1);
  assert.equal(books[0].pages[0].image, 'picture-books/beginner-test-1.webp');
});
test('rejects text changed after review without replacing existing metadata', async (t) => {
  const { root, put, book } = await fixture(t);
  await put('apps/toss/src/data/picture-books.json', 'existing');
  await put('content/beginner-poems/poems.json', [{ ...book, translation: '바뀐 해석' }]);
  await assert.rejects(prepareTossPictureBooks(root), /Content changed since review/);
  assert.equal(await readFile(join(root, 'apps/toss/src/data/picture-books.json'), 'utf8'), 'existing');
});
test('rejects a changed original image even if compressed assets remain', async (t) => {
  const { root, put } = await fixture(t);
  await put('content/beginner-poems/images/test.png', 'changed');
  await assert.rejects(prepareTossPictureBooks(root), /Image changed since review/);
});
test('rejects a corrupted WebP', async (t) => {
  const { root, put } = await fixture(t);
  await put('apps/toss/public/picture-books/beginner-test-1.webp', 'corrupt');
  await assert.rejects(prepareTossPictureBooks(root), /Regenerate Toss WebP/);
});
test('rejects unlisted assets without deleting them', async (t) => {
  const { root, put } = await fixture(t);
  await put('apps/toss/public/picture-books/old.png', 'preserve');
  await assert.rejects(prepareTossPictureBooks(root), /Unlisted picture-book assets/);
  assert.equal(await readFile(join(root, 'apps/toss/public/picture-books/old.png'), 'utf8'), 'preserve');
});
