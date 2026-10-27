import { expect, it } from 'vitest';
import { firstIncorrectLetterIndex, getModalHintLimit } from './letterHints.js';

it.each([[0, 0], [1, 0], [2, 1], [3, 1], [4, 2], [5, 2], [8, 4], [12, 6]])('allows %i blanks to provide %i hints', (blanks, expected) => {
  expect(getModalHintLimit([...Array<string>(blanks).fill(''), 'A', 'B'])).toBe(expected);
});

it('skips correct letters and selects the first blank or wrong letter', () => {
  expect(firstIncorrectLetterIndex('SEA', ['s', '', 'X'])).toBe(1);
  expect(firstIncorrectLetterIndex('SEA', ['X', 'E', ''])).toBe(0);
  expect(firstIncorrectLetterIndex('SEA', ['s', 'e', 'a'])).toBe(-1);
});
