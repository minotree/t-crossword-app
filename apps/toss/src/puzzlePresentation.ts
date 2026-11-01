import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';

export function getRevealedCells(puzzle: CrosswordPuzzle, solvedIds: string[], hintedCells: Record<string, string> = {}): Set<string> {
  const visible = new Set(Object.keys(hintedCells));
  const solved = new Set(solvedIds);
  for (const word of puzzle.words) {
    if (!solved.has(word.id)) continue;
    for (let index = 0; index < word.word.length; index++) {
      const row = word.startRow + (word.orientation === 'down' ? index : 0);
      const col = word.startCol + (word.orientation === 'across' ? index : 0);
      visible.add(`${row}-${col}`);
    }
  }
  return visible;
}

export function getCurrentLetters(puzzle: CrosswordPuzzle, solvedIds: string[], word: CrosswordWord, hintedCells: Record<string, string> = {}): string[] {
  const visible = getRevealedCells(puzzle, solvedIds, hintedCells);
  return Array.from({ length: word.word.length }, (_, index) => {
    const row = word.startRow + (word.orientation === 'down' ? index : 0);
    const col = word.startCol + (word.orientation === 'across' ? index : 0);
    return visible.has(`${row}-${col}`) ? puzzle.grid[row]?.[col]?.letter ?? '' : '';
  });
}

/** Returns unsolved words whose every cell has become visible through crossings or hints. */
export function getAutomaticallyCompletedWordIds(puzzle: CrosswordPuzzle, solvedIds: string[], hintedCells: Record<string, string> = {}): string[] {
  const visible = getRevealedCells(puzzle, solvedIds, hintedCells);
  const solved = new Set(solvedIds);
  return puzzle.words.filter((word) => {
    if (solved.has(word.id)) return false;
    return Array.from({ length: word.word.length }, (_, index) => {
      const row = word.startRow + (word.orientation === 'down' ? index : 0);
      const col = word.startCol + (word.orientation === 'across' ? index : 0);
      return visible.has(`${row}-${col}`);
    }).every(Boolean);
  }).map((word) => word.id);
}
