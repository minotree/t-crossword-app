import { defaultVocabList, generateCrossword, vocabularyForProgress, type DifficultyLevel, type GridSize } from '@t-crossword/core';
self.onmessage = (event: MessageEvent<{ level: DifficultyLevel; size: GridSize; completed: string[] }>) => {
  try {
    const { level, size, completed } = event.data;
    self.postMessage({ puzzle: generateCrossword(vocabularyForProgress(defaultVocabList, completed), level, size) });
  } catch { self.postMessage({ error: '문제를 만들지 못했습니다.' }); }
};
