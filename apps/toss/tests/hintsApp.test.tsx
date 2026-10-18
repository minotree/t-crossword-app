// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { act } from 'react';
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
  const button = Array.from(container.querySelectorAll('button')).find((element) => element.textContent?.includes(text));
  if (!button) throw new Error(`Missing button: ${text}`);
  await act(async () => button.click());
}
async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('retries the same hint request, records the notebook, and updates the verified completion reward', async () => {
  const { word, puzzle } = fixture();
  const reveal = vi.fn().mockRejectedValueOnce(new Error('응답 시간 초과')).mockResolvedValue({ balance: 9, index: 0, letter: 'S', used: 1 });
  const answer = vi.fn().mockResolvedValue({ correct: true, completed: true, balance: 14 });
  const gateway = { balance: async () => 10, startRound: async () => ({ roundId: 'round-1', puzzle, balance: 10 }), reveal, answer };
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App hintGateway={gateway} /></TDSMobileAITProvider>));
  await click('퍼즐 퀴즈 시작하기');
  const clue = container.querySelector('.clue-button');
  if (!(clue instanceof HTMLButtonElement)) throw new Error('Clue missing');
  await act(async () => clue.click());
  await click('힌트 (');
  expect(container.textContent).toContain('응답 시간 초과');
  expect(parseProgress(localStorage.getItem(PROGRESS_KEY)).hintUsedWordIds).toEqual([]);
  await click('닫기');
  await act(async () => clue.click());
  await click('힌트 (');
  expect(reveal).toHaveBeenCalledTimes(2);
  expect(reveal.mock.calls[0]).toEqual(reveal.mock.calls[1]);
  expect(parseProgress(localStorage.getItem(PROGRESS_KEY)).hintUsedWordIds).toEqual([word.id]);
  expect(container.textContent).toContain('9개');
  const inputs = Array.from(container.querySelectorAll('dialog input')).filter((element): element is HTMLInputElement => element instanceof HTMLInputElement);
  expect(inputs[0].value).toBe('S'); expect(inputs[0].readOnly).toBe(true);
  await type(inputs[1], 'E'); await type(inputs[2], 'A');
  expect(answer).toHaveBeenCalledExactlyOnceWith('round-1', word.id, 'SEA');
  expect(container.textContent).toContain('14개');
  expect(container.textContent).toContain('완성 보상으로 힌트 5개가 추가되었습니다.');
  expect(parseProgress(localStorage.getItem(PROGRESS_KEY)).completedWordIds).toEqual([word.id]);
});

it('keeps the PWA welcome flow and changes puzzle settings inside the quiz without losing a round on home navigation', async () => {
  const { puzzle } = fixture();
  const startRound = vi.fn().mockImplementation(async (level, size) => ({ roundId: 'round-1', puzzle: { ...puzzle, level, size }, balance: 10 }));
  const gateway = { balance: async () => 10, startRound, reveal: vi.fn(), answer: vi.fn() };
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App hintGateway={gateway} /></TDSMobileAITProvider>));
  expect(container.textContent).toContain('오신 것을 환영합니다!');
  expect(container.querySelector('[aria-label="퍼즐 설정"]')).toBeNull();
  await click('단어장 관리하기');
  expect(container.textContent).toContain('나의 단어장');
  const home = container.querySelectorAll('nav button')[0] as HTMLButtonElement;
  await act(async () => home.click());
  await click('퍼즐 퀴즈 시작하기');
  expect(startRound).toHaveBeenCalledExactlyOnceWith('beginner', 10, []);
  expect(container.querySelector('[aria-label="퍼즐 설정"]')).not.toBeNull();
  await click('중급');
  expect(startRound).toHaveBeenLastCalledWith('intermediate', 10, []);
  await click('8×8');
  expect(startRound).toHaveBeenLastCalledWith('intermediate', 8, []);
  await act(async () => home.click());
  await click('퍼즐 퀴즈 시작하기');
  expect(startRound).toHaveBeenCalledTimes(3);
  expect(container.querySelector('nav [aria-current="page"]')?.textContent).toContain('퀴즈 풀기');
});

it('confirms learning reset, preserves unrelated records, and leaves records intact when saving fails', async () => {
  const progress = { completedWordIds: ['sea'], bookmarkedWordIds: ['sea'], hintUsedWordIds: ['sea'], dismissedMistakeWordIds: [] };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  const { puzzle } = fixture();
  const gateway = { balance: async () => 14, startRound: async () => ({ roundId: 'round-1', puzzle, balance: 14 }), reveal: vi.fn(), answer: vi.fn() };
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><App hintGateway={gateway} /></TDSMobileAITProvider>));
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
  expect(container.textContent).toContain('14개');
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
  await click('다음'); expect(onPageChange).toHaveBeenCalledWith(1);
  await render('test', 1); expect(container.querySelector('details')?.hasAttribute('open')).toBe(false);
  expect(container.querySelector('.sr-only')?.textContent).toBe('Second page text');
  await click('이전'); expect(onPageChange).toHaveBeenCalledWith(0);
  await click('중급'); expect(onLevelChange).toHaveBeenCalledWith('intermediate');
});
