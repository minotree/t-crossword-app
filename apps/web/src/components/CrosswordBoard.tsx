import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { primaryMeaning } from './primaryMeaning.js';

interface CrosswordBoardProps {
  puzzle: CrosswordPuzzle | null;
  userGrid: string[][];
  selectedWord: CrosswordWord | null;
  solvedWordIds: string[];
  onSelectWord: (word: CrosswordWord) => void;
}

export const CrosswordBoard: React.FC<CrosswordBoardProps> = ({
  puzzle,
  userGrid,
  selectedWord,
  solvedWordIds,
  onSelectWord,
}) => {
  const [choices, setChoices] = useState<CrosswordWord[]>([]);
  const choiceDialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (choices.length > 1) choiceDialogRef.current?.showModal();
  }, [choices]);

  const selectNumber = (startingWords: CrosswordWord[]) => {
    if (startingWords.length === 1) onSelectWord(startingWords[0]);
    else if (startingWords.length > 1) setChoices(startingWords);
  };

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
    <div className="w-full mx-auto p-1 bg-white rounded-lg shadow-sm border border-gray-100">
      <div
        className="grid gap-px bg-gray-300 p-px rounded select-none overflow-hidden"
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
                  className="min-h-0 min-w-0 bg-[#8b95a1]"
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                />
              );
            }

            const numberToShow = cell.acrossNumber || cell.downNumber;
            const remainingWords = words.filter(word =>
              word.startRow === row && word.startCol === col && !solvedWordIds.includes(word.id));

            return (
              <div
                key={`${row}-${col}`}
                style={{ gridRow: row + 1, gridColumn: col + 1 }}
                className={`relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden font-bold text-sm sm:text-lg leading-none border ${
                  inSelected
                    ? 'bg-amber-100 border-amber-400 text-amber-950'
                    : isSolved
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {/* 좌상단 시작 단어 번호 표시 */}
                {numberToShow && (
                  <button type="button" disabled={remainingWords.length === 0} onClick={() => selectNumber(remainingWords)}
                    aria-label={`${numberToShow}번 ${remainingWords.length === 0 ? '정답 입력 완료' : remainingWords.length > 1 ? '가로·세로 문제 선택' : remainingWords[0].orientation === 'across' ? '가로 정답 입력' : '세로 정답 입력'}`}
                    className="absolute inset-0 z-10 cursor-pointer text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default">
                    <span className="absolute top-px left-px text-[8px] sm:text-[10px] font-semibold text-gray-500 leading-none">{numberToShow}</span>
                  </button>
                )}

                {/* 입력/공개된 알파벳 글자 */}
                <span className="relative top-[2px]">{userChar}</span>
              </div>
            );
          })
        )}
      </div>
      <dialog ref={choiceDialogRef} onClose={() => setChoices([])}
        aria-labelledby="word-direction-title"
        className="fixed inset-0 m-auto max-h-[80dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop:bg-slate-900/40">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="word-direction-title" className="font-bold text-slate-900">{choices[0]?.number}번 문제 선택</h2>
          <button type="button" onClick={() => choiceDialogRef.current?.close()}
            className="min-h-11 rounded-lg px-3 text-sm font-bold text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">닫기</button>
        </div>
        <div className="space-y-2">
          {[...choices].sort((a, b) => Number(a.orientation === 'down') - Number(b.orientation === 'down')).map(word => (
            <button key={word.id} type="button" onClick={() => {
              choiceDialogRef.current?.close();
              onSelectWord(word);
            }} className="flex min-h-11 w-full flex-col gap-1 rounded-xl border border-slate-200 p-3 text-left hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600">
              <span className="text-sm font-bold text-indigo-700">{word.orientation === 'across' ? '가로 문제' : '세로 문제'} · {word.word.length}자</span>
              <span className="text-sm text-slate-900">{primaryMeaning(word.meaning)}</span>
              {word.synonym?.trim() && <span className="text-xs text-indigo-700">동의어: {word.synonym}</span>}
            </button>
          ))}
        </div>
      </dialog>
    </div>
  );
};
