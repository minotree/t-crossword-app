import beginnerBooks from './picture-books.json';
import intermediateBooks from './intermediate-books.json';
import advancedBooks from './advanced-books.json';
import type { DifficultyLevel } from '@t-crossword/core';

export type ReadingGenre = 'poem' | 'essay' | 'novel';

export interface ReadingPage {
  title: string;
  text: string;
  translation: string;
  image: string;
}

export interface ReadingBook {
  id: string;
  level: Exclude<DifficultyLevel, 'special'>;
  genre: ReadingGenre;
  subgenre?: string;
  title: string;
  koreanTitle?: string;
  pages: ReadingPage[];
}

function readingGenre(value: string): ReadingGenre {
  if (value === 'poem' || value === 'essay' || value === 'novel') return value;
  throw new Error('지원하지 않는 그림책 장르입니다.');
}

export const pictureBooks: ReadingBook[] = [
  ...beginnerBooks.map((book): ReadingBook => ({
    id: book.id,
    level: 'beginner',
    genre: 'poem',
    title: book.title,
    koreanTitle: book.koreanTitle,
    pages: [{ title: book.title, text: book.poem, translation: book.translation, image: book.image }],
  })),
  ...intermediateBooks.map((book): ReadingBook => ({
    id: book.id,
    level: 'intermediate',
    genre: readingGenre(book.genre),
    subgenre: book.subgenre ?? undefined,
    title: book.title,
    koreanTitle: book.koreanTitle,
    pages: book.pages,
  })),
  ...advancedBooks.map((book): ReadingBook => ({
    id: book.id,
    level: 'advanced',
    genre: readingGenre(book.genre),
    subgenre: book.subgenre ?? undefined,
    title: book.title,
    koreanTitle: book.koreanTitle,
    pages: book.pages,
  })),
];
