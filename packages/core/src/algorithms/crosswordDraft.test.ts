import { expect, it } from 'vitest';
import { crosswordPlacements, generateCrossword, registerCrosswordDraft, vocabularyForProgress } from './crosswordGenerator.js';
import { defaultVocabList } from '../assets/defaultVocab.js';
import type { WordItem } from '../types/index.js';

const item = (word: string): WordItem => ({ id: word, word, level: 'beginner', meaning: word,
  partOfSpeech: '', example: '', exampleMeaning: '', isQuizUsed: false });
const words = [item('CAT'), item('TAP'), item('PEN')];
const first = { id: 'CAT', orientation: 'across', startRow: 3, startCol: 2 };

it.each(['beginner', 'intermediate', 'advanced'] as const)('rebuilds device-generated %s puzzles with canonical content', (level) => {
  for (const size of [8, 10, 12] as const) {
    const puzzle = generateCrossword(defaultVocabList, level, size);
    expect(registerCrosswordDraft(defaultVocabList, level, size, crosswordPlacements(puzzle))).toEqual(puzzle);
  }
});

it('shares progress exclusion and refuses a completed word or an empty draft while words remain', () => {
  const vocabulary = vocabularyForProgress(words, ['CAT']);
  expect(generateCrossword(vocabulary, 'beginner', 8).words.every(word => word.id !== 'CAT')).toBe(true);
  expect(() => registerCrosswordDraft(vocabulary, 'beginner', 8, [first])).toThrow();
  expect(() => registerCrosswordDraft(words, 'beginner', 8, [])).toThrow();
  expect(registerCrosswordDraft(vocabularyForProgress(words, words.map(word => word.id)), 'beginner', 8, []).words).toEqual([]);
});

it.each([
  [first, first],
  [{ ...first, id: 'unknown' }],
  [{ ...first, startCol: 7 }],
  [{ ...first, startRow: -1 }],
  [{ ...first, startRow: 0.5 }],
  [{ ...first, orientation: 'diagonal' }],
  [first, { id: 'TAP', orientation: 'across', startRow: 0, startCol: 0 }],
  [first, { id: 'TAP', orientation: 'across', startRow: 3, startCol: 4 }],
  [first, { id: 'TAP', orientation: 'down', startRow: 2, startCol: 2 }],
])('rejects invalid, duplicate, disconnected and colliding placements: %j', (...draft) => {
  expect(() => registerCrosswordDraft(words, 'beginner', 8, draft)).toThrow();
});

it('ignores client answers, hints and presentation, rebuilding them from vocabulary', () => {
  const puzzle = registerCrosswordDraft(words, 'beginner', 8, [{ ...first, word: 'BAD', hintLimit: 99, meaning: 'fake' }]);
  expect(puzzle.words[0]).toMatchObject({ word: 'CAT', meaning: 'CAT', hintLimit: 1, hintUsedCount: 0, number: 1 });
  expect(() => registerCrosswordDraft([{ ...words[0], level: 'advanced' }], 'beginner', 8, [first])).toThrow();
});
