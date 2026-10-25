import { test } from 'node:test';
import assert from 'node:assert/strict';
import { letterFeedback, updateIncorrectCells } from '../src/adapters/letterFeedback.ts';

test('only incorrect English letters receive red feedback', () => {
  assert.deepEqual(letterFeedback('B', 'A'), { highlight: true });
  for (const value of ['A', '', '한']) assert.deepEqual(letterFeedback(value, 'A'), { highlight: false });
});
test('repeated incorrect input never exhausts feedback', () => {
  for (let index = 0; index < 100; index++) assert.deepEqual(letterFeedback('B', 'A'), { highlight: true });
  assert.deepEqual(letterFeedback('A', 'A'), { highlight: false });
});

test('retains other red cells when the next cell changes and clears only the corrected cell', () => {
  let cells = updateIncorrectCells([], 0, true);
  cells = updateIncorrectCells(cells, 1, true);
  assert.deepEqual(cells, [0, 1]);
  cells = updateIncorrectCells(cells, 2, false);
  assert.deepEqual(cells, [0, 1]);
  assert.deepEqual(updateIncorrectCells(cells, 0, false), [1]);
});
