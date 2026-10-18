import type { CrosswordPuzzle } from '@t-crossword/core';
import { getRevealedCells } from '../puzzlePresentation.js';

export function PuzzleBoard({ puzzle, solvedIds, hintedCells = {} }: { puzzle: CrosswordPuzzle; solvedIds: string[]; hintedCells?: Record<string, string> }) {
  const visibleCells = getRevealedCells(puzzle, solvedIds, hintedCells);
  return <div className="board" role="img" aria-label={`${puzzle.size}칸 십자낱말 보드, ${solvedIds.length}/${puzzle.words.length}개 완료`}
    style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}>
    {puzzle.grid.flatMap((row, rowIndex) => row.map((cell, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      return <div aria-hidden="true" key={key} className={`cell ${cell ? '' : 'blocked'} ${visibleCells.has(key) ? 'solved' : ''}`}>
        {cell && <>
          <small>{cell.acrossNumber || cell.downNumber || ''}</small>
          <span>{visibleCells.has(key) ? cell.letter : ''}</span>
        </>}
      </div>;
    }))}
  </div>;
}
