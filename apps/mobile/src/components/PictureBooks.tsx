import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { IonButton } from '@ionic/react';
import type { DifficultyLevel } from '@t-crossword/core';
import books from '../data/picture-books.json';

const levelNames: Record<Exclude<DifficultyLevel, 'special'>, string> = { beginner: '초급', intermediate: '중급', advanced: '고급' };
type Book = (typeof books)[number];

function ReadingPage({ page, number, count, onPrevious, onNext, onBackToList }: { page: Book['pages'][number]; number: number; count: number; onPrevious(): void; onNext(): void; onBackToList(): void }) {
  const [translation, setTranslation] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  return <>
    <p aria-live="polite">{number} / {count} 페이지</p>
    {loading && !failed && <p role="status">그림을 불러오고 있어요.</p>}
    <div className="mobile-reading-frame">
    {failed ? <div role="alert"><p>그림을 불러오지 못했습니다.</p><IonButton onClick={() => { setAttempt(value => value + 1); setFailed(false); setLoading(true); }}>다시 불러오기</IonButton></div>
      : <img key={attempt} className="mobile-reading-image" src={`${import.meta.env.BASE_URL}${page.image}`} alt={page.title} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
    {count > 1 && <nav className="mobile-reading-arrows" aria-label="그림책 페이지 이동">
      <button type="button" aria-label="이전 페이지" disabled={number === 1} onClick={onPrevious}><span aria-hidden="true">‹</span></button>
      <button type="button" aria-label="다음 페이지" disabled={number === count} onClick={onNext}><span aria-hidden="true">›</span></button>
    </nav>}
    </div>
    <p className="mobile-sr-only" lang="en">{page.text}</p>
    <div className="mobile-reading-actions">
      <IonButton fill="outline" aria-expanded={translation} aria-controls="mobile-translation" onClick={() => setTranslation(value => !value)}>{translation ? '해석 닫기' : '해석 보기'}</IonButton>
      <IonButton fill="outline" onClick={onBackToList}>목록으로</IonButton>
    </div>
    {translation && <p id="mobile-translation" className="mobile-translation">{page.translation}</p>}
  </>;
}

export interface PictureBooksNavigation { backToList(): boolean }
export function PictureBooks({ ref }: { ref?: Ref<PictureBooksNavigation> }) {
  const [level, setLevel] = useState<Exclude<DifficultyLevel, 'special'>>('beginner');
  const [selected, setSelected] = useState<Book | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const reader = useRef<HTMLDivElement>(null);
  const page = selected?.pages[pageIndex];
  const backToList = () => { setSelected(null); setPageIndex(0); };
  useImperativeHandle(ref, () => ({ backToList() {
    if (!selected) return false;
    backToList();
    return true;
  } }), [selected]);
  const move = (index: number) => {
    if (!selected || index < 0 || index >= selected.pages.length) return;
    setPageIndex(index);
    reader.current?.scrollTo({ top: 0 });
  };
  return <section className="mobile-books">
    <header className="mobile-book-heading"><h1>그림책</h1><p>그림과 함께 영어 시·에세이·소설을 읽어 보세요.</p></header>
    {selected && page ? <>
      <h2>{selected.koreanTitle || selected.title}</h2>
      <div className="mobile-reading-scroll" ref={reader} tabIndex={0} aria-label="그림책 본문">
        <ReadingPage key={`${selected.id}-${pageIndex}`} page={page} number={pageIndex + 1} count={selected.pages.length} onPrevious={() => move(pageIndex - 1)} onNext={() => move(pageIndex + 1)} onBackToList={backToList} />
      </div>
    </> : <>
      <div className="mobile-reading-levels" role="group" aria-label="그림책 난이도">{(['beginner', 'intermediate', 'advanced'] as const).map(value => <IonButton key={value} fill={level === value ? 'solid' : 'outline'} aria-pressed={level === value} onClick={() => { setLevel(value); position.current = 0; list.current?.scrollTo({ top: 0 }); }}>{levelNames[value]}</IonButton>)}</div>
      <div className="mobile-reading-scroll" aria-label="그림책 목록" tabIndex={0} ref={element => { list.current = element; if (element) element.scrollTop = position.current; }} onScroll={() => { if (list.current) position.current = list.current.scrollTop; }}>
        <ul className="mobile-book-list">{books.filter(book => book.level === level).map(book => <li key={book.id}><button aria-label={`${book.title}${book.koreanTitle ? `, ${book.koreanTitle}` : ''}, ${book.pages.length}페이지`} onClick={() => { setSelected(book); setPageIndex(0); }}><span lang="en">{book.title}</span></button></li>)}</ul>
      </div>
    </>}
    <p className="mobile-reading-note">이 앱의 읽기 콘텐츠는 AI를 활용해 창작한 글·해석·삽화입니다.</p>
  </section>;
}
