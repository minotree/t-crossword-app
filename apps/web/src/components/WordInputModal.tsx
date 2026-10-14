import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react';
import type { CrosswordWord } from '@t-crossword/core';
import { maskWordInExample } from '@t-crossword/core';

interface WordInputModalProps {
  isOpen: boolean;
  word: CrosswordWord | null;
  currentLetters: string[];
  hintUsedCount: number;
  globalHintBalance: number;
  isHintBalanceLoading: boolean;
  onClose: () => void;
  onSubmit: (wordId: string, answer: string) => boolean;
  onUseHint: (wordId: string) => Promise<{ index: number; letter: string } | null>;
}

export const WordInputModal: FC<WordInputModalProps> = (props) => {
  if (!props.isOpen || !props.word) return null;
  return <ActiveWordInputModal {...props} word={props.word} />;
};

type ActiveWordInputModalProps = Omit<WordInputModalProps, 'word'> & {
  word: CrosswordWord;
};

const ActiveWordInputModal: FC<ActiveWordInputModalProps> = ({
  word,
  currentLetters,
  hintUsedCount,
  globalHintBalance,
  isHintBalanceLoading,
  onClose,
  onSubmit,
  onUseHint,
}) => {
  const length = word.word.length;
  const [inputs, setInputs] = useState<string[]>(() =>
    Array.from({ length }, (_, index) => currentLetters[index] || '')
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setInputs(Array.from({ length }, (_, index) => currentLetters[index] || ''));
    setErrorMessage('');
    setIsSuccess(false);

    const firstEmptyIndex = currentLetters.findIndex((letter) => !letter);
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    const focusTimer = window.setTimeout(() => {
      inputRefs.current[targetIndex]?.focus();
      inputRefs.current[targetIndex]?.select();
    }, 50);

    return () => window.clearTimeout(focusTimer);
  }, [word.id, length, currentLetters]);

  const submitAnswer = (answer: string) => {
    if (onSubmit(word.id, answer)) {
      setIsSuccess(true);
      setErrorMessage('');
      return true;
    }

    setErrorMessage('정답이 아닙니다. 다시 입력해 주세요.');
    return false;
  };

  const handleInputChange = (index: number, value: string) => {
    setErrorMessage('');
    const letter = value.slice(-1).toUpperCase();
    if (letter && !/^[A-Z]$/.test(letter)) {
      setErrorMessage('영문으로 입력해 주세요. 한/영 키로 입력 언어를 변경할 수 있습니다.');
      return;
    }

    const nextInputs = [...inputs];
    nextInputs[index] = letter;
    setInputs(nextInputs);

    if (letter && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    if (letter && nextInputs.every((item) => item.length === 1)) {
      const answer = nextInputs.join('');
      if (answer === word.word.toUpperCase()) {
        setIsSuccess(true);
        window.setTimeout(() => onSubmit(word.id, answer), 250);
      }
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !inputs[index] && index > 0) {
      event.preventDefault();
      const nextInputs = [...inputs];
      nextInputs[index - 1] = '';
      setInputs(nextInputs);
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const answer = inputs.join('');
    if (answer.length !== length) {
      setErrorMessage('모든 칸에 글자를 입력해 주세요.');
      return;
    }
    submitAnswer(answer);
  };

  const handleHintClick = async () => {
    if (isHintLoading || isHintBalanceLoading) return;
    if (globalHintBalance <= 0) {
      setErrorMessage('남은 힌트가 없습니다.');
      return;
    }
    if (hintUsedCount >= word.hintLimit) {
      setErrorMessage('이 단어의 힌트를 모두 사용했습니다.');
      return;
    }

    setIsHintLoading(true);
    setErrorMessage('');
    try {
      const result = await onUseHint(word.id);
      if (!result) {
        setErrorMessage('이 단어에 힌트를 사용할 수 없습니다.');
        return;
      }

      const nextInputs = [...inputs];
      nextInputs[result.index] = result.letter;
      setInputs(nextInputs);
      if (nextInputs.every((item) => item.length === 1)) {
        const answer = nextInputs.join('');
        if (answer === word.word.toUpperCase()) {
          setIsSuccess(true);
          window.setTimeout(() => onSubmit(word.id, answer), 250);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '힌트를 불러오지 못했습니다.'
      );
    } finally {
      setIsHintLoading(false);
    }
  };

  const isHintExhausted = hintUsedCount >= word.hintLimit;
  const isHintDisabled =
    isHintLoading ||
    isHintBalanceLoading ||
    isHintExhausted ||
    globalHintBalance <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <section
        aria-labelledby="word-input-title"
        aria-modal="true"
        className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-gray-100 bg-white p-4 shadow-2xl sm:p-6"
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <div className="mb-5 text-center">
          <p className="mb-2 px-8 text-base font-bold text-indigo-700 sm:text-lg">
            {word.orientation === 'across' ? '가로' : '세로'} {word.number}번, {length}자
          </p>
          <h2
            className="px-4 text-xl font-bold leading-snug text-gray-900 sm:text-2xl"
            id="word-input-title"
          >
            {word.meaning}
          </h2>
          {word.example?.trim() && (
            <p className="mt-3 px-2 text-base leading-relaxed text-gray-600 break-words sm:text-lg">
              {maskWordInExample(word.example, word.word)}
            </p>
          )}
        </div>

        <div
          className="my-6 mx-auto grid w-full gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, maxWidth: `${length * 48}px` }}
        >
          {Array.from({ length }, (_, index) => (
            <input
              aria-label={`${length}자 중 ${index + 1}번째 글자`}
              className={`h-12 w-full min-w-0 px-0 rounded-lg border-2 text-center ${length >= 10 ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl'} font-bold uppercase outline-none focus:border-indigo-500 sm:h-14 ${
                isSuccess
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                  : inputs[index]
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950'
                    : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
              key={index}
              maxLength={1}
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

        {errorMessage && (
          <p className="mb-4 text-center text-sm font-semibold text-rose-600" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2.5">
          <button
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
              isHintDisabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
            disabled={isHintDisabled}
            onClick={() => void handleHintClick()}
            type="button"
          >
            {isHintLoading ? '힌트 불러오는 중...' : `힌트 (${hintUsedCount}/${word.hintLimit})`}
            <span className="rounded-full bg-amber-200/60 px-1.5 py-0.5 text-xs">
              {isHintBalanceLoading ? '...' : `${globalHintBalance}개 남음`}
            </span>
          </button>
          <button
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            onClick={handleSubmit}
            type="button"
          >
            정답입력
          </button>
        </div>
      </section>
    </div>
  );
};
