import { Button } from '@toss/tds-mobile';
import type { CrosswordWord } from '@t-crossword/core';

export function ClueButton({ word, solved, onSelect }: {
  word: CrosswordWord;
  solved: boolean;
  onSelect: () => void;
}) {
  const synonym = word.synonym?.trim();
  return <Button className="clue-button" display="block" variant="weak" size="medium" disabled={solved} onClick={onSelect}
    aria-label={`${word.number}번 ${word.meaning}, ${word.word.length}글자${synonym ? `, 동의어: ${synonym}` : ''}${solved ? ', 완료' : ''}`}>
    <span className="clue-content">
      <span className="clue-text"><span>{solved ? '✓' : `${word.number}.`} {word.meaning.split(/[;；]/)[0]}</span><small>{word.word.length}자</small></span>
      {synonym && <span className="clue-synonym">동의어: {synonym}</span>}
    </span>
  </Button>;
}
