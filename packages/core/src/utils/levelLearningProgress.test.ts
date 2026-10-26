import { expect, it } from 'vitest';
import { defaultVocabList } from '../assets/defaultVocab.js';
import { levelLearningProgress } from './levelLearningProgress.js';

it('counts only selected-level words and ignores duplicate or unknown completion IDs', () => {
  const beginner = defaultVocabList.find(word => word.level === 'beginner');
  const advanced = defaultVocabList.find(word => word.level === 'advanced');
  if (!beginner || !advanced) throw new Error('Missing level fixtures');
  const completed = [beginner.id, beginner.id, advanced.id, 'unknown'];
  expect(levelLearningProgress(defaultVocabList, 'beginner', completed)).toEqual({
    total: defaultVocabList.filter(word => word.level === 'beginner').length, completed: 1,
  });
  expect(levelLearningProgress(defaultVocabList, 'intermediate', completed).completed).toBe(0);
  expect(levelLearningProgress(defaultVocabList, 'advanced', []).completed).toBe(0);
  expect(levelLearningProgress([], 'beginner', completed)).toEqual({ total: 0, completed: 0 });
});
