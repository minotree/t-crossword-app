import { describe, expect, it } from 'vitest';
import { generateCrossword } from '../algorithms/crosswordGenerator.js';
import { defaultVocabList } from '../assets/defaultVocab.js';
import { parseCrosswordPuzzle } from './parseCrosswordPuzzle.js';

describe('network crossword puzzle validation', () => {
  it('accepts generated puzzles and rejects malformed dimensions, words and hidden answer mismatches', () => {
    const puzzle = generateCrossword(defaultVocabList, 'beginner', 8);
    expect(parseCrosswordPuzzle(puzzle)).toEqual(puzzle);
    expect(() => parseCrosswordPuzzle({ ...puzzle, grid: [] })).toThrow();
    expect(() => parseCrosswordPuzzle({ ...puzzle, words: [{ ...puzzle.words[0], hintLimit: 99 }] })).toThrow();
    expect(() => parseCrosswordPuzzle({ ...puzzle, words: [{ ...puzzle.words[0], startCol: 8 }] })).toThrow();
    const changed = structuredClone(puzzle);
    const word = changed.words[0];
    changed.grid[word.startRow][word.startCol] = null;
    expect(() => parseCrosswordPuzzle(changed)).toThrow('글자가 일치');
    expect(() => parseCrosswordPuzzle({ ...puzzle, words: [puzzle.words[0], puzzle.words[0]] })).toThrow();
  });
});
