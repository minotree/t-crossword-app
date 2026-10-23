import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/toss/dist');
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else if (/\.(js|html|json|map)$/.test(entry.name)) {
      const source = await readFile(path, 'utf8');
      if (/ait-ad-test-|ads\/test\/(prepare|claim)/.test(source)) {
        throw new Error(`Test advertising code in release bundle: ${path}`);
      }
    }
  }
}
await inspect(dist);
console.log('PASS: no test advertising IDs or test reward endpoints in release assets.');
