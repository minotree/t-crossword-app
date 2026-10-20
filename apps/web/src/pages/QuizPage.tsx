import { useCrosswordGame } from '../hooks/useCrosswordGame.js';
import { CrosswordBoard } from '../components/CrosswordBoard.js';
import { HintListSection } from '../components/HintListSection.js';
import { WordInputModal } from '../components/WordInputModal.js';
import { PuzzleCompletionModal } from '../components/PuzzleCompletionModal.js';
import type { DifficultyLevel, GridSize } from '@t-crossword/core';
import { useSupabaseAuth } from '../app/SupabaseAuthProvider.js';

export function QuizPage() {
  const { client, userId } = useSupabaseAuth();
  const {
    wordProgressError,
    level,
    gridSize,
    puzzle,
    userGrid,
    solvedWordIds,
    wordHintUsage,
    globalHintBalance,
    isHintBalanceLoading,
    hintBalanceError,
    totalHintsUsed,
    completionRewardStatus,
    completionRewardError,
    claimCompletionReward,
    selectedWord,
    selectedWordCurrentLetters,
    isInputModalOpen,
    isCompletionModalOpen,
    startNewGame,
    selectWord,
    closeInputModal,
    submitWordAnswer,
    useWordHint,
    closeCompletionModal,
  } = useCrosswordGame({ client, userId });

  const handleLevelChange = (newLevel: DifficultyLevel) => {
    startNewGame(newLevel, gridSize);
  };

  const handleGridSizeChange = (newSize: GridSize) => {
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
                초·중·고급 단어로 완성하는 영어 퍼즐
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 글로벌 힌트 잔액 배지 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
              <span>💡</span>
              <span>{isHintBalanceLoading ? '...' : globalHintBalance}</span>
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

      <div className="mx-auto mb-2 flex w-full max-w-4xl shrink-0 flex-wrap items-center justify-between gap-2 px-3 sm:px-4">
        <p className="min-w-0 flex-1 text-xs text-indigo-700">🎁 완성하면 힌트 5개를 드려요.</p>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-bold text-indigo-700" aria-live="polite" aria-label="전체 정답 진행">{solvedWordIds.length} / {puzzle?.words.length ?? 0}</span>
          <button type="button" onClick={() => startNewGame(level, gridSize)}
            className="min-h-11 rounded-xl bg-indigo-50 px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-600">새 퍼즐</button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      {hintBalanceError && (
        <p className="mx-auto mt-3 w-full max-w-4xl px-4 text-sm text-rose-700" role="alert">
          Hint balance unavailable: {hintBalanceError}
        </p>
      )}

      <main className="flex min-h-0 flex-1 flex-col w-full max-w-4xl mx-auto px-3 sm:px-4">
        {wordProgressError && <p role="alert" className="mb-3 text-sm text-rose-700">{wordProgressError}</p>}
        {puzzle && puzzle.words.length === 0 && (
          <p role="status" className="mb-3 rounded-xl bg-white p-4 text-sm text-slate-600">
            이 난이도에서 출제할 미학습 단어가 없습니다. 단어장에서 학습완료 기록을 확인해 주세요.
          </p>
        )}
        {/* 십자낱말 보드 */}
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 landscape:grid-cols-2 landscape:grid-rows-[minmax(0,1fr)]">
        <div className="min-h-0 min-w-0">
        <CrosswordBoard
          puzzle={puzzle}
          userGrid={userGrid}
          selectedWord={selectedWord}
          solvedWordIds={solvedWordIds}
        />
        </div>

        {/* 화면 방향별 배치에서도 힌트 영역만 스크롤한다. */}
        <section aria-label="퍼즐 힌트" className="min-h-0 min-w-0 overflow-hidden">
        {puzzle && (
          <HintListSection
            words={puzzle.words}
            solvedWordIds={solvedWordIds}
            selectedWord={selectedWord}
            onSelectWord={selectWord}
          />
        )}
        </section>
        </div>
      </main>

      {/* 정답 입력 모달 */}
      <WordInputModal
        isOpen={isInputModalOpen}
        word={selectedWord}
        currentLetters={selectedWordCurrentLetters}
        hintUsedCount={selectedWord ? wordHintUsage[selectedWord.id] || 0 : 0}
        globalHintBalance={globalHintBalance}
        isHintBalanceLoading={isHintBalanceLoading}
        onClose={closeInputModal}
        onSubmit={submitWordAnswer}
        onUseHint={useWordHint}
      />

      {/* 퍼즐 완주 축하 모달 */}
      {puzzle && (
        <PuzzleCompletionModal
          isOpen={isCompletionModalOpen}
          words={puzzle.words}
          totalHintsUsed={totalHintsUsed}
          rewardStatus={completionRewardStatus}
          rewardError={completionRewardError}
          onRetryReward={() => { void claimCompletionReward(); }}
          onClose={closeCompletionModal}
          onNewGame={() => startNewGame(level, gridSize)}
        />
      )}
    </div>
  );
}
