import { isRecord, isHintBalance } from '@t-crossword/contracts';
import type { CrosswordPuzzle, CrosswordWord, CrosswordCell } from '../types/index.js';

function isCell(value: unknown): value is CrosswordCell | null {
  return value === null || (isRecord(value) && isHintBalance(value.row) && isHintBalance(value.col) &&
    typeof value.letter === 'string' && /^[A-Z]$/.test(value.letter) &&
    ['acrossNumber', 'downNumber'].every((key) => value[key] === undefined || isHintBalance(value[key])) &&
    ['isStartOfAcross', 'isStartOfDown'].every((key) => value[key] === undefined || typeof value[key] === 'boolean'));
}
function isWord(value: unknown): value is CrosswordWord {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.word === 'string' && /^[A-Z]{3,12}$/.test(value.word) && typeof value.meaning === 'string' &&
    (value.orientation === 'across' || value.orientation === 'down') && isHintBalance(value.startRow) && isHintBalance(value.startCol) &&
    isHintBalance(value.number) && isHintBalance(value.hintLimit) && value.hintLimit <= 3 && isHintBalance(value.hintUsedCount) &&
    (value.example === undefined || typeof value.example === 'string') && (value.synonym === undefined || typeof value.synonym === 'string');
}
export function parseCrosswordPuzzle(value: unknown): CrosswordPuzzle {
  if (!isRecord(value) || (value.size !== 8 && value.size !== 10 && value.size !== 12) ||
      (value.level !== 'beginner' && value.level !== 'intermediate' && value.level !== 'advanced') ||
      !Array.isArray(value.words) || !value.words.every(isWord) || value.words.length > 144 ||
      !Array.isArray(value.grid) || value.grid.length !== value.size ||
      !value.grid.every((row): row is (CrosswordCell | null)[] => Array.isArray(row) && row.length === value.size && row.every(isCell))) {
    throw new Error('퍼즐 데이터를 확인하지 못했습니다.');
  }
  const { size, level, words, grid } = value;
  if (new Set(words.map((word) => word.id)).size !== words.length || words.some((word) =>
    word.startRow >= size || word.startCol >= size || word.startRow + (word.orientation === 'down' ? word.word.length : 1) > size ||
    word.startCol + (word.orientation === 'across' ? word.word.length : 1) > size)) throw new Error('퍼즐 범위가 올바르지 않습니다.');
  for (const word of words) {
    for (let index = 0; index < word.word.length; index++) {
      const row = word.startRow + (word.orientation === 'down' ? index : 0);
      const col = word.startCol + (word.orientation === 'across' ? index : 0);
      if (grid[row][col]?.letter !== word.word[index]) throw new Error('퍼즐 글자가 일치하지 않습니다.');
    }
  }
  return { size, level, words, grid };
}
