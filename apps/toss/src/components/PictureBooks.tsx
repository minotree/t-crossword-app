import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@toss/tds-mobile';
import type { DifficultyLevel } from '@t-crossword/core';
import { isRecord } from '@t-crossword/contracts';
import preparedBooks from '../data/picture-books.json';
import { PictureBookAudio } from './PictureBookAudio.js';

export interface PictureBook {
  id: string; level: Exclude<DifficultyLevel, 'special'>; title: string; koreanTitle: string; genre: string;
  pages: { title: string; text: string; translation: string; image: string }[];
}
function isPictureBook(value: unknown): value is PictureBook {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' &&
    typeof value.koreanTitle === 'string' && typeof value.genre === 'string' &&
    (value.level === 'beginner' || value.level === 'intermediate' || value.level === 'advanced') &&
    Array.isArray(value.pages) && value.pages.length > 0 && value.pages.every((page: unknown) => isRecord(page) &&
      typeof page.title === 'string' && typeof page.text === 'string' && typeof page.translation === 'string' &&
      typeof page.image === 'string' && /^picture-books\/[a-z0-9-]+\.webp$/.test(page.image));
}
const source: unknown = preparedBooks;
if (!Array.isArray(source) || !source.every(isPictureBook)) throw new Error('그림책 데이터 형식을 확인해 주세요.');
export const pictureBooks: PictureBook[] = source;
const useReadingLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Hold only a few decoded first pages; never preload the entire library.
function useFirstPagePreviews() {
  const previews = useRef(new Map<string, HTMLImageElement>());
  useEffect(() => {
    const images = previews.current;
    return () => { for (const image of images.values()) image.removeAttribute('src'); images.clear(); };
  }, []);
  return useCallback((path: string | undefined) => {
    if (!path) return;
    const images = previews.current;
    const cached = images.get(path);
    if (cached) { images.delete(path); images.set(path, cached); return; }
    if (images.size >= 3) {
      const oldest = images.keys().next().value;
      if (oldest) { images.get(oldest)?.removeAttribute('src'); images.delete(oldest); }
    }
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    images.set(path, image);
    image.onerror = () => { if (images.get(path) === image) images.delete(path); };
    image.src = `${import.meta.env.BASE_URL}${path}`;
    // A failed speculative decode must not block opening or retrying a book.
    void image.decode?.().catch(() => {});
  }, []);
}

function BookImage({ image, title, nextImage }: { image: string; title: string; nextImage?: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 1536 });
  useEffect(() => {
    if (loadedImage !== image || !nextImage) return;
    const upcoming = new Image();
    upcoming.decoding = 'async';
    upcoming.src = `${import.meta.env.BASE_URL}${nextImage}`;
    // Speculative decoding is optional; the visible image retains error/retry handling.
    void upcoming.decode?.().catch(() => {});
    return () => { upcoming.removeAttribute('src'); };
  }, [image, loadedImage, nextImage]);
  return failedImage === image ? <div role="status" className="empty"><p> 그림을 불러오지 못했습니다.</p><Button size="small" variant="weak" onClick={() => setFailedImage(null)}>다시 불러오기</Button></div>
    : <img src={`${import.meta.env.BASE_URL}${image}`} alt={`${title} 삽화와 영어 본문`} decoding="async" {...{ fetchpriority: 'high' }} loading="eager"
      width={dimensions.width} height={dimensions.height} style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth && naturalHeight) setDimensions({ width: naturalWidth, height: naturalHeight });
        setLoadedImage(image);
      }} onError={() => setFailedImage(image)} />;
}

export function PictureBooks({ level, onLevelChange, selectedId, pageIndex, onSelect, onPageChange, books = pictureBooks }: {
  level: PictureBook['level']; onLevelChange: (level: PictureBook['level']) => void;
  selectedId: string | null; pageIndex: number; onSelect: (id: string | null) => void;
  onPageChange: (index: number) => void; books?: PictureBook[];
}) {
  const section = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const listScrollTop = useRef(0);
  const previous = useRef({ level, selectedId, pageIndex });
  const warmFirstPage = useFirstPagePreviews();
  // Read actual clipped list geometry after scrolling settles, not library order.
  useEffect(() => {
    if (selectedId) return;
    const scroller = section.current?.querySelector<HTMLElement>('.book-list-scroll');
    const entries = books.filter((item) => item.level === level);
    let timer = 0;
    const prepareVisible = () => {
      const bounds = scroller?.getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = Math.max(bounds?.top ?? 0, viewport?.offsetTop ?? 0);
      const bottom = Math.min(bounds?.bottom ?? window.innerHeight,
        viewport ? viewport.offsetTop + viewport.height : window.innerHeight);
      let count = 0;
      section.current?.querySelectorAll('.book-list > li').forEach((item, index) => {
        if (count >= 3) return;
        const rect = item.getBoundingClientRect();
        if (rect.height > 0 && rect.bottom > top && rect.top < bottom) {
          warmFirstPage(entries[index]?.pages[0]?.image);
          count++;
        }
      });
    };
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(prepareVisible, 100); };
    schedule();
    scroller?.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      window.clearTimeout(timer);
      scroller?.removeEventListener('scroll', schedule);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, [books, level, selectedId, warmFirstPage]);
  useReadingLayoutEffect(() => {
    const scroller = selectedId
      ? section.current?.closest('main.scroll-page')
      : section.current?.querySelector<HTMLElement>('.book-list-scroll');
    const before = previous.current;
    if (scroller) {
      if (before.level !== level) {
        listScrollTop.current = 0;
        scroller.scrollTop = 0;
      } else if (before.selectedId && !selectedId) {
        scroller.scrollTop = listScrollTop.current;
      } else if (selectedId && before.selectedId !== selectedId) {
        scroller.scrollTop = 0;
      } else if (selectedId && before.pageIndex !== pageIndex && titleRef.current) {
        scroller.scrollTop += titleRef.current.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientTop;
      }
    }
    previous.current = { level, selectedId, pageIndex };
  }, [level, selectedId, pageIndex]);
  const openBook = (id: string) => {
    warmFirstPage(books.find((book) => book.level === level && book.id === id)?.pages[0]?.image);
    // Save before replacing the long list: DOM updates can clamp its scroll offset.
    listScrollTop.current = section.current?.querySelector('.book-list-scroll')?.scrollTop ?? 0;
    onSelect(id);
  };
  const selected = books.find((book) => book.level === level && book.id === selectedId);
  const page = selected?.pages[pageIndex];
  return <section ref={section} className="picture-books">
    <div className="picture-books-heading"><h2>그림책</h2><p className="secondary">그림과 함께 영어 시·에세이·소설을 읽어 보세요.</p></div>
    <div className="choices" aria-label="그림책 난이도">{(['beginner', 'intermediate', 'advanced'] as const).map((value) => <Button size="small" key={value} variant={value === level ? 'fill' : 'weak'} aria-pressed={value === level} onClick={() => onLevelChange(value)}>{{ beginner: '초급', intermediate: '중급', advanced: '고급' }[value]}</Button>)}</div>
    {selected && page ? <article key={selected.id}>
      <h3 ref={titleRef} lang="en">{selected.title}</h3>{selected.koreanTitle && <p>{selected.koreanTitle}</p>}
      <p className="secondary" aria-live="polite">{pageIndex + 1} / {selected.pages.length}장 · {page.title}</p>
      <div className="book-page-visual">
        <BookImage image={page.image} title={page.title} nextImage={selected.pages[pageIndex + 1]?.image} />
        {selected.pages.length > 1 && <nav className="image-page-navigation" aria-label="그림책 페이지 이동">
          <Button className="page-arrow previous-page" size="small" variant="weak" aria-label="이전 페이지" disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)}>
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Button>
          <Button className="page-arrow next-page" size="small" variant="weak" aria-label="다음 페이지" disabled={pageIndex + 1 >= selected.pages.length} onClick={() => onPageChange(pageIndex + 1)}>
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Button>
        </nav>}
      </div>
      <p className="sr-only" lang="en">{page.text}</p>
      <PictureBookAudio key={`${selected.id}-${pageIndex}`} id={`${selected.id}-${String(pageIndex + 1).padStart(2, '0')}`} text={page.text} />
      <details key={pageIndex}><summary>해석 보기</summary><p lang="ko">{page.translation}</p></details>
      <div className="reading-actions">
        <Button size="small" variant="weak" onClick={() => onSelect(null)}>목록으로</Button>
      </div>
    </article> : <div className="book-list-scroll" role="region" aria-label="그림책 작품 목록" tabIndex={0}><ul className="book-list">{books.filter((book) => book.level === level).map((book) => <li key={book.id}><Button display="block" variant="weak" onPointerDown={() => warmFirstPage(book.pages[0]?.image)} onFocus={() => warmFirstPage(book.pages[0]?.image)} onClick={() => openBook(book.id)}>{book.title}</Button></li>)}</ul></div>}
    {!books.some((book) => book.level === level) && <p role="status" className="empty">그림책을 준비하고 있어요.</p>}
    <p className="secondary">이 앱의 읽기 콘텐츠는 AI를 활용해 창작한 글·해석·삽화입니다.</p>
  </section>;
}
