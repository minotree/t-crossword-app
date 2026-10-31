import { generateCrossword, type WordItem, type DifficultyLevel, type GridSize } from '@t-crossword/core';

self.onmessage = (event: MessageEvent<{ level: DifficultyLevel; size: GridSize; vocabulary: WordItem[] }>) => {
  const { level, size, vocabulary } = event.data;
  self.postMessage(generateCrossword(vocabulary, level, size));
};
