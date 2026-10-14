import type React from 'react';
import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';

interface CrosswordBoardProps {
  puzzle: CrosswordPuzzle | null;
  userGrid: string[][];
  selectedWord: CrosswordWord | null;
  solvedWordIds: string[];
}

export const CrosswordBoard: React.FC<CrosswordBoardProps> = ({
  puzzle,
  userGrid,
  selectedWord,
  solvedWordIds,
}) => {
  if (!puzzle) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-100 rounded-xl">
        <p className="text-gray-500 font-medium">퍼즐을 생성하는 중입니다...</p>
      </div>
    );
  }

  const { size, grid, words } = puzzle;

  // 특정 셀이 현재 선택된 단어에 포함되는지 확인
  const isCellInSelectedWord = (row: number, col: number): boolean => {
    if (!selectedWord) return false;
    if (selectedWord.orientation === 'across') {
      return (
        selectedWord.startRow === row &&
        col >= selectedWord.startCol &&
        col < selectedWord.startCol + selectedWord.word.length
      );
    } else {
      return (
        selectedWord.startCol === col &&
        row >= selectedWord.startRow &&
        row < selectedWord.startRow + selectedWord.word.length
      );
    }
  };

  // 특정 셀이 이미 해결된 단어에 포함되는지 확인
  const isCellSolved = (row: number, col: number): boolean => {
    return words.some((w) => {
      if (!solvedWordIds.includes(w.id)) return false;
      if (w.orientation === 'across') {
        return w.startRow === row && col >= w.startCol && col < w.startCol + w.word.length;
      } else {
        return w.startCol === col && row >= w.startRow && row < w.startRow + w.word.length;
      }
    });
  };

  return (
    <div className="w-full max-w-full mx-auto p-2 sm:p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div
        className="grid gap-[2px] sm:gap-1 bg-gray-200 p-[2px] sm:p-1 rounded-xl select-none"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          aspectRatio: '1 / 1',
        }}
      >
        {Array.from({ length: size }).map((_, row) =>
          Array.from({ length: size }).map((_, col) => {
            const cell = grid[row]?.[col];
            const isWordCell = cell !== null && cell !== undefined;
            const inSelected = isCellInSelectedWord(row, col);
            const isSolved = isCellSolved(row, col);
            const userChar = userGrid[row]?.[col] || '';

            if (!isWordCell) {
              return (
                <div
                  key={`${row}-${col}`}
                  className="bg-gray-800/90 rounded-[4px] sm:rounded-md transition-colors"
                />
              );
            }

            const numberToShow = cell.acrossNumber || cell.downNumber;

            return (
              <div
                key={`${row}-${col}`}
                className={`relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden font-bold text-base sm:text-2xl leading-none rounded-[4px] sm:rounded-md border transition-all ${
                  inSelected
                    ? 'bg-amber-100 border-amber-400 text-amber-950 scale-[0.98] shadow-sm'
                    : isSolved
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {/* 좌상단 시작 단어 번호 표시 */}
                {numberToShow && (
                  <span className="absolute top-[1px] left-[2px] sm:top-[2px] sm:left-[3px] text-[8px] sm:text-[11px] font-semibold text-gray-500 leading-none">
                    {numberToShow}
                  </span>
                )}

                {/* 입력/공개된 알파벳 글자 */}
                <span className="translate-y-[2px] sm:translate-y-1">{userChar}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
