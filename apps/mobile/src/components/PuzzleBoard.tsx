import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { numberChoices } from '../adapters/puzzlePresentation.js';

export function PuzzleBoard({ puzzle, solvedIds, onSelectNumber }: {
  puzzle: CrosswordPuzzle; solvedIds: string[]; onSelectNumber(words: CrosswordWord[]): void;
}) {
  const visible = new Set<string>();
  for (const word of puzzle.words) {
    if (!solvedIds.includes(word.id)) continue;
    for (let index = 0; index < word.word.length; index++) visible.add(`${word.startRow + (word.orientation === 'down' ? index : 0)}:${word.startCol + (word.orientation === 'across' ? index : 0)}`);
  }
  return <div className="mobile-board" role="group" aria-label="십자낱말 보드" style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${puzzle.size}, minmax(0, 1fr))` }}>
    {puzzle.grid.flatMap((row, r) => row.map((cell, c) => {
      const number = cell?.acrossNumber || cell?.downNumber;
      const remaining = numberChoices(puzzle.words, solvedIds, r, c);
      return <div key={`${r}:${c}`} className={`mobile-cell${!cell ? ' blocked' : ''}${visible.has(`${r}:${c}`) ? ' solved' : ''}`}>
        {number && <button type="button" className="mobile-cell-number" disabled={remaining.length === 0}
          aria-label={`${number}번 ${remaining.length === 0 ? '정답 입력 완료' : remaining.length > 1 ? '가로·세로 문제 선택' : remaining[0].orientation === 'across' ? '가로 정답 입력' : '세로 정답 입력'}`}
          onClick={() => onSelectNumber(remaining)}><small>{number}</small></button>}
        {cell && <span>{visible.has(`${r}:${c}`) ? cell.letter : ''}</span>}
      </div>;
    }))}
  </div>;
}
