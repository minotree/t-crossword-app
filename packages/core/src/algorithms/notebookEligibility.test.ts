import { expect, it } from 'vitest';
import { defaultVocabList } from '../assets/defaultVocab.js';
import { generateCrossword, vocabularyForProgress } from './crosswordGenerator.js';
import { levelLearningProgress } from '../utils/levelLearningProgress.js';

it('reuses completed visible notebook words without clearing completion or mutating source data', () => {
  const word = defaultVocabList.find(word => word.level === 'beginner' && word.word.length <= 8);
  if (!word) throw new Error('Missing fixture');
  const source = [{ ...word, isQuizUsed: true }];
  const eligible = vocabularyForProgress(source, [word.id], [word.id, word.id]);
  expect(generateCrossword(eligible, 'beginner', 8).words.map(word => word.id)).toEqual([word.id]);
  expect(source[0].isQuizUsed).toBe(true);
  expect(levelLearningProgress(source, 'beginner', [word.id])).toEqual({ completed: 1, total: 1 });
  expect(generateCrossword(vocabularyForProgress(source, [word.id], [word.id], [word.id]), 'beginner', 8).words).toEqual([]);
  expect(generateCrossword(vocabularyForProgress(source, [word.id]), 'beginner', 8).words).toEqual([]);
});

it('does not bypass difficulty or board size and still includes uncompleted hidden words', () => {
  const word = defaultVocabList.find(word => word.level === 'special' && word.word.length > 8);
  if (!word) throw new Error('Missing fixture');
  const eligible = vocabularyForProgress([word], [word.id], [word.id]);
  expect(generateCrossword(eligible, 'advanced', 12).words).toEqual([]);
  expect(generateCrossword(eligible, 'special', 8).words).toEqual([]);
  expect(generateCrossword(eligible, 'special', 12).words).toHaveLength(1);
  expect(generateCrossword(vocabularyForProgress([word], [], [word.id], [word.id]), 'special', 12).words).toHaveLength(1);
});
