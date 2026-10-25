import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { getRevealedCells } from '../puzzlePresentation.js';

export function PuzzleBoard({ puzzle, solvedIds, hintedCells = {}, onSelectNumber }: { puzzle: CrosswordPuzzle; solvedIds: string[]; hintedCells?: Record<string, string>; onSelectNumber?: (words: CrosswordWord[]) => void }) {
  const visibleCells = getRevealedCells(puzzle, solvedIds, hintedCells);
  return <div className="board" role="group" aria-label={`${puzzle.size}칸 십자낱말 보드, ${solvedIds.length}/${puzzle.words.length}개 완료`}
    style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${puzzle.size}, minmax(0, 1fr))` }}>
    {puzzle.grid.flatMap((row, rowIndex) => row.map((cell, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      const number = cell?.acrossNumber || cell?.downNumber;
      const remaining = puzzle.words.filter(word => word.startRow === rowIndex && word.startCol === colIndex && !solvedIds.includes(word.id));
      return <div key={key} className={`cell ${cell ? '' : 'blocked'} ${visibleCells.has(key) ? 'solved' : ''}`}>
        {cell && <>
          {number && <button type="button" className="cell-number" disabled={!onSelectNumber || remaining.length === 0}
            aria-label={`${number}번 ${remaining.length === 0 ? '정답 입력 완료' : remaining.length > 1 ? '가로·세로 문제 선택' : remaining[0].orientation === 'across' ? '가로 정답 입력' : '세로 정답 입력'}`}
            onClick={() => onSelectNumber?.(remaining)}><small>{number}</small></button>}
          <span>{visibleCells.has(key) ? cell.letter : ''}</span>
        </>}
      </div>;
    }))}
  </div>;
}
