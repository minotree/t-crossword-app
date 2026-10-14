import { getWordHintLimit } from '../utils/hintLimit.js';
import type { WordItem, CrosswordCell, CrosswordWord, CrosswordPuzzle, DifficultyLevel, GridSize } from '../types/index.js';

interface PlacementCandidate {
  word: WordItem;
  row: number;
  col: number;
  orientation: 'across' | 'down';
  matches: boolean;
}

export function generateCrossword(
  vocabList: WordItem[],
  level: DifficultyLevel,
  gridSize: GridSize
): CrosswordPuzzle {
  // 난이도별 단어 필터링 (최소 길이 3 이상)
  const filteredWords = vocabList
    .filter((word) => word.level === level && word.word.length >= 3)
    .map((word) => ({
      ...word,
      word: word.word.toUpperCase(),
    }));

  // 빈 그리드 초기화
  const grid: (CrosswordCell | null)[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null));

  const placedWords: CrosswordWord[] = [];
  let acrossNumber = 0;
  let downNumber = 0;

  // 첫 번째 단어는 그리드 중앙 부근에 가로 배치
  if (filteredWords.length > 0) {
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor((gridSize - filteredWords[0].word.length) / 2);

    placeWord(
      filteredWords[0],
      centerRow,
      centerCol,
      'across',
      grid,
      placedWords,
      acrossNumber,
      downNumber
    );
  }

  // 나머지 단어들을 탐욕적으로 배치
  for (const word of filteredWords.slice(1)) {
    const candidates = findPlacementCandidates(word.word, grid);
    
    if (candidates.length > 0) {
      // 가장 좋은 후보 선택 (교차 가능한 위치 우선)
      const bestCandidate = candidates.reduce((best, candidate) => {
        return candidate.matches && !candidate.isAdjacentToExistingBlock 
          ? candidate 
          : best;
      }, candidates[0]);

      if (bestCandidate) {
        placeWord(
          word,
          bestCandidate.row,
          bestCandidate.col,
          bestCandidate.orientation,
          grid,
          placedWords,
          acrossNumber,
          downNumber
        );
      }
    }
  }

  // 그리드 번호 매기기
  assignNumbers(grid, placedWords);

  return {
    size: gridSize,
    level,
    grid,
    words: placedWords,
  };
}

function placeWord(
  wordItem: WordItem,
  row: number,
  col: number,
  orientation: 'across' | 'down',
  grid: (CrosswordCell | null)[][],
  placedWords: CrosswordWord[],
  acrossNumber: number,
  downNumber: number
): void {
  const word = wordItem.word;
  const length = word.length;

  for (let i = 0; i < length; i++) {
    grid[row + i][col + i] = null; // 초기화
  }

  if (orientation === 'across') {
    for (let i = 0; i < length; i++) {
      const cell = grid[row][col + i];
      cell = {
        row,
        col: col + i,
        letter: word[i],
        isStartOfAcross: i === 0,
        isStartOfDown: false,
        acrossNumber: acrossNumber + 1,
        downNumber: undefined,
      };
      grid[row][col + i] = cell;
    }
    placedWords.push({
      id: wordItem.id,
      word,
      meaning: wordItem.meaning,
      orientation: 'across',
      startRow: row,
      startCol: col,
      number: acrossNumber + 1,
      hintLimit: getWordHintLimit(word),
      hintUsedCount: 0,
    });
    acrossNumber++;
  } else {
    for (let i = 0; i < length; i++) {
      const cell = grid[row + i][col];
      cell = {
        row: row + i,
        col,
        letter: word[i],
        isStartOfAcross: false,
        isStartOfDown: i === 0,
        acrossNumber: undefined,
        downNumber: downNumber + 1,
      };
      grid[row + i][col] = cell;
    }
    placedWords.push({
      id: wordItem.id,
      word,
      meaning: wordItem.meaning,
      orientation: 'down',
      startRow: row,
      startCol: col,
      number: downNumber + 1,
      hintLimit: getWordHintLimit(word),
      hintUsedCount: 0,
    });
    downNumber++;
  }
}

function findPlacementCandidates(
  word: string,
  grid: (CrosswordCell | null)[][]
): PlacementCandidate[] {
  const candidates: PlacementCandidate[] = [];
  const length = word.length;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col <= grid[0].length - length; col++) {
      // 가로 배치 후보
      if (canPlaceAcross(word, row, col, grid)) {
        candidates.push({
          word: null as any,
          row,
          col,
          orientation: 'across',
          matches: true,
          isAdjacentToExistingBlock: false,
        });
      }

      // 세로 배치 후보
      if (canPlaceDown(word, row, col, grid)) {
        candidates.push({
          word: null as any,
          row,
          col,
          orientation: 'down',
          matches: true,
          isAdjacentToExistingBlock: false,
        });
      }
    }
  }

  return candidates;
}

function canPlaceAcross(
  word: string,
  row: number,
  col: number,
  grid: (CrosswordCell | null)[][]
): boolean {
  for (let i = 0; i < word.length; i++) {
    const cell = grid[row][col + i];
    if (!cell) return false;
    if (cell.letter !== word[i]) return false;
  }
  return true;
}

function canPlaceDown(
  word: string,
  row: number,
  col: number,
  grid: (CrosswordCell | null)[][]
): boolean {
  for (let i = 0; i < word.length; i++) {
    const cell = grid[row + i][col];
    if (!cell) return false;
    if (cell.letter !== word[i]) return false;
  }
  return true;
}

function assignNumbers(
  grid: (CrosswordCell | null)[][],
  placedWords: CrosswordWord[]
): void {
  // 가로 번호 매기기
  for (let row = 0; row < grid.length; row++) {
    let acrossNum = 0;
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell && cell.isStartOfAcross) {
        acrossNum++;
        cell.acrossNumber = acrossNum;
      }
    }
  }

  // 세로 번호 매기기
  for (let col = 0; col < grid[0].length; col++) {
    let downNum = 0;
    for (let row = 0; row < grid.length; row++) {
      const cell = grid[row][col];
      if (cell && cell.isStartOfDown) {
        downNum++;
        cell.downNumber = downNum;
      }
    }
  }
}
