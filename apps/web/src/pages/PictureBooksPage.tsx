import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pictureBooks } from '../data/pictureBooks.js';
import { PictureBookAudio } from '../components/PictureBookAudio.js';

const levels = [
  { key: 'beginner', label: '초급' },
  { key: 'intermediate', label: '중급' },
  { key: 'advanced', label: '고급' },
] as const;

const genreLabels = { poem: '시', essay: '에세이', novel: '소설' };

function BookImage({ image, title, preview = false }: { image: string; title: string; preview?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p role="status" className="flex aspect-[2/3] items-center justify-center p-6 text-center text-sm text-slate-600">
    그림을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 열어 주세요.
  </p>;
  return <img src={`${import.meta.env.BASE_URL}${image}`} alt={`${title} 삽화와 영어 본문`}
    loading={preview ? 'lazy' : 'eager'} decoding="async" onError={() => setFailed(true)}
    className={preview ? 'aspect-[2/3] w-full object-contain' : 'mx-auto h-auto w-full max-w-2xl'} />;
}

export function PictureBooksPage() {
  const [params, setParams] = useSearchParams();
  const level = levels.find((item) => item.key === params.get('level')) ?? levels[0];
  const books = pictureBooks.filter((book) => book.level === level.key);
  const bookId = params.get('book');
  const selectedBook = books.find((book) => book.id === bookId);
  const requestedPage = Number(params.get('page') ?? '1');
  const pageIndex = selectedBook && Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= selectedBook.pages.length
    ? requestedPage - 1 : 0;
  const selectedPage = selectedBook?.pages[pageIndex];
  const pageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousBook = useRef<string | null>(null);
  const listScrollTop = useRef(0);

  useEffect(() => {
    if (bookId && previousBook.current === bookId) {
      titleRef.current?.scrollIntoView({ block: 'start' });
    } else if (!bookId && previousBook.current) {
      const scroller = pageRef.current?.closest('[data-page-scroll]');
      if (scroller) scroller.scrollTop = listScrollTop.current;
    } else {
      pageRef.current?.scrollIntoView({ block: 'start' });
    }
    previousBook.current = bookId;
  }, [level.key, bookId, pageIndex]);

  return <div ref={pageRef} className="min-h-full bg-slate-50 pb-10 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3">
        <h1 className="shrink-0 text-lg font-black">그림책</h1>
        <p className="min-w-0 text-xs leading-relaxed text-slate-500 sm:text-sm">그림과 함께 영어 시·에세이·소설을 읽어 보세요.</p>
      </div>
    </header>
    <main className="mx-auto w-full max-w-4xl px-4 pt-2">
      <nav aria-label="그림책 난이도" className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
        {levels.map((item) => <button key={item.key} type="button" aria-pressed={item.key === level.key}
          onClick={() => setParams({ level: item.key })}
          className={`flex-1 border-b-2 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-blue-600 ${item.key === level.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>
          {item.label}
        </button>)}
      </nav>

      {selectedBook && selectedPage ? <section className="mt-4" aria-labelledby="picture-book-title">
        <h2 ref={titleRef} id="picture-book-title" lang="en" className="mb-4 mt-2 text-xl font-bold">{selectedBook.title}</h2>
        {selectedBook.koreanTitle && <p className="mb-3 text-sm text-slate-600">{selectedBook.koreanTitle} · {genreLabels[selectedBook.genre]}{selectedBook.subgenre && ` · ${selectedBook.subgenre}`}</p>}
        {selectedBook.pages.length > 1 && <p className="mb-3 text-sm font-semibold text-slate-600" aria-live="polite">{pageIndex + 1} / {selectedBook.pages.length}장 · <span lang="en">{selectedPage.title}</span></p>}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fff9eb]">
          <BookImage key={selectedPage.image} image={selectedPage.image} title={selectedPage.title} />
          <p lang="en" className="sr-only">{selectedPage.text}</p>
        </div>
        <PictureBookAudio key={`${selectedBook.id}-${pageIndex}`} id={`${selectedBook.id}-${String(pageIndex + 1).padStart(2, '0')}`} text={selectedPage.text} />
        <details key={selectedPage.image} className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold">해석 보기</summary>
          <p lang="ko" className="mt-3 whitespace-pre-line text-base leading-loose">{selectedPage.translation}</p>
        </details>
        {selectedBook.pages.length > 1 && <nav aria-label="그림책 페이지 이동" className="mt-4 flex items-center justify-between gap-3">
          <button type="button" disabled={pageIndex === 0}
            onClick={() => setParams({ level: level.key, book: selectedBook.id, page: String(pageIndex) })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-600">← 이전</button>
          <span className="text-sm text-slate-500">{pageIndex + 1} / {selectedBook.pages.length}</span>
          {pageIndex + 1 < selectedBook.pages.length ? <button type="button"
            onClick={() => setParams({ level: level.key, book: selectedBook.id, page: String(pageIndex + 2) })}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-blue-600">다음 →</button>
            : <span className="px-4 py-3 text-sm text-slate-500">마지막 장</span>}
        </nav>}
        <Link to={`?level=${level.key}`} className="mt-4 inline-block rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">← 목록으로</Link>
      </section> : <>
        {bookId && <p role="status" className="mt-4 text-sm text-slate-600">선택한 그림책을 찾을 수 없습니다. 목록에서 다시 선택해 주세요.</p>}
        {books.length === 0 ? <div role="status" className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center">
          <h2 className="font-bold">{level.label} 그림책 준비 중</h2>
          <p className="mt-2 text-sm text-slate-500">초급 그림책을 먼저 읽어 보세요.</p>
        </div> : <>
          <p className="my-3 text-sm text-slate-500">{level.label} 그림책 {books.length}편</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {books.map((book) => <li key={book.id}>
              <Link to={`?level=${level.key}&book=${book.id}`} onClick={() => {
                listScrollTop.current = pageRef.current?.closest('[data-page-scroll]')?.scrollTop ?? 0;
              }} className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-blue-600">
                <BookImage image={book.pages[0].image} title={book.title} preview />
                <h2 lang="en" className="break-words border-t border-slate-100 px-3 py-3 text-sm font-bold">{book.title}</h2>
                {book.level !== 'beginner' && <p className="px-3 pb-3 text-xs font-semibold text-indigo-700">{genreLabels[book.genre]}{book.subgenre && ` · ${book.subgenre}`} · {book.pages.length}장</p>}
              </Link>
            </li>)}
          </ul>
        </>}
      </>}
      <p className="mt-6 text-xs leading-relaxed text-slate-500">이 앱의 읽기 콘텐츠는 AI를 활용해 창작한 글·해석·삽화입니다.</p>
    </main>
  </div>;
}
