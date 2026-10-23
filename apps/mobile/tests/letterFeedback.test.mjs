import { test } from 'node:test';
import assert from 'node:assert/strict';
import { letterFeedback, updateIncorrectCells } from '../src/adapters/letterFeedback.ts';

test('only incorrect English letters spend red-feedback budget', () => {
  assert.deepEqual(letterFeedback('B', 'A', 3), { highlight: true, remaining: 2 });
  for (const value of ['A', '', '한']) assert.deepEqual(letterFeedback(value, 'A', 3), { highlight: false, remaining: 3 });
});
test('exhausted feedback does not replenish or block subsequent input', () => {
  let remaining = 3;
  for (let index = 0; index < 5; index++) remaining = letterFeedback('B', 'A', remaining).remaining;
  assert.equal(remaining, 0);
  assert.deepEqual(letterFeedback('B', 'A', 0), { highlight: false, remaining: 0 });
});

test('retains other red cells when the next cell changes and clears only the corrected cell', () => {
  let cells = updateIncorrectCells([], 0, true);
  cells = updateIncorrectCells(cells, 1, true);
  assert.deepEqual(cells, [0, 1]);
  cells = updateIncorrectCells(cells, 2, false);
  assert.deepEqual(cells, [0, 1]);
  assert.deepEqual(updateIncorrectCells(cells, 0, false), [1]);
});
