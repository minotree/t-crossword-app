import { useEffect, useRef, useState } from 'react';
import { IonButton } from '@ionic/react';
import { firstIncorrectLetterIndex, getModalHintLimit, maskWordInExample, type CrosswordWord } from '@t-crossword/core';
import { letterFeedback, updateIncorrectCells } from '../adapters/letterFeedback.js';

export function AnswerEntry({ word, known, error, onSubmit, onClose, onMistake, onReveal, busy = false }: {
  word: CrosswordWord; known: string[]; error: string; onSubmit: (answer: string) => void; onClose: () => void;
  busy?: boolean;
  onMistake?: (wordId: string) => void;
  onReveal?: (index: number) => boolean;
}) {
  const [letters, setLetters] = useState(() => [...known]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [remainingHints, setRemainingHints] = useState(() => getModalHintLimit(known));
  const [revealed, setRevealed] = useState<number[]>([]);
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const submitted = useRef('');
  const knownSignature = known.join('|');
  useEffect(() => { setLetters(previous => previous.map((letter, index) => known[index] || letter)); }, [knownSignature]);
  useEffect(() => {
    const answer = letters.map((letter, index) => known[index] || letter).join('');
    if (!busy && answer === word.word && submitted.current !== answer) { submitted.current = answer; onSubmit(answer); }
  }, [knownSignature, busy]);
  const isLocked = (index: number) => Boolean(known[index]) || revealed.includes(index);
  const focus = (index: number, direction = 1) => {
    while (index >= 0 && index < known.length && isLocked(index)) index += direction;
    fields.current[index]?.focus({ preventScroll: true });
  };
  useEffect(() => { const frame = requestAnimationFrame(() => focus(0)); return () => cancelAnimationFrame(frame); }, []);
  const update = (index: number, value: string) => {
    if (isLocked(index) || busy) return;
    const letter = value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
    const next = letters.map((current, position) => position === index ? letter : current);
    setLetters(next); submitted.current = '';
    const feedback = letterFeedback(letter, word.word[index]);
    if (feedback.highlight) onMistake?.(word.id);
    setWrong(previous => updateIncorrectCells(previous, index, feedback.highlight));
    if (letter) focus(index + 1);
    const answer = next.join('');
    if (answer === word.word && submitted.current !== answer) { submitted.current = answer; onSubmit(answer); }
  };
  const revealLetter = () => {
    if (busy || remainingHints <= 0) return;
    const index = firstIncorrectLetterIndex(word.word, letters);
    if (index < 0 || (onReveal && !onReveal(index))) return;
    const next = [...letters]; next[index] = word.word[index].toUpperCase();
    setLetters(next); setRemainingHints(value => value - 1);
    setRevealed(values => [...values, index]);
    setWrong(previous => updateIncorrectCells(previous, index, false));
    const answer = next.join('');
    if (answer === word.word && submitted.current !== answer) { submitted.current = answer; onSubmit(answer); }
    else focus(index + 1);
  };
  return <form onSubmit={event => { event.preventDefault(); if (!busy) onSubmit(letters.join('')); }} aria-busy={busy}>
    <h2>{word.orientation === 'across' ? '가로' : '세로'} {word.number}번</h2>
    <section className="mobile-answer-clue" role="region" aria-label="문제 설명" tabIndex={0}>
    <p>{word.meaning}</p>
    {word.synonym && <p className="mobile-synonym">{word.synonym}</p>}
    {word.example && <p lang="en">{maskWordInExample(word.example, word.word)}</p>}
    </section>
    <div className="mobile-answer-controls">
    <div className="mobile-letter-inputs" style={{ gridTemplateColumns: `repeat(${letters.length}, minmax(0, 1fr))`, maxWidth: `${letters.length * 44}px` }}>{letters.map((letter, index) => <input key={index} ref={element => { fields.current[index] = element; }}
      aria-label={`${index + 1}번째 글자`} aria-invalid={wrong.includes(index) || undefined} readOnly={isLocked(index) || busy} tabIndex={isLocked(index) ? -1 : 0}
      value={letter} autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text"
      onCompositionEnd={event => update(index, event.currentTarget.value)}
      onChange={event => { if (!('isComposing' in event.nativeEvent) || !event.nativeEvent.isComposing) update(index, event.target.value); }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); focus(index + (event.key === 'ArrowLeft' ? -1 : 1), event.key === 'ArrowLeft' ? -1 : 1); }
        if (event.key === 'Backspace' && !letter) { event.preventDefault(); focus(index - 1, -1); }
      }} />)}</div>
    {error && <p role="alert" className="mobile-error">{error}</p>}
    <div className="mobile-answer-actions"><IonButton fill="outline" type="button" disabled={busy || remainingHints === 0 || firstIncorrectLetterIndex(word.word, letters) < 0} onClick={revealLetter}>힌트 {remainingHints}회</IonButton><IonButton type="submit" disabled={busy}>정답입력</IonButton><IonButton fill="clear" type="button" disabled={busy} onClick={onClose}>닫기</IonButton></div>
    </div>
  </form>;
}
