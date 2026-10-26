import { getWordHintLimit } from '../utils/hintLimit.js';
import { isRecord } from '@t-crossword/contracts';
import type { WordItem, CrosswordCell, CrosswordWord, CrosswordPuzzle, DifficultyLevel, GridSize } from '../types/index.js';

type Direction = CrosswordWord['orientation'];
const difficultyRank: Record<DifficultyLevel, number> = {
  beginner: 0, intermediate: 1, advanced: 2, special: 3,
};
interface PlacementCandidate {
  row: number;
  col: number;
  orientation: Direction;
  crossings: number;
}

export function generateCrossword(
  vocabList: WordItem[],
  level: DifficultyLevel,
  gridSize: GridSize
): CrosswordPuzzle {
  const filteredWords = availableWords(vocabList, level, gridSize);
  let best = buildPuzzle(filteredWords, level, gridSize);
  if (filteredWords.length < 3) return best;

  // A short seed and an unlucky greedy order can exhaust all crossings early.
  // Try bounded alternatives, keeping the puzzle with the most playable words.
  for (let attempt = 0; attempt < 8; attempt++) {
    const shuffled = [...filteredWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const seedIndex = shuffled.findIndex((item) => item.word.length >= Math.min(5, gridSize));
    if (seedIndex > 0) {
      const [seed] = shuffled.splice(seedIndex, 1);
      shuffled.unshift(seed);
    }
    const candidate = buildPuzzle(shuffled, level, gridSize);
    const filledCells = (puzzle: CrosswordPuzzle) => puzzle.grid.flat().filter(Boolean).length;
    if (candidate.words.length > best.words.length ||
        (candidate.words.length === best.words.length && filledCells(candidate) > filledCells(best))) {
      best = candidate;
    }
  }
  return best;
}

function availableWords(vocabList: WordItem[], level: DifficultyLevel, gridSize: GridSize): WordItem[] {
  const seenIds = new Set<string>();
  const seenWords = new Set<string>();
  return vocabList
    .map((item) => ({ ...item, word: item.word.trim().toUpperCase() }))
    .filter((item) => {
      if (!(difficultyRank[item.level] <= difficultyRank[level]) || item.isQuizUsed !== false || !/^[A-Z]{3,}$/.test(item.word) ||
          item.word.length > gridSize || seenIds.has(item.id) || seenWords.has(item.word)) return false;
      seenIds.add(item.id);
      seenWords.add(item.word);
      return true;
    });
}

/** Shared by device generation and server registration; completed IDs are local learning preferences. */
export function vocabularyForProgress(vocabulary: WordItem[], completedWordIds: readonly string[], mistakeWordIds: readonly string[] = [], dismissedMistakeWordIds: readonly string[] = []): WordItem[] {
  const completed = new Set(completedWordIds);
  const mistakes = new Set(mistakeWordIds);
  const dismissed = new Set(dismissedMistakeWordIds);
  return vocabulary.map((word) => ({ ...word, isQuizUsed: mistakes.has(word.id) && !dismissed.has(word.id) ? false : completed.has(word.id) || word.isQuizUsed }));
}

export interface CrosswordPlacement {
  id: string;
  startRow: number;
  startCol: number;
  orientation: Direction;
}

export function crosswordPlacements(puzzle: CrosswordPuzzle): CrosswordPlacement[] {
  return puzzle.words.map(({ id, startRow, startCol, orientation }) => ({ id, startRow, startCol, orientation }));
}

/** Rebuild an untrusted device draft with canonical vocabulary and the generator's placement rules. */
export function registerCrosswordDraft(vocabulary: WordItem[], level: DifficultyLevel, size: GridSize, draft: unknown): CrosswordPuzzle {
  if (!Array.isArray(draft) || draft.length > size * size) throw new Error('퍼즐 배치가 올바르지 않습니다.');
  const available = new Map(availableWords(vocabulary, level, size).map((word) => [word.id, word]));
  if (draft.length === 0 && available.size > 0) throw new Error('학습할 단어가 남아 있습니다.');
  const grid: (CrosswordCell | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const ownership: Set<Direction>[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set<Direction>()));
  const words: CrosswordWord[] = [];
  for (const placement of draft) {
    if (!isRecord(placement) || typeof placement.id !== 'string' ||
        (placement.orientation !== 'across' && placement.orientation !== 'down') ||
        typeof placement.startRow !== 'number' || !Number.isInteger(placement.startRow) || placement.startRow < 0 || placement.startRow >= size ||
        typeof placement.startCol !== 'number' || !Number.isInteger(placement.startCol) || placement.startCol < 0 || placement.startCol >= size) throw new Error('퍼즐 배치가 올바르지 않습니다.');
    const item = available.get(placement.id);
    if (!item) throw new Error('출제할 수 없는 단어입니다.');
    const crossings = countValidCrossings(item.word, placement.startRow, placement.startCol, placement.orientation, grid, ownership);
    if (crossings < 0 || (words.length > 0 && crossings === 0)) throw new Error('퍼즐 교차 배치가 올바르지 않습니다.');
    placeWord(item, { row: placement.startRow, col: placement.startCol, orientation: placement.orientation, crossings }, grid, ownership, words);
    available.delete(item.id);
  }
  assignNumbers(grid, words);
  return { level, size, grid, words };
}

function buildPuzzle(
  filteredWords: WordItem[], level: DifficultyLevel, gridSize: GridSize
): CrosswordPuzzle {
  const grid: (CrosswordCell | null)[][] = Array.from(
    { length: gridSize }, () => Array(gridSize).fill(null)
  );
  // Track direction ownership separately so a crossing cannot overwrite a start cell.
  const ownership: Set<Direction>[][] = Array.from(
    { length: gridSize }, () => Array.from({ length: gridSize }, () => new Set<Direction>())
  );
  const placedWords: CrosswordWord[] = [];
  const firstWord = filteredWords[0];
  if (firstWord) {
    placeWord(firstWord, {
      row: Math.floor(gridSize / 2),
      col: Math.floor((gridSize - firstWord.word.length) / 2),
      orientation: 'across', crossings: 0,
    }, grid, ownership, placedWords);
  }

  // Retry words skipped before their matching crossing letters were available.
  let remaining = filteredWords.slice(1);
  while (remaining.length > 0) {
    const skipped: WordItem[] = [];
    let placed = false;
    for (const item of remaining) {
      let best: PlacementCandidate | undefined;
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          for (const orientation of ['across', 'down'] as const) {
            const crossings = countValidCrossings(item.word, row, col, orientation, grid, ownership);
            if (crossings > 0 && (!best || crossings > best.crossings)) {
              best = { row, col, orientation, crossings };
            }
          }
        }
      }
      if (best) {
        placeWord(item, best, grid, ownership, placedWords);
        placed = true;
      } else {
        skipped.push(item);
      }
    }
    if (!placed) break;
    remaining = skipped;
  }
  assignNumbers(grid, placedWords);
  return { size: gridSize, level, grid, words: placedWords };
}

function countValidCrossings(
  word: string, row: number, col: number, orientation: Direction,
  grid: (CrosswordCell | null)[][], ownership: Set<Direction>[][]
): number {
  const dr = orientation === 'down' ? 1 : 0;
  const dc = orientation === 'across' ? 1 : 0;
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);
  if (endRow >= grid.length || endCol >= grid.length) return -1;
  // Keep a block before and after each word, including at crossing starts.
  if (grid[row - dr]?.[col - dc] || grid[endRow + dr]?.[endCol + dc]) return -1;
  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid[r][c];
    if (cell) {
      if (cell.letter !== word[i] || ownership[r][c].has(orientation)) return -1;
      crossings++;
    } else if (grid[r - dc]?.[c - dr] || grid[r + dc]?.[c + dr]) {
      // A new letter must not touch a parallel word along its sides.
      return -1;
    }
  }
  return crossings;
}

function placeWord(
  item: WordItem, candidate: PlacementCandidate,
  grid: (CrosswordCell | null)[][], ownership: Set<Direction>[][],
  placedWords: CrosswordWord[]
): void {
  const { row, col, orientation } = candidate;
  for (let i = 0; i < item.word.length; i++) {
    const r = row + (orientation === 'down' ? i : 0);
    const c = col + (orientation === 'across' ? i : 0);
    grid[r][c] ??= { row: r, col: c, letter: item.word[i] };
    ownership[r][c].add(orientation);
  }
  placedWords.push({
    id: item.id, word: item.word, meaning: item.meaning, example: item.example, synonym: item.synonym, orientation,
    startRow: row, startCol: col, number: 0,
    hintLimit: getWordHintLimit(item.word), hintUsedCount: 0,
  });
}

function assignNumbers(grid: (CrosswordCell | null)[][], words: CrosswordWord[]): void {
  for (const word of words) {
    const cell = grid[word.startRow][word.startCol];
    if (cell) {
      if (word.orientation === 'across') cell.isStartOfAcross = true;
      else cell.isStartOfDown = true;
    }
  }
  // One row-major number per starting square, shared by both directions.
  let number = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (!cell || (!cell.isStartOfAcross && !cell.isStartOfDown)) continue;
      number++;
      if (cell.isStartOfAcross) cell.acrossNumber = number;
      if (cell.isStartOfDown) cell.downNumber = number;
    }
  }
  for (const word of words) {
    const cell = grid[word.startRow][word.startCol];
    word.number = (word.orientation === 'across' ? cell?.acrossNumber : cell?.downNumber) ?? 0;
  }
}
