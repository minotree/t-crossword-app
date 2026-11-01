import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';

export function visiblePuzzleCells(puzzle: CrosswordPuzzle, solvedIds: string[], hintedCells: Record<string, string> = {}): Set<string> {
  const visible = new Set(Object.keys(hintedCells));
  for (const word of puzzle.words) {
    if (!solvedIds.includes(word.id)) continue;
    for (let index = 0; index < word.word.length; index++) visible.add(`${word.startRow + (word.orientation === 'down' ? index : 0)}:${word.startCol + (word.orientation === 'across' ? index : 0)}`);
  }
  return visible;
}

export function knownWordLetters(puzzle: CrosswordPuzzle, solvedIds: string[], word: CrosswordWord, hintedCells: Record<string, string> = {}): string[] {
  const visible = visiblePuzzleCells(puzzle, solvedIds, hintedCells);
  return Array.from(word.word, (letter, index) => visible.has(`${word.startRow + (word.orientation === 'down' ? index : 0)}:${word.startCol + (word.orientation === 'across' ? index : 0)}`) ? letter : '');
}

export function automaticallyCompletedWordIds(puzzle: CrosswordPuzzle, solvedIds: string[], hintedCells: Record<string, string> = {}): string[] {
  const visible = visiblePuzzleCells(puzzle, solvedIds, hintedCells);
  const solved = new Set(solvedIds);
  return puzzle.words.filter((word) => !solved.has(word.id) && Array.from(word.word, (_, index) =>
    visible.has(`${word.startRow + (word.orientation === 'down' ? index : 0)}:${word.startCol + (word.orientation === 'across' ? index : 0)}`)
  ).every(Boolean)).map((word) => word.id);
}

/** Only unfinished words starting at the tapped number can be selected. */
export function numberChoices(words: CrosswordWord[], solvedIds: string[], row: number, col: number): CrosswordWord[] {
  return words.filter(word => word.startRow === row && word.startCol === col && !solvedIds.includes(word.id));
}
