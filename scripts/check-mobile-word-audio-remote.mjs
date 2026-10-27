import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const base = 'https://crossword-word-audio.minotree0902.workers.dev/';
const expected = JSON.parse(await readFile(new URL('content/word-audio/full-manifest.json', root), 'utf8'));
const response = await fetch(new URL('manifest.json', base), { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
const manifest = await response.json();
if (manifest.pauseMs !== 500 || manifest.audioPath !== 'word-audio/' || !manifest.entries ||
    Object.keys(manifest.entries).length !== Object.keys(expected).length) throw new Error('Public audio manifest mismatch');
for (const entry of Object.values(expected)) {
  const actual = manifest.entries[entry.word];
  if (!actual || ['id', 'word', 'example', 'file', 'sha256'].some(key => actual[key] !== entry[key])) {
    throw new Error(`Public audio entry mismatch: ${entry.id}`);
  }
}
const samples = [];
for (const level of ['beginner', 'intermediate', 'advanced', 'special']) {
  const entry = Object.values(expected).find(item => item.level === level);
  const audio = await fetch(new URL(`word-audio/${entry.file}`, base), {
    headers: { Origin: 'https://localhost' }, signal: AbortSignal.timeout(15000),
  });
  const sha256 = createHash('sha256').update(Buffer.from(await audio.arrayBuffer())).digest('hex');
  if (!audio.ok || sha256 !== entry.sha256 || !audio.headers.get('content-type')?.includes('audio/mpeg') ||
      !['*', 'https://localhost'].includes(audio.headers.get('access-control-allow-origin')) ||
      !audio.headers.get('cache-control')?.includes('immutable')) throw new Error(`MP3 hash/header mismatch: ${entry.id}`);
  samples.push({ id: entry.id, word: entry.word, level, http: audio.status, hashMatch: true, mimeCorsCache: 'passed' });
}
const report = { checkedDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }), baseUrl: base,
  manifestEntries: Object.keys(manifest.entries).length, allEntryCorrespondence: 'passed', pauseMs: 500,
  requestedOrigin: 'https://localhost', samples, fullRemoteMp3Download: 'not-performed', androidDevicePlayback: 'not-performed' };
await writeFile(new URL('content/word-audio/mobile-remote-validation.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
