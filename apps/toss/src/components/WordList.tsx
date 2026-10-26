import { memo } from 'react';
import { Button } from '@toss/tds-mobile';
import type { defaultVocabList } from '@t-crossword/core';

const levelNames = { beginner: '초급', intermediate: '중급', advanced: '고급', special: '특급' };

// Keep the existing cards out of urgent search-input and wallet updates.
export const WordList = memo(function WordList({ words, visibleCount, completed, bookmarked, mistakes, onBookmark, onDismiss }: {
  words: typeof defaultVocabList;
  visibleCount: number;
  completed: ReadonlySet<string>;
  bookmarked: ReadonlySet<string>;
  mistakes: boolean;
  onBookmark: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return <ul className="word-list">{words.slice(0, visibleCount).map((word) => <li key={word.id}>
    <div><h3 lang="en">{word.word}</h3><small>{levelNames[word.level]} · {word.partOfSpeech}{completed.has(word.id) || word.isQuizUsed ? ' · 학습완료' : ''}</small><p>{word.meaning}</p>{word.synonym && <p className="secondary word-synonym">동의어: {word.synonym}</p>}{word.example && <p className="example"><span lang="en">{word.example}</span><br />{word.exampleMeaning}</p>}</div>
    <Button size="small" variant="weak" aria-label={`${word.word} 즐겨찾기`} aria-pressed={bookmarked.has(word.id)} onClick={() => onBookmark(word.id)}>{bookmarked.has(word.id) ? '★' : '☆'}</Button>
    {mistakes && <Button size="small" variant="weak" aria-label={`${word.word} 오답노트에서 삭제`} onClick={() => onDismiss(word.id)}>삭제</Button>}
  </li>)}</ul>;
});
