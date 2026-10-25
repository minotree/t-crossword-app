import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numberChoices } from '../src/adapters/puzzlePresentation.ts';

const across = { id: 'across', orientation: 'across', startRow: 1, startCol: 1 };
const down = { id: 'down', orientation: 'down', startRow: 1, startCol: 1 };
const crossing = { id: 'crossing', orientation: 'across', startRow: 1, startCol: 0 };
const words = [across, down, crossing];
test('a shared number offers only words starting there, not a passing crossing word', () => {
  assert.deepEqual(numberChoices(words, [], 1, 1), [across, down]);
});
test('a solved across word leaves the down input available and vice versa', () => {
  assert.deepEqual(numberChoices(words, ['across'], 1, 1), [down]);
  assert.deepEqual(numberChoices(words, ['down'], 1, 1), [across]);
});
test('fully solved numbers and unnumbered cells have no action', () => {
  assert.deepEqual(numberChoices(words, ['across', 'down'], 1, 1), []);
  assert.deepEqual(numberChoices(words, [], 2, 1), []);
});
