import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { wordProgressStore } from '../adapters/wordProgress.js';
import {
  consumeGlobalHint,
  claimPuzzleCompletionReward,
  getUserHintBalance,
  InsufficientHintError,
  type SupabaseClient,
} from '@t-crossword/data';
import {
  defaultVocabList,
  generateCrossword, vocabularyForProgress,
  WordBankService,
  type CrosswordPuzzle,
  type CrosswordWord,
  type DifficultyLevel,
  type GridSize,
  type WordItem,
} from '@t-crossword/core';

export interface UseCrosswordGameOptions {
  client: SupabaseClient;
  userId: string | null;
  initialLevel?: DifficultyLevel;
  initialGridSize?: GridSize;
  vocabList?: WordItem[];
}

export function useCrosswordGame({
  client,
  userId,
  initialLevel = 'beginner',
  initialGridSize = 10,
  vocabList = defaultVocabList,
}: UseCrosswordGameOptions) {
  const progress = useSyncExternalStore(wordProgressStore.subscribe, wordProgressStore.getSnapshot);
  const wordBank = useMemo(
    () => new WordBankService(vocabList.map((word) => ({ ...word }))),
    [vocabList]
  );
  const [level, setLevel] = useState<DifficultyLevel>(initialLevel);
  const [gridSize, setGridSize] = useState<GridSize>(initialGridSize);
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    Array.from({ length: initialGridSize }, () => Array(initialGridSize).fill(''))
  );
  const [solvedWordIds, setSolvedWordIds] = useState<string[]>([]);
  const [wordHintUsage, setWordHintUsage] = useState<Record<string, number>>({});
  const [globalHintBalance, setGlobalHintBalance] = useState(0);
  const [isHintBalanceLoading, setIsHintBalanceLoading] = useState(true);
  const [hintBalanceError, setHintBalanceError] = useState<string | null>(null);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const roundId = useRef('');
  const rewardAttempt = useRef<string | null>(null);
  const [completionRewardStatus, setCompletionRewardStatus] = useState<'idle' | 'pending' | 'granted' | 'error'>('idle');
  const [completionRewardError, setCompletionRewardError] = useState<string | null>(null);
  const activeUserId = useRef(userId);
  useEffect(() => { activeUserId.current = userId; }, [userId]);

  const claimCompletionReward = useCallback(async () => {
    if (!userId || !puzzle?.words.length || solvedWordIds.length !== puzzle.words.length) return;
    const id = roundId.current;
    if (rewardAttempt.current === id) return;
    rewardAttempt.current = id;
    setCompletionRewardStatus('pending');
    setCompletionRewardError(null);
    try {
      const balance = await claimPuzzleCompletionReward(client, id);
      if (activeUserId.current !== userId) return;
      setGlobalHintBalance(balance);
      if (roundId.current === id) setCompletionRewardStatus('granted');
    } catch (error: unknown) {
      if (roundId.current !== id || activeUserId.current !== userId) return;
      rewardAttempt.current = null;
      setCompletionRewardStatus('error');
      setCompletionRewardError(error instanceof Error ? error.message : '보상 지급에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [client, userId, puzzle, solvedWordIds]);

  useEffect(() => {
    if (completionRewardStatus === 'idle') void claimCompletionReward();
  }, [claimCompletionReward, completionRewardStatus]);

  useEffect(() => {
    let isActive = true;
    setGlobalHintBalance(0);
    setHintBalanceError(null);

    if (!userId) {
      setIsHintBalanceLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsHintBalanceLoading(true);
    void getUserHintBalance(client, userId)
      .then((balance) => {
        if (isActive) setGlobalHintBalance(balance);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setHintBalanceError(
            error instanceof Error ? error.message : 'Could not load hint balance.'
          );
        }
      })
      .finally(() => {
        if (isActive) setIsHintBalanceLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [client, userId]);

  const startNewGame = useCallback(
    (newLevel: DifficultyLevel = level, newSize: GridSize = gridSize) => {
      const words = vocabularyForProgress(wordBank.getAllWords(), wordProgressStore.getSnapshot().completedWordIds);
      const newPuzzle = generateCrossword(words, newLevel, newSize);
      roundId.current = crypto.randomUUID();
      rewardAttempt.current = null;
      setCompletionRewardStatus('idle');
      setCompletionRewardError(null);
      setPuzzle(newPuzzle);
      setLevel(newLevel);
      setGridSize(newSize);
      setUserGrid(Array.from({ length: newSize }, () => Array(newSize).fill('')));
      setSolvedWordIds([]);
      setWordHintUsage({});
      setTotalHintsUsed(0);
      setSelectedWord(null);
      setIsInputModalOpen(false);
      setIsCompletionModalOpen(false);
    },
    [wordBank, level, gridSize]
  );

  useEffect(() => {
    startNewGame(initialLevel, initialGridSize);
    // The initial puzzle should only be generated when the hook mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectWord = useCallback((word: CrosswordWord) => {
    setSelectedWord(word);
    setIsInputModalOpen(true);
  }, []);

  const closeInputModal = useCallback(() => {
    setIsInputModalOpen(false);
    setSelectedWord(null);
  }, []);

  const submitWordAnswer = useCallback(
    (wordId: string, answer: string): boolean => {
      if (!puzzle) return false;
      const targetWord = puzzle.words.find((word) => word.id === wordId);
      if (!targetWord || answer.trim().toUpperCase() !== targetWord.word.toUpperCase()) {
        return false;
      }

      const expected = targetWord.word.toUpperCase();
      wordBank.markWordAsUsed(wordId);
      wordProgressStore.markCompleted(wordId);
      setUserGrid((previousGrid) => {
        const nextGrid = previousGrid.map((row) => [...row]);
        for (let index = 0; index < expected.length; index++) {
          const row =
            targetWord.orientation === 'across'
              ? targetWord.startRow
              : targetWord.startRow + index;
          const col =
            targetWord.orientation === 'across'
              ? targetWord.startCol + index
              : targetWord.startCol;
          nextGrid[row][col] = expected[index];
        }
        return nextGrid;
      });

      setSolvedWordIds((previousIds) => {
        if (previousIds.includes(wordId)) return previousIds;
        const nextIds = [...previousIds, wordId];
        if (nextIds.length >= puzzle.words.length) setIsCompletionModalOpen(true);
        return nextIds;
      });

      closeInputModal();
      return true;
    },
    [puzzle, closeInputModal, wordBank]
  );

  const useWordHint = useCallback(
    async (wordId: string, targetIndex: number): Promise<{ index: number; letter: string } | null> => {
      if (!navigator.onLine) throw new Error('힌트 사용은 인터넷 연결이 필요합니다.');
      if (!puzzle || !userId || globalHintBalance <= 0) return null;

      const targetWord = puzzle.words.find((word) => word.id === wordId);
      if (!targetWord) return null;

      const currentUsed = wordHintUsage[wordId] || 0;
      if (currentUsed >= targetWord.hintLimit) return null;

      const expected = targetWord.word.toUpperCase();
      const unrevealedIndices: number[] = [];
      for (let index = 0; index < expected.length; index++) {
        const row =
          targetWord.orientation === 'across'
            ? targetWord.startRow
            : targetWord.startRow + index;
        const col =
          targetWord.orientation === 'across'
            ? targetWord.startCol + index
            : targetWord.startCol;
        if (userGrid[row]?.[col] !== expected[index]) unrevealedIndices.push(index);
      }

      if (!Number.isInteger(targetIndex) || !unrevealedIndices.includes(targetIndex)) return null;

      let nextBalance: number;
      try {
        nextBalance = await consumeGlobalHint(client);
      } catch (error) {
        if (error instanceof InsufficientHintError) setGlobalHintBalance(0);
        throw error;
      }

      const revealedLetter = expected[targetIndex];
      wordProgressStore.markHintUsed(wordId);
      setGlobalHintBalance(nextBalance);
      setUserGrid((previousGrid) => {
        const nextGrid = previousGrid.map((row) => [...row]);
        const row =
          targetWord.orientation === 'across'
            ? targetWord.startRow
            : targetWord.startRow + targetIndex;
        const col =
          targetWord.orientation === 'across'
            ? targetWord.startCol + targetIndex
            : targetWord.startCol;
        nextGrid[row][col] = revealedLetter;
        return nextGrid;
      });
      setWordHintUsage((previousUsage) => ({
        ...previousUsage,
        [wordId]: (previousUsage[wordId] || 0) + 1,
      }));
      setTotalHintsUsed((count) => count + 1);

      if (unrevealedIndices.length === 1) {
        wordBank.markWordAsUsed(wordId);
        wordProgressStore.markCompleted(wordId);
        setSolvedWordIds((previousIds) => {
          if (previousIds.includes(wordId)) return previousIds;
          const nextIds = [...previousIds, wordId];
          if (nextIds.length >= puzzle.words.length) setIsCompletionModalOpen(true);
          return nextIds;
        });
      }

      return { index: targetIndex, letter: revealedLetter };
    },
    [client, globalHintBalance, puzzle, userGrid, userId, wordHintUsage, wordBank]
  );

  const selectedWordCurrentLetters = useMemo(() => {
    if (!selectedWord || !puzzle) return [];
    return Array.from({ length: selectedWord.word.length }, (_, index) => {
      const row =
        selectedWord.orientation === 'across'
          ? selectedWord.startRow
          : selectedWord.startRow + index;
      const col =
        selectedWord.orientation === 'across'
          ? selectedWord.startCol + index
          : selectedWord.startCol;
      return userGrid[row]?.[col] || '';
    });
  }, [selectedWord, puzzle, userGrid]);

  const closeCompletionModal = useCallback(() => {
    setIsCompletionModalOpen(false);
  }, []);

  return {
    wordProgressError: progress.error,
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
    setLevel,
    setGridSize,
  };
}
