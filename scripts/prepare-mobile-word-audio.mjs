import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const vocabularyBytes = await readFile(new URL('packages/core/src/assets/vocab.json', root));
const words = JSON.parse(vocabularyBytes.toString('utf8'));
const source = JSON.parse(await readFile(new URL('content/word-audio/full-manifest.json', root), 'utf8'));
const generation = JSON.parse(await readFile(new URL('content/word-audio/full-generation-report.json', root), 'utf8'));
if (generation.vocabularySha256 !== createHash('sha256').update(vocabularyBytes).digest('hex') ||
    generation.completed !== words.length || generation.failures.length || Object.keys(source).length !== words.length) {
  throw new Error('Word audio source must match the reviewed vocabulary and generation report.');
}
const runtime = {};
const files = new Set();
for (const word of words) {
  const entry = source[word.id];
  if (!entry || entry.id !== word.id || entry.word !== word.word || entry.example !== word.example || entry.pauseMs !== 500 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.file !== `${word.id}-${entry.sha256.slice(0, 16)}.mp3` || files.has(entry.file)) {
    throw new Error(`Review word audio correspondence: ${word.id}`);
  }
  files.add(entry.file);
  runtime[word.id] = { word: entry.word, example: entry.example, file: entry.file };
}
const output = new URL('apps/mobile/src/data/word-audio.json', root);
const serialized = JSON.stringify(runtime, null, 2) + '\n';
let previous;
try { previous = await readFile(output, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (previous !== serialized) await writeFile(output, serialized);
console.log(`PASS: ${words.length} mobile audio entries; word/example/hash filenames and 500ms pause verified (${fileURLToPath(output)}).`);
