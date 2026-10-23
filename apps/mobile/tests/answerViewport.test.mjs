import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerViewport } from '../src/adapters/answerViewport.ts';

test('centers the answer dialog within the visible screen', () => {
  assert.deepEqual(answerViewport(800, 0, 240), { top: 280, maxHeight: 784 });
});
test('keeps the dialog above the keyboard when visible height shrinks', () => {
  const layout = answerViewport(300, 20, 240);
  assert.equal(layout.top, 50);
  assert.ok(layout.top + 240 <= 20 + 300 - 8);
});
test('caps tall dialogs with space for internal scrolling', () => {
  assert.deepEqual(answerViewport(200, 0, 600), { top: 8, maxHeight: 184 });
});
