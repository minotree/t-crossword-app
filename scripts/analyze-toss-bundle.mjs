import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(new URL('../apps/toss/package.json', import.meta.url));
const { build } = await import(pathToFileURL(require.resolve('vite')).href);
const vocab = readFileSync(new URL('../packages/core/src/assets/vocab.json', import.meta.url));
console.log('VOCAB', JSON.stringify({ sourceBytes: vocab.length, compactBytes: Buffer.byteLength(JSON.stringify(JSON.parse(vocab))), words: JSON.parse(vocab).length }));
function report(label) {
  return { name: 'bundle-size-report', generateBundle(_, bundle) {
    for (const item of Object.values(bundle)) {
      if (item.type !== 'chunk') continue;
      const modules = Object.entries(item.modules).map(([id, info]) => ({ id: id.replaceAll('\\', '/').replace(process.cwd().replaceAll('\\', '/') + '/', ''), bytes: info.renderedLength })).sort((a,b) => b.bytes-a.bytes);
      const groups = {};
      for (const mod of modules) {
        const group = mod.id.includes('/assets/vocab.json') ? 'vocabulary' : mod.id.includes('node_modules') ? 'dependencies' : 'app-and-other-data';
        groups[group] = (groups[group] ?? 0) + mod.bytes;
      }
      console.log('CHUNK', JSON.stringify({ label, file: item.fileName, finalBytes: Buffer.byteLength(item.code), gzipBytes: gzipSync(item.code).length, groups, top: modules.slice(0,12) }));
    }
  }};
}
await build({ root: fileURLToPath(new URL('../apps/toss/', import.meta.url)), build: { write: false }, plugins: [report('main')], worker: { plugins: () => [report('worker')] } });
