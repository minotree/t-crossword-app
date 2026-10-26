import { defaultVocabList, generateCrossword, vocabularyForProgress, type DifficultyLevel, type GridSize } from '@t-crossword/core';
self.onmessage = (event: MessageEvent<{ level: DifficultyLevel; size: GridSize; completed: string[]; mistakes?: string[]; dismissed?: string[] }>) => {
  try {
    const { level, size, completed, mistakes, dismissed } = event.data;
    self.postMessage({ puzzle: generateCrossword(vocabularyForProgress(defaultVocabList, completed, mistakes, dismissed), level, size) });
  } catch { self.postMessage({ error: '문제를 만들지 못했습니다.' }); }
};
