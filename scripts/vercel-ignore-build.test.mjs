import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideBuild, isNonWebPath } from './vercel-ignore-build.mjs';

const sha = 'a'.repeat(40);
const compare = paths => decideBuild(sha, args => args[0] === 'diff' ? paths.join('\0') + '\0' : '');

test('skips Toss and accompanying documentation changes', () => {
  assert.equal(compare(['apps/toss/src/App.tsx', 'docs/toss-ads.md', 'progress.md', 'AGENTS.md', 'content/quiz-encouragements/README.md']).skip, true);
  assert.equal(compare([]).skip, true);
});

test('builds web, shared packages, dependencies, configuration and unknown inputs', () => {
  for (const path of ['apps/web/src/App.tsx', 'packages/core/src/index.ts', 'packages/data/package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'package.json', 'vercel.json', 'tsconfig.base.json', '.npmrc', 'scripts/vercel-ignore-build.mjs', 'content/beginner-poems/poems.json', 'new-input.txt']) {
    assert.equal(compare(['apps/toss/src/App.tsx', path]).skip, false, path);
  }
});

test('uses the full last-successful-deployment diff without rename detection', () => {
  const calls = [];
  decideBuild(sha, args => { calls.push(args); return ''; });
  assert.deepEqual(calls[1], ['diff', '--name-only', '--no-renames', '-z', sha, 'HEAD', '--']);
  assert.equal(compare(['apps/web/deleted.ts', 'apps/toss/moved.ts']).skip, false);
  assert.equal(isNonWebPath('apps/toss-like/file.ts'), false);
});

test('builds on first deploy, missing history or Git failure', () => {
  for (const base of [undefined, '', '0'.repeat(40), '--invalid']) {
    assert.equal(decideBuild(base, () => { throw new Error('unexpected'); }).skip, false);
  }
  assert.equal(decideBuild(sha, () => { throw new Error('shallow history'); }).skip, false);
});
