import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { wordProgressStore } from '../adapters/wordProgress.js';
import {
  defaultVocabList,
  levelLearningProgress,
  generateCrossword, vocabularyForProgress,
  WordBankService,
  type CrosswordPuzzle,
  type CrosswordWord,
  type DifficultyLevel,
  type GridSize,
  type WordItem,
} from '@t-crossword/core';

export interface UseCrosswordGameOptions {
  initialLevel?: DifficultyLevel;
  initialGridSize?: GridSize;
  vocabList?: WordItem[];
}

export function useCrosswordGame({
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
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const startNewGame = useCallback(
    (newLevel: DifficultyLevel = level, newSize: GridSize = gridSize) => {
      const latest = wordProgressStore.getSnapshot();
      const words = vocabularyForProgress(wordBank.getAllWords(), latest.completedWordIds, latest.hintUsedWordIds, latest.dismissedMistakeWordIds);
      const newPuzzle = generateCrossword(words, newLevel, newSize);
      setPuzzle(newPuzzle);
      setLevel(newLevel);
      setGridSize(newSize);
      setUserGrid(Array.from({ length: newSize }, () => Array(newSize).fill('')));
      setSolvedWordIds([]);
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

  const revealWordLetter = useCallback((wordId: string, index: number) => {
    const word = puzzle?.words.find(item => item.id === wordId);
    if (!word || !Number.isInteger(index) || index < 0 || index >= word.word.length) return;
    const row = word.startRow + (word.orientation === 'down' ? index : 0);
    const col = word.startCol + (word.orientation === 'across' ? index : 0);
    setUserGrid(previous => {
      const next = previous.map(cells => [...cells]);
      next[row][col] = word.word[index].toUpperCase();
      return next;
    });
    wordProgressStore.markHintUsed(wordId);
  }, [puzzle]);

  const submitWordAnswer = useCallback(
    (wordId: string, answer: string): boolean => {
      if (!puzzle) return false;
      const targetWord = puzzle.words.find((word) => word.id === wordId);
      if (!targetWord) return false;
      if (answer.trim().toUpperCase() !== targetWord.word.toUpperCase()) {
        wordProgressStore.recordMistake(wordId);
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
    learningProgress: levelLearningProgress(vocabList, level, progress.completedWordIds),
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
    setLevel,
    setGridSize,
  };
}
