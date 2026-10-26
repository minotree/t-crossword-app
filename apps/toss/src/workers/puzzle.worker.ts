import { defaultVocabList, generateCrossword, vocabularyForProgress, type DifficultyLevel, type GridSize } from '@t-crossword/core';

self.onmessage = (event: MessageEvent<{ level: DifficultyLevel; size: GridSize; completedWordIds: string[]; mistakeWordIds?: string[]; dismissedMistakeWordIds?: string[] }>) => {
  const { level, size, completedWordIds, mistakeWordIds, dismissedMistakeWordIds } = event.data;
  self.postMessage(generateCrossword(vocabularyForProgress(defaultVocabList, completedWordIds, mistakeWordIds, dismissedMistakeWordIds), level, size));
};
