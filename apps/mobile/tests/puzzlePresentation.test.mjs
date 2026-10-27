import { test } from 'node:test';
import assert from 'node:assert/strict';
import { knownWordLetters, numberChoices, visiblePuzzleCells } from '../src/adapters/puzzlePresentation.ts';

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

test('revealed letters remain available when reopening and in crossing words', () => {
  const horizontal = { ...across, word: 'BEAR' };
  const vertical = { ...down, word: 'BIRD' };
  const puzzle = { words: [horizontal, vertical] };
  assert.deepEqual(knownWordLetters(puzzle, [], horizontal, { '1:1': 'B', '1:2': 'E' }), ['B', 'E', '', '']);
  assert.deepEqual(knownWordLetters(puzzle, [], vertical, { '1:1': 'B', '1:2': 'E' }), ['B', '', '', '']);
  assert.deepEqual([...visiblePuzzleCells(puzzle, ['across'])], ['1:1', '1:2', '1:3', '1:4']);
  assert.deepEqual(knownWordLetters(puzzle, [], horizontal, {}), ['', '', '', '']);
});
