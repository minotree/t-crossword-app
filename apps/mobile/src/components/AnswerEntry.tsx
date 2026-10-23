import { useEffect, useRef, useState } from 'react';
import { IonButton } from '@ionic/react';
import { maskWordInExample, type CrosswordWord } from '@t-crossword/core';
import { letterFeedback, updateIncorrectCells } from '../adapters/letterFeedback.js';

export function AnswerEntry({ word, known, error, onSubmit, onClose, busy = false, hintBalance = null, hintUsed = 0, onUseHint }: {
  word: CrosswordWord; known: string[]; error: string; onSubmit: (answer: string) => void; onClose: () => void;
  busy?: boolean; hintBalance?: number | null; hintUsed?: number; onUseHint?: (index: number) => Promise<void>;
}) {
  const [letters, setLetters] = useState(() => [...known]);
  const [wrong, setWrong] = useState<number[]>([]);
  const budget = useRef(word.word.length);
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const submitted = useRef('');
  const knownSignature = known.join('|');
  useEffect(() => { setLetters(previous => previous.map((letter, index) => known[index] || letter)); }, [knownSignature]);
  useEffect(() => {
    const answer = letters.map((letter, index) => known[index] || letter).join('');
    if (!busy && answer === word.word && submitted.current !== answer) { submitted.current = answer; onSubmit(answer); }
  }, [knownSignature, busy]);
  const focus = (index: number, direction = 1) => {
    while (index >= 0 && index < known.length && known[index]) index += direction;
    fields.current[index]?.focus({ preventScroll: true });
  };
  useEffect(() => { const frame = requestAnimationFrame(() => focus(0)); return () => cancelAnimationFrame(frame); }, []);
  const update = (index: number, value: string) => {
    if (known[index] || busy) return;
    const letter = value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
    const next = letters.map((current, position) => position === index ? letter : current);
    setLetters(next); submitted.current = '';
    const feedback = letterFeedback(letter, word.word[index], budget.current);
    budget.current = feedback.remaining;
    setWrong(previous => updateIncorrectCells(previous, index, feedback.highlight));
    if (letter) focus(index + 1);
    const answer = next.join('');
    if (answer === word.word && submitted.current !== answer) { submitted.current = answer; onSubmit(answer); }
  };
  return <form onSubmit={event => { event.preventDefault(); if (!busy) onSubmit(letters.join('')); }} aria-busy={busy}>
    <h2>{word.orientation === 'across' ? '가로' : '세로'} {word.number}번</h2>
    <p>{word.meaning}</p>
    {word.synonym && <p className="mobile-synonym">{word.synonym}</p>}
    {word.example && <p lang="en">{maskWordInExample(word.example, word.word)}</p>}
    <div className="mobile-letter-inputs" style={{ gridTemplateColumns: `repeat(${letters.length}, minmax(0, 1fr))`, maxWidth: `${letters.length * 44}px` }}>{letters.map((letter, index) => <input key={index} ref={element => { fields.current[index] = element; }}
      aria-label={`${index + 1}번째 글자`} aria-invalid={wrong.includes(index) || undefined} readOnly={Boolean(known[index])}
      value={letter} autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text"
      onCompositionEnd={event => update(index, event.currentTarget.value)}
      onChange={event => { if (!('isComposing' in event.nativeEvent) || !event.nativeEvent.isComposing) update(index, event.target.value); }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); focus(index + (event.key === 'ArrowLeft' ? -1 : 1), event.key === 'ArrowLeft' ? -1 : 1); }
        if (event.key === 'Backspace' && !letter) { event.preventDefault(); focus(index - 1, -1); }
      }} />)}</div>
    {error && <p role="alert" className="mobile-error">{error}</p>}
    <div className="mobile-answer-actions"><IonButton fill="outline" disabled={busy || !onUseHint || hintBalance === null || hintBalance <= 0 || hintUsed >= word.hintLimit} onPointerDown={event => event.preventDefault()} onClick={() => {
      const index = letters.findIndex((letter, position) => !letter && !known[position]);
      if (index >= 0 && onUseHint) {
        const next = letters.findIndex((letter, position) => position !== index && !letter && !known[position]);
        if (next >= 0) focus(next);
        void onUseHint(index);
      }
    }}>{onUseHint ? `힌트 (${hintUsed}/${word.hintLimit})` : '힌트 연결 필요'}</IonButton><IonButton type="submit" disabled={busy}>정답 확인</IonButton><IonButton fill="clear" disabled={busy} onClick={onClose}>닫기</IonButton></div>
  </form>;
}
