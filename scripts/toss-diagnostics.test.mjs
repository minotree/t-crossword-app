import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('unknown smoke check fails before any network access instead of falsely passing', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./verify-toss-device-api.mjs', import.meta.url)),
    'https://unused.invalid', 'typo'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Unknown check name/);
});

test('unknown or partially mistyped Origin check selection fails before network access', () => {
  for (const selection of ['typo', 'preview-origin,typo']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./diagnose-toss-origin.mjs', import.meta.url)),
      'https://unused.invalid', 'https://confirmed.example', selection], { encoding: 'utf8' });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /Unknown check name/);
  }
});
