import type { CrosswordWord } from '@t-crossword/core';

export function ClueButton({ word, solved, onSelect }: { word: CrosswordWord; solved: boolean; onSelect(): void }) {
  return <button type="button" className="mobile-clue-button" disabled={solved} onClick={onSelect}>
    <span className="mobile-clue-line"><span>{solved ? '✓' : `${word.number}.`} {word.meaning}</span><small>{word.word.length}자</small></span>
    {word.synonym?.trim() && <span className="mobile-clue-synonym">동의어: {word.synonym}</span>}
  </button>;
}
