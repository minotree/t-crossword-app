import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@toss/tds-mobile';
import { maskWordInExample, type CrosswordWord } from '@t-crossword/core';
import { Modal } from './Modal.js';

export function AnswerModal({ word, currentLetters = [], onClose, onSubmit }: {
  word: CrosswordWord;
  currentLetters?: string[];
  onClose: () => void;
  onSubmit: (word: CrosswordWord, answer: string) => boolean | Promise<boolean>;
}) {
  const length = word.word.length;
  const [letters, setLetters] = useState(() => Array.from({ length }, (_, index) => currentLetters[index] || ''));
  const [error, setError] = useState('');
  const [incorrectIndices, setIncorrectIndices] = useState<number[]>([]);
  const submitted = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const initialFocusIndex = useRef(Array.from({ length }, (_, index) => index).find((index) => !currentLetters[index]));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const index = initialFocusIndex.current;
      if (index !== undefined) { inputs.current[index]?.focus({ preventScroll: true }); inputs.current[index]?.select(); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const focus = (index: number, direction: -1 | 1) => {
    for (let next = index + direction; next >= 0 && next < length; next += direction) {
      if (!currentLetters[next]) { inputs.current[next]?.focus({ preventScroll: true }); inputs.current[next]?.select(); return; }
    }
  };

  const submit = async (values: string[]) => {
    if (submitted.current) return;
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
    if (currentLetters[index] || submitted.current) return;
    const letter = value.slice(-1).toUpperCase();
    if (letter && !/^[A-Z]$/.test(letter)) { setError('영문으로 입력해 주세요.'); return; }
    setError('');
    const next = [...letters]; next[index] = letter; setLetters(next);
    const incorrect = Boolean(letter && letter !== word.word[index]?.toUpperCase());
    setIncorrectIndices((previous) => [...previous.filter((item) => item !== index), ...(incorrect ? [index] : [])]);
    if (letter) focus(index, 1);
    if (next.join('') === word.word.toUpperCase()) void submit(next);
  };

  const keyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (submitted.current) { event.preventDefault(); return; }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); focus(index, event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Backspace' && !letters[index] && !currentLetters[index]) {
      event.preventDefault();
      for (let previous = index - 1; previous >= 0; previous--) {
        if (currentLetters[previous]) continue;
        const next = [...letters]; next[previous] = ''; setLetters(next);
        setIncorrectIndices((values) => values.filter((value) => value !== previous));
        inputs.current[previous]?.focus({ preventScroll: true });
        return;
      }
    }
  };

  return <Modal className="answer-modal" title={`${word.orientation === 'across' ? '가로' : '세로'} ${word.number}번, ${length}자`} onClose={() => { if (!isSubmitting) onClose(); }}>
    <p className="meaning">{word.meaning}</p>
    {word.synonym?.trim() && <p className="answer-synonym">동의어: {word.synonym}</p>}
    {word.example?.trim() && <p className="example" lang="en">{maskWordInExample(word.example, word.word)}</p>}
    <form onSubmit={(event) => { event.preventDefault(); void submit(letters); }} aria-busy={isSubmitting}>
      <div className="answer-cells" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, maxWidth: `${length * 48}px` }}>
        {letters.map((letter, index) => <input key={index} type="text" value={letter} maxLength={1}
          aria-label={`${length}자 중 ${index + 1}번째 글자`} aria-invalid={incorrectIndices.includes(index)}
          className={`answer-cell${incorrectIndices.includes(index) ? ' incorrect' : ''}`}
          readOnly={Boolean(currentLetters[index]) || isSubmitting} tabIndex={currentLetters[index] ? -1 : 0}
          autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" lang="en" enterKeyHint="done"
          ref={(element) => { inputs.current[index] = element; }}
          onChange={(event) => changeLetter(index, event.target.value)} onKeyDown={(event) => keyDown(index, event)} />)}
      </div>
      <div className="answer-guidance">
        <p>틀린 글자는 횟수 제한 없이 붉은색으로 표시됩니다.</p>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="answer-actions">
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>정답입력</Button>
      </div>
    </form>
  </Modal>;
}
