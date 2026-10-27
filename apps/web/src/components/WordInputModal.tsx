import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react';
import type { CrosswordWord } from '@t-crossword/core';
import { firstIncorrectLetterIndex, getModalHintLimit, maskWordInExample } from '@t-crossword/core';
import { followAnswerViewport } from '../adapters/answerViewport.js';

interface WordInputModalProps {
  isOpen: boolean;
  word: CrosswordWord | null;
  currentLetters: string[];
  onClose: () => void;
  onSubmit: (wordId: string, answer: string) => boolean;
  onMistake?: (wordId: string) => void;
  onReveal?: (wordId: string, index: number) => void;
}

export const WordInputModal: FC<WordInputModalProps> = (props) => {
  if (!props.isOpen || !props.word) return null;
  return <ActiveWordInputModal key={props.word.id} {...props} word={props.word} />;
};

type ActiveWordInputModalProps = Omit<WordInputModalProps, 'word'> & {
  word: CrosswordWord;
};

const ActiveWordInputModal: FC<ActiveWordInputModalProps> = ({
  word,
  currentLetters,
  onClose,
  onSubmit,
  onMistake,
  onReveal,
}) => {
  const length = word.word.length;
  const [inputs, setInputs] = useState<string[]>(() =>
    Array.from({ length }, (_, index) => currentLetters[index] || '')
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [incorrectIndices, setIncorrectIndices] = useState<number[]>([]);
  const [remainingHints, setRemainingHints] = useState(() => getModalHintLimit(Array.from({ length }, (_, index) => currentLetters[index] || '')));
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const completionTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const initialFocusIndex = useRef(Array.from({ length }, (_, index) => index).find(index => !currentLetters[index]));
  const submitted = useRef(false);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlay.current) return followAnswerViewport(overlay.current);
  }, []);

  useEffect(() => () => {
    if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
  }, []);

  useEffect(() => {
    setInputs((previous) => Array.from({ length }, (_, index) => currentLetters[index] || previous[index] || ''));

  }, [length, currentLetters]);

  useEffect(() => {
    const targetIndex = initialFocusIndex.current;
    const focusTimer = window.setTimeout(() => {
      if (targetIndex === undefined) return;
      inputRefs.current[targetIndex]?.focus({ preventScroll: true });
      inputRefs.current[targetIndex]?.select();
    }, 50);

    return () => window.clearTimeout(focusTimer);
  }, []);

  const isLocked = (index: number) => Boolean(currentLetters[index]) || revealedIndices.includes(index);

  const findEditableIndex = (index: number, direction: -1 | 1) => {
    for (let next = index + direction; next >= 0 && next < length; next += direction) {
      if (!isLocked(next)) return next;
    }
    return -1;
  };

  const submitAnswer = (answer: string) => {
    if (submitted.current) return false;
    submitted.current = true;
    if (onSubmit(word.id, answer)) {
      setIsSuccess(true);
      setErrorMessage('');
      return true;
    }
    submitted.current = false;
    setErrorMessage('정답이 아닙니다. 다시 입력해 주세요.');
    return false;
  };

  const handleInputChange = (index: number, value: string) => {
    if (isLocked(index) || isSuccess || submitted.current) return;
    setErrorMessage('');
    const letter = value.slice(-1).toUpperCase();
    if (letter && !/^[A-Z]$/.test(letter)) {
      setErrorMessage('영문으로 입력해 주세요. 한/영 키로 입력 언어를 변경할 수 있습니다.');
      return;
    }

    const nextInputs = [...inputs];
    nextInputs[index] = letter;
    setInputs(nextInputs);
    const showError = Boolean(letter && letter !== word.word[index]?.toUpperCase());
    if (showError) onMistake?.(word.id);
    setIncorrectIndices((previous) => [
      ...previous.filter((item) => item !== index),
      ...(showError ? [index] : []),
    ]);

    const nextIndex = findEditableIndex(index, 1);
    if (letter && nextIndex !== -1) {
      inputRefs.current[nextIndex]?.focus({ preventScroll: true });
      inputRefs.current[nextIndex]?.select();
    }

    if (letter && nextInputs.every((item) => item.length === 1)) {
      const answer = nextInputs.join('');
      if (answer === word.word.toUpperCase()) {
        setIsSuccess(true);
        completionTimer.current = window.setTimeout(() => submitAnswer(answer), 250);
      }
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (isSuccess || submitted.current) { event.preventDefault(); return; }
    if (event.key === 'Backspace' && !inputs[index]) {
      event.preventDefault();
      const previousIndex = findEditableIndex(index, -1);
      if (previousIndex === -1) return;
      const nextInputs = [...inputs];
      nextInputs[previousIndex] = '';
      setInputs(nextInputs);
      setIncorrectIndices((previous) => previous.filter((item) => item !== previousIndex));
      inputRefs.current[previousIndex]?.focus({ preventScroll: true });
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = findEditableIndex(index, event.key === 'ArrowLeft' ? -1 : 1);
      if (nextIndex !== -1) inputRefs.current[nextIndex]?.focus({ preventScroll: true });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isSuccess || submitted.current) return;
    const answer = inputs.join('');
    if (answer.length !== length) {
      setErrorMessage('모든 칸에 글자를 입력해 주세요.');
      return;
    }
    submitAnswer(answer);
  };

  const revealLetter = () => {
    if (remainingHints <= 0 || isSuccess || submitted.current) return;
    const index = firstIncorrectLetterIndex(word.word, inputs);
    if (index < 0) return;
    const next = [...inputs]; next[index] = word.word[index].toUpperCase();
    setInputs(next);
    setRemainingHints(value => value - 1);
    setRevealedIndices(values => [...values, index]);
    setIncorrectIndices(values => values.filter(value => value !== index));
    setErrorMessage('');
    onReveal?.(word.id, index);
    if (next.join('') === word.word.toUpperCase()) {
      setIsSuccess(true);
      completionTimer.current = window.setTimeout(() => submitAnswer(next.join('')), 250);
    } else {
      const nextIndex = findEditableIndex(index, 1);
      if (nextIndex !== -1) { inputRefs.current[nextIndex]?.focus({ preventScroll: true }); inputRefs.current[nextIndex]?.select(); }
    }
  };

  return (
    <div ref={overlay} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-xs">
      <section
        aria-labelledby="word-input-title"
        aria-modal="true"
        className="relative flex w-full max-w-xl max-h-[min(90dvh,100%)] flex-col overflow-y-auto rounded-3xl border border-gray-100 bg-white p-4 shadow-2xl"
        role="dialog"
      >
        <div className="relative mb-2 min-h-8 shrink-0 text-center">
          <p className="px-8 text-base font-bold text-indigo-700 sm:text-lg">
            {word.orientation === 'across' ? '가로' : '세로'} {word.number}번, {length}자
          </p>
        <button
          aria-label="닫기"
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        </div>
        <section aria-label="문제 설명" tabIndex={0} className="min-h-0 overflow-y-auto overscroll-y-contain px-1 pb-1 text-center break-words">
          <h2
            className="px-4 text-xl font-bold leading-snug text-gray-900 sm:text-2xl"
            id="word-input-title"
          >
            {word.meaning}
          </h2>
          {word.synonym?.trim() && (
            <p className="mt-3 break-words px-2 text-sm font-medium text-indigo-700 sm:text-base">
              동의어: {word.synonym}
            </p>
          )}
          {word.example?.trim() && (
            <p className="mt-3 px-2 text-base leading-relaxed text-gray-600 break-words sm:text-lg">
              {maskWordInExample(word.example, word.word)}
            </p>
          )}
        </section>

        <div className="shrink-0">
        <div
          className="my-2 mx-auto grid w-full gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, maxWidth: `${length * 48}px` }}
        >
          {Array.from({ length }, (_, index) => (
            <input
              aria-label={`${length}자 중 ${index + 1}번째 글자`}
              aria-invalid={incorrectIndices.includes(index)}
              className={`h-12 w-full min-w-0 px-0 rounded-lg border-2 text-center ${length >= 10 ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl'} font-bold uppercase outline-none ${
                isSuccess
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                  : incorrectIndices.includes(index)
                    ? 'border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600'
                    : inputs[index]
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-950 focus:border-indigo-500'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-indigo-500'
              }`}
              key={index}
              maxLength={1}
              readOnly={isLocked(index) || isSuccess}
              tabIndex={isLocked(index) ? -1 : 0}
              onChange={(event) => handleInputChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              value={inputs[index] || ''}
            />
          ))}
        </div>

        <div className="mb-2 text-center text-xs leading-snug text-gray-600">
          <p>오답은 횟수 제한 없이 붉게 표시됩니다.</p>
        </div>

        {errorMessage && (
          <p className="mb-4 text-center text-sm font-semibold text-rose-600" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2.5">
          <button
            className="flex-1 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            disabled={isSuccess || remainingHints === 0 || firstIncorrectLetterIndex(word.word, inputs) < 0}
            onClick={revealLetter}
            type="button"
          >
            힌트 {remainingHints}회
          </button>
          <button
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={isSuccess}
            type="button"
          >
            정답입력
          </button>
        </div>
        </div>
      </section>
    </div>
  );
};
