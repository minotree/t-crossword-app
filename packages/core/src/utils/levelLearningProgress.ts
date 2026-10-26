import type { DifficultyLevel, WordItem } from '../types/index.js';

/** Counts the selected level only, independently of puzzle size or cumulative generation. */
export function levelLearningProgress(words: readonly WordItem[], level: DifficultyLevel, completedIds: readonly string[]) {
  const completed = new Set(completedIds);
  const selected = words.filter(word => word.level === level);
  return { total: selected.length, completed: selected.filter(word => completed.has(word.id)).length };
}
