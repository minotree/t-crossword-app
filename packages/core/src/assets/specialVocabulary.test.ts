import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { defaultVocabList } from './defaultVocab.js';
import { generateCrossword, vocabularyForProgress } from '../algorithms/crosswordGenerator.js';
import { parseCrosswordPuzzle } from '../utils/parseCrosswordPuzzle.js';
import { levelLearningProgress } from '../utils/levelLearningProgress.js';

it('appends 500 special words without changing the existing learning identities', () => {
  expect(defaultVocabList).toHaveLength(3839);
  const old = defaultVocabList.slice(0, 3339);
  const identity = old.map(word => `${word.id}:${word.word}:${word.level}`).join('\n');
  expect(createHash('sha256').update(identity).digest('hex')).toBe('a88539457e21da73a7c0365c6d63c2bc306a35758f8fb4cea1e638abe37f5351');
  expect(defaultVocabList.slice(3339).every(word => word.level === 'special')).toBe(true);
  expect(new Set(defaultVocabList.map(word => word.word)).size).toBe(3839);
  expect(new Set(defaultVocabList.map(word => word.id)).size).toBe(3839);
  const first = defaultVocabList[3339];
  expect(levelLearningProgress(defaultVocabList, 'special', [old[0].id, first.id, first.id])).toEqual({ total: 500, completed: 1 });
});

it.each([8, 10, 12] as const)('can continue with special words on a %s board after all lower levels are completed', size => {
  const completed = defaultVocabList.filter(word => word.level !== 'special').map(word => word.id);
  const vocabulary = vocabularyForProgress(defaultVocabList, completed);
  const puzzle = generateCrossword(vocabulary, 'special', size);
  expect(puzzle.words.length).toBeGreaterThan(1);
  expect(puzzle.words.every(word => defaultVocabList.find(source => source.id === word.id)?.level === 'special')).toBe(true);
  expect(parseCrosswordPuzzle(puzzle)).toEqual(puzzle);
  expect(generateCrossword(vocabularyForProgress(defaultVocabList, defaultVocabList.map(word => word.id)), 'special', size).words).toEqual([]);
});
