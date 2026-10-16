import type React from 'react';
import type { CrosswordWord } from '@t-crossword/core';
import { primaryMeaning } from './primaryMeaning.js';

interface HintListSectionProps {
  words: CrosswordWord[];
  solvedWordIds: string[];
  selectedWord: CrosswordWord | null;
  onSelectWord: (word: CrosswordWord) => void;
}

export const HintListSection: React.FC<HintListSectionProps> = ({
  words,
  solvedWordIds,
  selectedWord,
  onSelectWord,
}) => {
  const acrossWords = words
    .filter((w) => w.orientation === 'across')
    .sort((a, b) => a.number - b.number);

  const downWords = words
    .filter((w) => w.orientation === 'down')
    .sort((a, b) => a.number - b.number);

  const renderWordItem = (item: CrosswordWord) => {
    const isSolved = solvedWordIds.includes(item.id);
    const isSelected = selectedWord?.id === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectWord(item)}
        className={`w-full text-left p-2 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-1.5 sm:gap-2.5 ${
          isSelected
            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
            : isSolved
            ? 'bg-emerald-50/60 border-emerald-200 text-gray-500'
            : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
            isSolved
              ? 'bg-emerald-500 text-white'
              : isSelected
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isSolved ? '✓' : item.number}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-medium leading-tight ${
                isSolved ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
            >
              {primaryMeaning(item.meaning)}
            </span>
            <span className="flex-shrink-0 text-[11px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {item.word.length}자
            </span>
          </div>
          {item.synonym?.trim() && (
            <p className="mt-1 break-words text-xs text-indigo-700">
              동의어: {item.synonym}
            </p>
          )}
          {isSolved && (
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              정답: {item.word}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full max-w-full mx-auto mt-4 grid grid-cols-2 gap-2 sm:gap-4">
      {/* 가로 힌트 */}
      <div className="min-w-0 bg-white p-2 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="flex flex-wrap items-center gap-1 sm:gap-2 font-bold text-gray-800 text-sm sm:text-base mb-3 pb-2 border-b border-gray-100">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          가로 힌트 <span className="hidden sm:inline">(Across)</span>
          <span className="ml-auto whitespace-nowrap text-xs text-gray-500 font-normal">
            {acrossWords.filter((w) => solvedWordIds.includes(w.id)).length} / {acrossWords.length}
          </span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {acrossWords.map(renderWordItem)}
        </div>
      </div>

      {/* 세로 힌트 */}
      <div className="min-w-0 bg-white p-2 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="flex flex-wrap items-center gap-1 sm:gap-2 font-bold text-gray-800 text-sm sm:text-base mb-3 pb-2 border-b border-gray-100">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          세로 힌트 <span className="hidden sm:inline">(Down)</span>
          <span className="ml-auto whitespace-nowrap text-xs text-gray-500 font-normal">
            {downWords.filter((w) => solvedWordIds.includes(w.id)).length} / {downWords.length}
          </span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {downWords.map(renderWordItem)}
        </div>
      </div>
    </div>
  );
};
