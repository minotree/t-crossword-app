import { useEffect, useRef, useState } from 'react';
import { useCrosswordGame } from '../hooks/useCrosswordGame.js';
import { wordProgressStore } from '../adapters/wordProgress.js';
import { CrosswordBoard } from '../components/CrosswordBoard.js';
import { HintListSection } from '../components/HintListSection.js';
import { WordInputModal } from '../components/WordInputModal.js';
import { PuzzleCompletionModal } from '../components/PuzzleCompletionModal.js';
import type { DifficultyLevel, GridSize } from '@t-crossword/core';

export function QuizPage() {
  const [showHints, setShowHints] = useState(false);
  const hintsButtonRef = useRef<HTMLButtonElement>(null);
  const closeHintsRef = useRef<HTMLButtonElement>(null);
  const closeHints = () => {
    setShowHints(false);
    hintsButtonRef.current?.focus();
  };
  useEffect(() => {
    if (showHints) closeHintsRef.current?.focus();
  }, [showHints]);
  const {
    wordProgressError,
    learningProgress,
    level,
    gridSize,
    puzzle,
    userGrid,
    solvedWordIds,
    selectedWord,
    selectedWordCurrentLetters,
    isInputModalOpen,
    isCompletionModalOpen,
    startNewGame,
    selectWord,
    closeInputModal,
    submitWordAnswer,
    revealWordLetter,
    closeCompletionModal,
  } = useCrosswordGame({});

  const handleLevelChange = (newLevel: DifficultyLevel) => {
    setShowHints(false);
    startNewGame(newLevel, gridSize);
  };

  const handleGridSizeChange = (newSize: GridSize) => {
    setShowHints(false);
    startNewGame(level, newSize);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-900 pb-2">
      {/* 상단 네비게이션 헤더 */}
      <header className="shrink-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧩</span>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                십자낱말 영단어
              </h1>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                초급부터 특급까지, 단어로 완성하는 영어 퍼즐
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* 설정 제어 바 (난이도 & 격자 크기) */}
      <div className="w-full max-w-4xl mx-auto shrink-0 px-3 sm:px-4 my-2">
        <div className="flex items-center justify-between gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          {/* 난이도 선택 */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { key: 'beginner', label: '초급' },
                { key: 'intermediate', label: '중급' },
                { key: 'advanced', label: '고급' },
                { key: 'special', label: '특급' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleLevelChange(item.key)}
                className={`px-2 sm:px-3 py-2 text-xs whitespace-nowrap font-bold rounded-lg transition-all cursor-pointer ${
                  level === item.key
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 격자 크기 선택 */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 bg-slate-100 p-1 rounded-xl">
            {([8, 10, 12] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleGridSizeChange(size)}
                className={`px-1.5 sm:px-2.5 py-2 text-xs whitespace-nowrap font-bold rounded-lg transition-all cursor-pointer ${
                  gridSize === size
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mb-2 flex w-full max-w-4xl shrink-0 flex-wrap items-center justify-end gap-2 px-3 sm:px-4">
        <span className="mr-auto text-xs font-bold text-indigo-700" aria-live="polite">학습완료 {learningProgress.completed} / {learningProgress.total}</span>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-bold text-indigo-700" aria-live="polite" aria-label="전체 정답 진행">{solvedWordIds.length} / {puzzle?.words.length ?? 0}</span>
          <button type="button" onClick={() => { setShowHints(false); startNewGame(level, gridSize); }}
            className="min-h-11 rounded-xl bg-indigo-50 px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-600">새 퍼즐</button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex min-h-0 flex-1 flex-col w-full mx-auto overflow-y-auto px-3 sm:px-4">
        {wordProgressError && <p role="alert" className="mb-3 text-sm text-rose-700">{wordProgressError}</p>}
        {puzzle && puzzle.words.length === 0 && (
          <p role="status" className="mb-3 rounded-xl bg-white p-4 text-sm text-slate-600">
            이 난이도에서 출제할 미학습 단어가 없습니다. 단어장에서 학습완료 기록을 확인해 주세요.
          </p>
        )}
        {/* 십자낱말 보드 */}
        <div className="flex w-full shrink-0 flex-col gap-2">
        <div className="relative min-w-0">
        <CrosswordBoard
          puzzle={puzzle}
          userGrid={userGrid}
          selectedWord={selectedWord}
          solvedWordIds={solvedWordIds}
          onSelectWord={selectWord}
        />
        {showHints && puzzle && (
        <section id="puzzle-hints" aria-label="퍼즐 문제" onKeyDown={(event) => {
          if (event.key === 'Escape') { event.stopPropagation(); closeHints(); }
        }} className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-sm">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">문제 전체 보기</h2>
            <button ref={closeHintsRef} type="button" onClick={closeHints}
              className="min-h-11 rounded-lg bg-white px-3 text-sm font-bold text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">닫기</button>
          </div>
          <div className="min-h-0 flex-1">
          <HintListSection
            words={puzzle.words}
            solvedWordIds={solvedWordIds}
            selectedWord={selectedWord}
            onSelectWord={(word) => { closeHints(); selectWord(word); }}
          />
          </div>
        </section>
        )}
        </div>
        <button ref={hintsButtonRef} type="button" aria-expanded={showHints} aria-controls={showHints ? 'puzzle-hints' : undefined}
          disabled={!puzzle} onClick={() => showHints ? closeHints() : setShowHints(true)}
          className="min-h-11 w-full shrink-0 rounded-xl border border-indigo-200 bg-white px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50">
          문제 전체 보기
        </button>
        </div>
      </main>

      {/* 정답 입력 모달 */}
      <WordInputModal
        isOpen={isInputModalOpen}
        word={selectedWord}
        currentLetters={selectedWordCurrentLetters}
        onClose={closeInputModal}
        onSubmit={submitWordAnswer}
        onMistake={wordProgressStore.recordMistake}
        onReveal={revealWordLetter}
      />

      {/* 퍼즐 완주 축하 모달 */}
      {puzzle && (
        <PuzzleCompletionModal
          isOpen={isCompletionModalOpen}
          words={puzzle.words}
          onClose={closeCompletionModal}
          onNewGame={() => startNewGame(level, gridSize)}
        />
      )}
    </div>
  );
}
