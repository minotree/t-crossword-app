import type { CellInputMap, Puzzle, WordEntry } from '@t-crossword/contracts';

// ──────────────────────────────────────────────
// 퍼즐 풀이 결과
// ──────────────────────────────────────────────

export interface WordCheckResult {
  wordNumber: number;
  direction: WordEntry['direction'];
  correct: boolean;
}

export interface PuzzleCheckResult {
  allCorrect: boolean;
  words: WordCheckResult[];
}

// ──────────────────────────────────────────────
// 퍼즐 풀이 서비스 (순수 함수, 부수효과 없음)
// ──────────────────────────────────────────────

/**
 * 사용자 입력이 특정 단어의 정답과 일치하는지 확인합니다.
 */
export function checkWord(
  word: WordEntry,
  inputs: CellInputMap,
): WordCheckResult {
  const { row, col } = word.startPosition;

  const correct = word.answer.every((syllable, i) => {
    const key =
      word.direction === 'across'
        ? `${row},${col + i}`
        : `${row + i},${col}`;
    return inputs[key]?.trim() === syllable;
  });

  return { wordNumber: word.number, direction: word.direction, correct };
}

/**
 * 퍼즐 전체 정답을 확인합니다.
 */
export function checkPuzzle(
  puzzle: Puzzle,
  inputs: CellInputMap,
): PuzzleCheckResult {
  const words = puzzle.words.map((word) => checkWord(word, inputs));
  return {
    allCorrect: words.every((w) => w.correct),
    words,
  };
}

/**
 * 셀 위치 키를 생성합니다 (CellInputMap 키 형식).
 */
export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * 퍼즐의 특정 방향 단어들만 필터링합니다.
 */
export function getWordsByDirection(
  puzzle: Puzzle,
  direction: WordEntry['direction'],
): WordEntry[] {
  return puzzle.words.filter((w) => w.direction === direction);
}
