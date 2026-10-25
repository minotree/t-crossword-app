import type { CrosswordWord } from '@t-crossword/core';

/** Only unfinished words starting at the tapped number can be selected. */
export function numberChoices(words: CrosswordWord[], solvedIds: string[], row: number, col: number): CrosswordWord[] {
  return words.filter(word => word.startRow === row && word.startCol === col && !solvedIds.includes(word.id));
}
