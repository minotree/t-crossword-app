import type React from 'react';
import type { CrosswordWord } from '@t-crossword/core';
import { CompletionConfetti } from './CompletionConfetti.js';

interface PuzzleCompletionModalProps {
  isOpen: boolean;
  words: CrosswordWord[];
  onClose: () => void;
  onNewGame: () => void;
}

export const PuzzleCompletionModal: React.FC<PuzzleCompletionModalProps> = ({
  isOpen,
  words,
  onClose,
  onNewGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <CompletionConfetti />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* 상단 축하 헤더 */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="text-5xl mb-2 motion-safe:animate-bounce">🎉</div>
          <h2 className="text-2xl font-black text-gray-900">
            퍼즐 완성! 축하합니다!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            모든 단어를 완벽하게 맞추셨습니다.
          </p>

          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="bg-indigo-50 px-4 py-2 rounded-2xl text-center">
              <p className="text-xs text-indigo-600 font-semibold">완성 단어</p>
              <p className="text-lg font-bold text-indigo-950">{words.length}개</p>
            </div>
          </div>
        </div>

        {/* 출제 단어 복습 리스트 */}
        <div className="flex-1 overflow-y-auto my-4 pr-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            출제 단어 복습
          </h3>
          <div className="space-y-2">
            {words.map((w) => (
              <div
                key={w.id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm tracking-wide">
                      {w.word}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                      {w.orientation === 'across' ? '가로' : '세로'} {w.number}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                    {w.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            보드 보기
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="flex-2 py-3 px-4 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 퍼즐 풀기 ✨
          </button>
        </div>
      </div>
    </div>
  );
};
