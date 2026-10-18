import { useState } from 'react';
import { Button } from '@toss/tds-mobile';
import type { DifficultyLevel } from '@t-crossword/core';
import { isRecord } from '@t-crossword/contracts';
import preparedBooks from '../data/picture-books.json';

export interface PictureBook {
  id: string; level: DifficultyLevel; title: string; koreanTitle: string; genre: string;
  pages: { title: string; text: string; translation: string; image: string }[];
}
function isPictureBook(value: unknown): value is PictureBook {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' &&
    typeof value.koreanTitle === 'string' && typeof value.genre === 'string' &&
    (value.level === 'beginner' || value.level === 'intermediate' || value.level === 'advanced') &&
    Array.isArray(value.pages) && value.pages.length > 0 && value.pages.every((page: unknown) => isRecord(page) &&
      typeof page.title === 'string' && typeof page.text === 'string' && typeof page.translation === 'string' &&
      typeof page.image === 'string' && /^picture-books\/[a-z0-9-]+\.png$/.test(page.image));
}
const source: unknown = preparedBooks;
if (!Array.isArray(source) || !source.every(isPictureBook)) throw new Error('그림책 데이터 형식을 확인해 주세요.');
export const pictureBooks: PictureBook[] = source;

function BookImage({ image, title }: { image: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div role="status" className="empty"><p> 그림을 불러오지 못했습니다.</p><Button size="small" variant="weak" onClick={() => setFailed(false)}>다시 불러오기</Button></div>
    : <img src={`${import.meta.env.BASE_URL}${image}`} alt={`${title} 삽화와 영어 본문`} decoding="async" onError={() => setFailed(true)} />;
}

export function PictureBooks({ level, onLevelChange, selectedId, pageIndex, onSelect, onPageChange, books = pictureBooks }: {
  level: DifficultyLevel; onLevelChange: (level: DifficultyLevel) => void;
  selectedId: string | null; pageIndex: number; onSelect: (id: string | null) => void;
  onPageChange: (index: number) => void; books?: PictureBook[];
}) {
  const selected = books.find((book) => book.level === level && book.id === selectedId);
  const page = selected?.pages[pageIndex];
  return <section className="picture-books">
    <h2>그림책</h2><p className="secondary">그림과 함께 영어 시·에세이·소설을 읽어 보세요.</p>
    <div className="choices" aria-label="그림책 난이도">{(['beginner', 'intermediate', 'advanced'] as const).map((value) => <Button size="small" key={value} variant={value === level ? 'fill' : 'weak'} aria-pressed={value === level} onClick={() => onLevelChange(value)}>{{ beginner: '초급', intermediate: '중급', advanced: '고급' }[value]}</Button>)}</div>
    {selected && page ? <article key={`${selected.id}-${pageIndex}`}>
      <Button size="small" variant="weak" onClick={() => onSelect(null)}>← 목록으로</Button>
      <h3 lang="en">{selected.title}</h3>{selected.koreanTitle && <p>{selected.koreanTitle}</p>}
      <p className="secondary" aria-live="polite">{pageIndex + 1} / {selected.pages.length}장 · {page.title}</p>
      <BookImage image={page.image} title={page.title} /><p className="sr-only" lang="en">{page.text}</p>
      <details><summary>해석 보기</summary><p lang="ko">{page.translation}</p></details>
      <nav className="reading-actions" aria-label="그림책 페이지 이동">
        <Button size="small" variant="weak" disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)}>← 이전</Button>
        {pageIndex + 1 < selected.pages.length ? <Button size="small" onClick={() => onPageChange(pageIndex + 1)}>다음 →</Button> : <Button size="small" onClick={() => onSelect(null)}>목록으로</Button>}
      </nav>
    </article> : <ul className="book-list">{books.filter((book) => book.level === level).map((book) => <li key={book.id}><Button display="block" variant="weak" onClick={() => onSelect(book.id)}>{book.title}{book.koreanTitle && ` · ${book.koreanTitle}`}</Button></li>)}</ul>}
    {!books.some((book) => book.level === level) && <p role="status" className="empty">그림책을 준비하고 있어요.</p>}
    <p className="secondary">이 앱의 읽기 콘텐츠는 AI를 활용해 창작한 글·해석·삽화입니다.</p>
  </section>;
}
