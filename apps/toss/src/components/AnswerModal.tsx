import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@toss/tds-mobile';
import { maskWordInExample, type CrosswordWord } from '@t-crossword/core';
import { Modal } from './Modal.js';
import type { HintReveal } from '@t-crossword/contracts';

export function AnswerModal({ word, currentLetters = [], onClose, onSubmit, hintBalance = null, hintUsedCount = 0, onUseHint }: {
  word: CrosswordWord;
  currentLetters?: string[];
  onClose: () => void;
  onSubmit: (word: CrosswordWord, answer: string) => boolean | Promise<boolean>;
  hintBalance?: number | null;
  hintUsedCount?: number;
  onUseHint?: (index: number) => Promise<HintReveal>;
}) {
  const length = word.word.length;
  const [letters, setLetters] = useState(() => Array.from({ length }, (_, index) => currentLetters[index] || ''));
  const [error, setError] = useState('');
  const [incorrectIndices, setIncorrectIndices] = useState<number[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const feedbackUsed = useRef(0);
  const submitted = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const hintPending = useRef(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const initialFocusIndex = useRef(Array.from({ length }, (_, index) => index).find((index) => !currentLetters[index]));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const index = initialFocusIndex.current;
      if (index !== undefined) { inputs.current[index]?.focus(); inputs.current[index]?.select(); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const focus = (index: number, direction: -1 | 1) => {
    for (let next = index + direction; next >= 0 && next < length; next += direction) {
      if (!currentLetters[next]) { inputs.current[next]?.focus(); inputs.current[next]?.select(); return; }
    }
  };

  const submit = async (values: string[]) => {
    if (submitted.current || hintPending.current) return;
    if (values.some((letter) => !letter)) { setError('모든 칸에 글자를 입력해 주세요.'); return; }
    submitted.current = true;
    setIsSubmitting(true); setError('');
    try {
    if (!await onSubmit(word, values.join(''))) {
      submitted.current = false;
      setError('정답이 아닙니다. 다시 입력해 주세요.');
    }
    } catch (error) {
      submitted.current = false;
      setError(error instanceof Error ? error.message : '정답을 제출하지 못했습니다. 다시 시도해 주세요.');
    } finally { setIsSubmitting(false); }
  };

  const changeLetter = (index: number, value: string) => {
    if (currentLetters[index] || submitted.current || hintPending.current) return;
    const letter = value.slice(-1).toUpperCase();
    if (letter && !/^[A-Z]$/.test(letter)) { setError('영문으로 입력해 주세요.'); return; }
    setError('');
    const next = [...letters]; next[index] = letter; setLetters(next);
    const incorrect = Boolean(letter && letter !== word.word[index]?.toUpperCase() && feedbackUsed.current < length);
    setIncorrectIndices((previous) => [...previous.filter((item) => item !== index), ...(incorrect ? [index] : [])]);
    if (incorrect) { feedbackUsed.current++; setFeedbackCount(feedbackUsed.current); }
    if (letter) focus(index, 1);
    if (next.join('') === word.word.toUpperCase()) void submit(next);
  };

  const keyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (hintPending.current || submitted.current) { event.preventDefault(); return; }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); focus(index, event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Backspace' && !letters[index] && !currentLetters[index]) {
      event.preventDefault();
      for (let previous = index - 1; previous >= 0; previous--) {
        if (currentLetters[previous]) continue;
        const next = [...letters]; next[previous] = ''; setLetters(next);
        setIncorrectIndices((values) => values.filter((value) => value !== previous));
        inputs.current[previous]?.focus();
        return;
      }
    }
  };

  const requestHint = async () => {
    if (!onUseHint || hintPending.current || submitted.current) return;
    const index = letters.findIndex((letter, position) => !letter && !currentLetters[position]);
    if (index < 0) { setError('힌트는 빈 칸에만 사용할 수 있습니다. 글자를 지운 뒤 사용해 주세요.'); return; }
    hintPending.current = true; setIsHintLoading(true); setError('');
    try {
      const result = await onUseHint(index);
      const next = [...letters]; next[result.index] = result.letter; setLetters(next);
      setIncorrectIndices((previous) => previous.filter((position) => position !== result.index));
      hintPending.current = false;
      if (next.join('') === word.word.toUpperCase()) await submit(next);
    } catch (error) { setError(error instanceof Error ? error.message : '힌트를 받지 못했습니다. 다시 시도해 주세요.'); }
    finally { hintPending.current = false; setIsHintLoading(false); }
  };

  return <Modal className="answer-modal" title={`${word.orientation === 'across' ? '가로' : '세로'} ${word.number}번, ${length}자`} onClose={() => { if (!hintPending.current && !isSubmitting) onClose(); }}>
    <p className="meaning">{word.meaning}</p>
    {word.synonym?.trim() && <p className="answer-synonym">동의어: {word.synonym}</p>}
    {word.example?.trim() && <p className="example" lang="en">{maskWordInExample(word.example, word.word)}</p>}
    <form onSubmit={(event) => { event.preventDefault(); void submit(letters); }} aria-busy={isSubmitting || isHintLoading}>
      <div className="answer-cells" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, maxWidth: `${length * 48}px` }}>
        {letters.map((letter, index) => <input key={index} type="text" value={letter} maxLength={1}
          aria-label={`${length}자 중 ${index + 1}번째 글자`} aria-invalid={incorrectIndices.includes(index)}
          className={`answer-cell${incorrectIndices.includes(index) ? ' incorrect' : ''}`}
          readOnly={Boolean(currentLetters[index]) || isHintLoading || isSubmitting} tabIndex={currentLetters[index] ? -1 : 0}
          autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text"
          ref={(element) => { inputs.current[index] = element; }}
          onChange={(event) => changeLetter(index, event.target.value)} onKeyDown={(event) => keyDown(index, event)} />)}
      </div>
      <div className="answer-guidance">
        <p>오답 글자의 붉은색 안내는 창을 열 때마다 단어의 글자 수만큼 제공됩니다.</p>
        <p role="status">오답 표시 남은 횟수: {length - feedbackCount} / {length}회</p>
        <p>횟수를 모두 사용해도 입력과 정답 제출은 계속할 수 있습니다. 창을 다시 열면 초기화됩니다.</p>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="answer-actions">
        <Button type="button" variant="weak" disabled={!onUseHint || hintBalance === null || hintBalance <= 0 || hintUsedCount >= word.hintLimit || isHintLoading || isSubmitting} loading={isHintLoading} onClick={() => { void requestHint(); }}>
          {onUseHint ? `힌트 (${hintUsedCount}/${word.hintLimit}) · ${hintBalance ?? '확인 중'}개 남음` : '힌트 연결 필요'}
        </Button>
        <Button type="submit" disabled={isHintLoading || isSubmitting} loading={isSubmitting}>정답입력</Button>
      </div>
    </form>
  </Modal>;
}
