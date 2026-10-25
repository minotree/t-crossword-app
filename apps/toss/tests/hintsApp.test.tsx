// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { defaultVocabList, type CrosswordPuzzle, type CrosswordWord } from '@t-crossword/core';
import { App } from '../src/App.js';
import { PictureBooks, type PictureBook } from '../src/components/PictureBooks.js';
import { PROGRESS_KEY, parseProgress } from '../src/adapters/progress.js';

let root: Root;
let container: HTMLDivElement;
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.assign(window, { __appsInTossConstants: { safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } } });
  window.matchMedia = vi.fn((media: string) => ({ matches: false, media, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true }));
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
beforeEach(() => { localStorage.clear(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

function fixture() {
  const vocabulary = defaultVocabList.find((word) => word.word.toUpperCase() === 'SEA');
  if (!vocabulary) throw new Error('SEA fixture missing');
  const word: CrosswordWord = { ...vocabulary, word: 'SEA', orientation: 'across', startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0 };
  const grid: CrosswordPuzzle['grid'] = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
  for (let col = 0; col < 3; col++) grid[0][col] = { row: 0, col, letter: word.word[col], ...(col === 0 ? { acrossNumber: 1 } : {}) };
  return { word, puzzle: { size: 8 as const, level: 'beginner' as const, words: [word], grid } };
}
async function click(text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((element) => element.textContent?.includes(text) || element.getAttribute('aria-label')?.includes(text));
  if (!button) throw new Error(`Missing button: ${text}`);
  await act(async () => button.click());
}
async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('searches and filters a large word bank while preserving notebook and bookmark changes', async () => {
  const { word } = fixture();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({
    completedWordIds: defaultVocabList.map((item) => item.id), bookmarkedWordIds: [],
    hintUsedWordIds: [word.id], dismissedMistakeWordIds: [],
  }));
  const generatePuzzle = vi.fn();
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App generatePuzzle={generatePuzzle} /></TDSMobileAITProvider>));
  await click('단어장 보기');
  const search = container.querySelector('input');
  if (!(search instanceof HTMLInputElement)) throw new Error('Search missing');
  await type(search, 'sea');
  const cards = Array.from(container.querySelectorAll('.word-list > li'));
  expect(cards.length).toBeGreaterThan(0);
  expect(cards.every((card) => card.querySelector('h3')?.textContent?.toLowerCase().includes('sea'))).toBe(true);
  const bookmark = container.querySelector('button[aria-label="SEA 즐겨찾기"]');
  if (!(bookmark instanceof HTMLButtonElement)) throw new Error('Bookmark missing');
  await act(async () => bookmark.click());
  await click('즐겨찾기');
  expect(container.querySelectorAll('.word-list > li')).toHaveLength(1);
  await click('오답노트');
  await click('삭제');
  expect(container.querySelectorAll('.word-list > li')).toHaveLength(0);
  const saved = parseProgress(localStorage.getItem(PROGRESS_KEY));
  expect(saved.bookmarkedWordIds).toEqual([word.id]);
  expect(saved.hintUsedWordIds).toEqual([word.id]);
  expect(saved.completedWordIds).toHaveLength(defaultVocabList.length);
  await click('홈');
  expect(container.textContent).toContain('오신 것을 환영합니다!');
});

it('completes a device puzzle without hint APIs, balance or reward controls', async () => {
  const { word, puzzle } = fixture();
  const generatePuzzle = vi.fn().mockResolvedValue(puzzle);
  const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected network call'));
  try {
    await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App generatePuzzle={generatePuzzle} /></TDSMobileAITProvider>));
    const start = container.querySelector<HTMLButtonElement>('.home-actions button');
    if (!start) throw new Error('Start missing');
    await act(async () => start.click());
    const clue = container.querySelector<HTMLButtonElement>('.cell-number');
    if (!clue) throw new Error('Clue missing');
    await act(async () => clue.click());
    expect(container.querySelectorAll('.answer-actions button')).toHaveLength(1);
    const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('dialog input'));
    await type(inputs[0], 'S'); await type(inputs[1], 'E'); await type(inputs[2], 'A');
    expect(parseProgress(localStorage.getItem(PROGRESS_KEY)).completedWordIds).toEqual([word.id]);
    expect(container.querySelector('.review')).not.toBeNull();
    expect(container.querySelector('.completion-confetti')).not.toBeNull();
    expect(container.querySelector('.hint-wallet')).toBeNull();
    expect(container.querySelector('.completion-reward-guide')).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  } finally { fetcher.mockRestore(); }
});

it('keeps the PWA welcome flow and changes puzzle settings inside the quiz without losing a round on home navigation', async () => {
  const { puzzle } = fixture();
  const generatePuzzle = vi.fn().mockImplementation(async (level, size) => ({ ...puzzle, level, size }));
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App generatePuzzle={generatePuzzle} /></TDSMobileAITProvider>));
  expect(container.textContent).toContain('오신 것을 환영합니다!');
  expect(container.querySelector('[aria-label="퍼즐 설정"]')).toBeNull();
  await click('단어장 보기');
  expect(container.textContent).toContain('나의 단어장');
  const home = container.querySelectorAll('nav button')[0] as HTMLButtonElement;
  await act(async () => home.click());
  await click('퀴즈 시작');
  expect(generatePuzzle).toHaveBeenCalledExactlyOnceWith('beginner', 10, []);
  expect(container.querySelector('.quiz-heading')).toBeNull();
  expect(container.querySelector('.quiz-summary [aria-label="전체 단어 진행률"]')?.textContent).toBe(`0 / ${puzzle.words.length}`);
  expect(container.querySelector('.quiz-summary')?.textContent).toContain('새 퍼즐');
  expect(container.querySelector('[aria-label="퍼즐 설정"]')).not.toBeNull();
  await click('중급');
  expect(generatePuzzle).toHaveBeenLastCalledWith('intermediate', 10, []);
  await click('8×8');
  expect(generatePuzzle).toHaveBeenLastCalledWith('intermediate', 8, []);
  await act(async () => home.click());
  await click('퀴즈 시작');
  expect(generatePuzzle).toHaveBeenCalledTimes(3);
  expect(container.querySelector('nav [aria-current="page"]')?.textContent).toContain('퀴즈 풀기');
});

it('confirms learning reset, preserves unrelated records, and leaves records intact when saving fails', async () => {
  const progress = { completedWordIds: ['sea'], bookmarkedWordIds: ['sea'], hintUsedWordIds: ['sea'], dismissedMistakeWordIds: [] };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  const { puzzle } = fixture();
  const generatePuzzle = vi.fn().mockResolvedValue(puzzle);
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App generatePuzzle={generatePuzzle} /></TDSMobileAITProvider>));
  await click('설정'); await click('학습 기록 초기화'); await click('취소');
  expect(parseProgress(localStorage.getItem(PROGRESS_KEY))).toEqual(progress);
  await click('학습 기록 초기화');
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('disk full'); });
  await click('초기화하기');
  expect(container.textContent).toContain('기존 기록은 유지됩니다.');
  expect(parseProgress(localStorage.getItem(PROGRESS_KEY))).toEqual(progress);
  save.mockRestore();
  await click('초기화하기');
  expect(parseProgress(localStorage.getItem(PROGRESS_KEY))).toEqual({ ...progress, completedWordIds: [] });
  expect(container.textContent).toContain('학습 기록을 초기화했습니다.');
});

it('renders separate reading pages, translation, image failure retry and navigation', async () => {
  const books: PictureBook[] = [{ id: 'test', level: 'beginner', genre: 'poem', title: 'Test story', koreanTitle: '', pages: [
    { title: 'First', text: 'First page text', translation: '첫 장 해석', image: 'test-1.png' },
    { title: 'Second', text: 'Second page text', translation: '다음 장 해석', image: 'test-2.png' },
  ] }];
  const onSelect = vi.fn(); const onPageChange = vi.fn(); const onLevelChange = vi.fn();
  const render = async (selectedId: string | null, pageIndex: number) => {
    await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><PictureBooks books={books} level="beginner" selectedId={selectedId} pageIndex={pageIndex} onSelect={onSelect} onPageChange={onPageChange} onLevelChange={onLevelChange} /></TDSMobileAITProvider>));
  };
  await render(null, 0); await click('Test story'); expect(onSelect).toHaveBeenCalledWith('test');
  await render('test', 0);
  expect(container.querySelector('.sr-only')?.textContent).toBe('First page text');
  expect(container.querySelector('details')?.textContent).toContain('첫 장 해석');
  const img = container.querySelector('img');
  await act(async () => img?.dispatchEvent(new Event('error')));
  expect(container.textContent).toContain('그림을 불러오지 못했습니다.');
  await click('다시 불러오기'); expect(container.querySelector('img')).not.toBeNull();
  const article = container.querySelector('article');
  const readyImage = container.querySelector('img');
  if (!readyImage) throw new Error('Reading image missing');
  Object.defineProperties(readyImage, { naturalWidth: { value: 900 }, naturalHeight: { value: 1200 } });
  await act(async () => readyImage.dispatchEvent(new Event('load')));
  expect(readyImage.getAttribute('width')).toBe('900');
  expect(readyImage.getAttribute('height')).toBe('1200');
  container.querySelector('details')?.setAttribute('open', '');
  await click('다음'); expect(onPageChange).toHaveBeenCalledWith(1);
  await render('test', 1); expect(container.querySelector('details')?.hasAttribute('open')).toBe(false);
  expect(container.querySelector('article')).toBe(article);
  expect(container.querySelector('img')).toBe(readyImage);
  expect(readyImage.getAttribute('src')).toContain('test-2.png');
  expect(readyImage.getAttribute('height')).toBe('1200');
  expect(container.querySelector('.sr-only')?.textContent).toBe('Second page text');
  await click('이전'); expect(onPageChange).toHaveBeenCalledWith(0);
  await click('중급'); expect(onLevelChange).toHaveBeenCalledWith('intermediate');
});

it.each(['beginner', 'intermediate', 'advanced'] as const)('restores the %s list offset and provides a list button on every reading page', async (initialLevel) => {
  const books: PictureBook[] = (['beginner', 'intermediate', 'advanced'] as const).map((level) => ({
    id: level, level, genre: 'poem', title: `${level} story`, koreanTitle: '',
    pages: [
      { title: 'First', text: 'First', translation: '첫 장', image: 'test-first.webp' },
      { title: 'Second', text: 'Second', translation: '둘째 장', image: 'test-second.webp' },
    ],
  }));
  function Reading() {
    const [level, setLevel] = useState(initialLevel);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pageIndex, setPageIndex] = useState(0);
    return <main className="scroll-page"><PictureBooks books={books} level={level} selectedId={selectedId} pageIndex={pageIndex}
      onSelect={(id) => { setSelectedId(id); setPageIndex(0); }} onPageChange={setPageIndex}
      onLevelChange={(value) => { setLevel(value); setSelectedId(null); setPageIndex(0); }} />
      <button onClick={() => { setSelectedId(null); setPageIndex(0); }}>기기 뒤로</button>
    </main>;
  }
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><Reading /></TDSMobileAITProvider>));
  const scroller = container.querySelector('main');
  if (!scroller) throw new Error('Reading scroller missing');
  const listScroller = () => {
    const list = container.querySelector<HTMLElement>('.book-list-scroll');
    if (!list) throw new Error('Book list scroller missing');
    return list;
  };
  listScroller().scrollTop = 320;
  await click(`${initialLevel} story`);
  expect(scroller.scrollTop).toBe(0);
  const actions = () => Array.from(container.querySelectorAll<HTMLButtonElement>('.image-page-navigation button'));
  expect(actions().map(button => button.getAttribute('aria-label'))).toEqual(['이전 페이지', '다음 페이지']);
  expect(actions()[0].disabled).toBe(true);
  const title = container.querySelector('article h3');
  if (!title) throw new Error('Reading title missing');
  const titleRect = vi.spyOn(title, 'getBoundingClientRect').mockImplementation(() =>
    new DOMRect(0, 100 + 200 - scroller.scrollTop, 300, 30));
  const scrollerRect = vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 300, 600));
  scroller.scrollTop = 900;
  await act(async () => actions()[1].click());
  expect(scroller.scrollTop).toBe(200);
  expect(actions()[1].disabled).toBe(true);
  scroller.scrollTop = 600;
  await act(async () => actions()[0].click());
  expect(scroller.scrollTop).toBe(200);
  expect(actions()[0].disabled).toBe(true);
  titleRect.mockRestore();
  scrollerRect.mockRestore();
  scroller.scrollTop = 1100;
  const listButton = container.querySelector<HTMLButtonElement>('.reading-actions button');
  if (!listButton) throw new Error('List action missing');
  await act(async () => listButton.click());
  expect(container.querySelector('.book-list')).not.toBeNull();
  expect(listScroller().scrollTop).toBe(320);
  listScroller().scrollTop = 720;
  await click(`${initialLevel} story`);
  scroller.scrollTop = 1100;
  await click('기기 뒤로');
  expect(listScroller().scrollTop).toBe(720);
  await click(initialLevel === 'beginner' ? '중급' : '초급');
  expect(listScroller().scrollTop).toBe(0);
});

it('removes hint balances and rewarded-ad entry points from the release', async () => {
  const generatePuzzle = vi.fn();
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App generatePuzzle={generatePuzzle} /></TDSMobileAITProvider>));
  expect(container.querySelector('[aria-label="힌트 잔액"]')).toBeNull();
  expect(container.querySelector('[aria-label="광고 보고 힌트 받기"]')).toBeNull();
  await click('설정');
  expect(container.textContent).not.toContain('광고 보고 힌트');
  expect(container.textContent).toContain('v1.0.1');
});
