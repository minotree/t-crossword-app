import { defaultVocabList, generateCrossword, vocabularyForProgress, type DifficultyLevel, type GridSize } from '@t-crossword/core';

self.onmessage = (event: MessageEvent<{ level: DifficultyLevel; size: GridSize; completedWordIds: string[] }>) => {
  const { level, size, completedWordIds } = event.data;
  self.postMessage(generateCrossword(vocabularyForProgress(defaultVocabList, completedWordIds), level, size));
};
