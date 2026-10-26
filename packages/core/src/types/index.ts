export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'special';
export type GridSize = 8 | 10 | 12;

export interface WordItem {
  id: string;
  level: DifficultyLevel;
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  exampleMeaning: string;
  synonym?: string;
  isBookmarked?: boolean;
  isQuizUsed?: boolean;
}

export interface CrosswordCell {
  row: number;
  col: number;
  letter: string;
  isStartOfAcross?: boolean;
  isStartOfDown?: boolean;
  acrossNumber?: number;
  downNumber?: number;
}

export interface CrosswordWord {
  example?: string;
  synonym?: string;
  id: string;
  word: string;
  meaning: string;
  orientation: 'across' | 'down';
  startRow: number;
  startCol: number;
  number: number;
  hintLimit: number;
  hintUsedCount: number;
}

export interface CrosswordPuzzle {
  size: GridSize;
  level: DifficultyLevel;
  grid: (CrosswordCell | null)[][];
  words: CrosswordWord[];
}
