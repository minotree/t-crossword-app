// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { QuizPage } from '../src/pages/QuizPage.js';
import { WordInputModal } from '../src/components/WordInputModal.js';
import { WORD_PROGRESS_KEY, wordProgressStore } from '../src/adapters/wordProgress.js';

vi.mock('@t-crossword/core', async importOriginal => ({
  ...await importOriginal<typeof import('@t-crossword/core')>(),
  generateCrossword: () => puzzle,
}));

const across: CrosswordWord = { id: 'bear', word: 'BEAR', meaning: '곰', orientation: 'across',
  startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0 };
const down: CrosswordWord = { ...across, id: 'bird', word: 'BIRD', meaning: '새', orientation: 'down' };
const grid: CrosswordPuzzle['grid'] = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
for (let index = 0; index < 4; index++) {
  grid[0][index] = { row: 0, col: index, letter: across.word[index], ...(index === 0 ? { acrossNumber: 1, downNumber: 1 } : {}) };
  if (index) grid[index][0] = { row: index, col: 0, letter: down.word[index] };
}
const puzzle: CrosswordPuzzle = { size: 8, level: 'beginner', words: [across, down], grid };
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  localStorage.clear(); wordProgressStore.reload();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); });

async function click(text: string) {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.trim() === text);
  if (!button) throw new Error(`Button missing: ${text}`);
  await act(async () => button.click());
}
async function openWord(meaning = '곰') {
  await click('문제 전체 보기');
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('#puzzle-hints button')).find(button => button.textContent?.includes(meaning));
  if (!button) throw new Error('Clue missing');
  await act(async () => button.click());
  await act(async () => vi.advanceTimersByTime(50));
  return Array.from(container.querySelectorAll<HTMLInputElement>('[role="dialog"] input'));
}
async function closeWord() {
  const button = container.querySelector<HTMLButtonElement>('button[aria-label="닫기"]');
  await act(async () => button?.click());
}
async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Input setter missing');
    setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('keeps hints, recalculates on reopening, shares crossings and restores the notebook without losing records', async () => {
  localStorage.setItem(WORD_PROGRESS_KEY, JSON.stringify({ completedWordIds: ['bear'], bookmarkedWordIds: ['bear'],
    hintUsedWordIds: ['bear'], dismissedMistakeWordIds: ['bear'] }));
  wordProgressStore.reload();
  const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected API call'));
  await act(async () => root.render(<QuizPage />));
  let inputs = await openWord();
  await type(inputs[0], 'X'); await type(inputs[1], 'X');
  await click('힌트 2회');
  expect(inputs[0].value).toBe('B');
  expect(inputs[0].readOnly).toBe(true);
  expect(inputs[0].getAttribute('aria-invalid')).toBe('false');
  expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
  expect(document.activeElement).toBe(inputs[1]);
  await act(async () => vi.advanceTimersByTime(3000));
  expect(inputs[0].value).toBe('B');
  expect(wordProgressStore.getSnapshot()).toMatchObject({ completedWordIds: ['bear'], bookmarkedWordIds: ['bear'],
    hintUsedWordIds: ['bear'], dismissedMistakeWordIds: [] });
  await closeWord(); inputs = await openWord();
  expect(inputs[0].value).toBe('B');
  await click('힌트 1회'); // 빈칸 3개로 재계산, 과거 사용 횟수를 추가 차감하지 않음.
  expect(inputs[1].value).toBe('E');
  await closeWord(); inputs = await openWord('새');
  expect(inputs[0].value).toBe('B'); expect(inputs[0].readOnly).toBe(true);
  expect(container.textContent).toContain('힌트 1회');
  await closeWord(); await click('새 퍼즐'); inputs = await openWord();
  expect(inputs.map(input => input.value)).toEqual(['', '', '', '']);
  expect(container.textContent).toContain('힌트 2회');
  expect(fetcher).not.toHaveBeenCalled();
});

it('registers hints before submission and completes a hint-assisted word only once', async () => {
  await act(async () => root.render(<QuizPage />));
  let inputs = await openWord();
  await click('힌트 2회');
  expect(wordProgressStore.getSnapshot().hintUsedWordIds).toEqual(['bear']);
  expect(wordProgressStore.getSnapshot().completedWordIds).toEqual([]);
  await closeWord(); inputs = await openWord();
  await type(inputs[1], 'E'); await type(inputs[2], 'A');
  await click('힌트 1회');
  await act(async () => vi.advanceTimersByTime(250));
  expect(wordProgressStore.getSnapshot().completedWordIds).toEqual(['bear']);
  expect(wordProgressStore.getSnapshot().hintUsedWordIds).toEqual(['bear']);
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.querySelector('[aria-label="전체 정답 진행"]')?.textContent).toBe('1 / 2');
});

it('restores a hidden word on hint use without any incorrect input', async () => {
  localStorage.setItem(WORD_PROGRESS_KEY, JSON.stringify({ completedWordIds: ['bear'], bookmarkedWordIds: ['bear'],
    hintUsedWordIds: ['bear'], dismissedMistakeWordIds: ['bear'] }));
  wordProgressStore.reload();
  await act(async () => root.render(<QuizPage />));
  await openWord(); await click('힌트 2회');
  expect(wordProgressStore.getSnapshot()).toMatchObject({ completedWordIds: ['bear'], bookmarkedWordIds: ['bear'],
    hintUsedWordIds: ['bear'], dismissedMistakeWordIds: [] });
});

it('cancels pending automatic completion when the modal is closed', async () => {
  const onSubmit = vi.fn(() => true);
  await act(async () => root.render(<WordInputModal isOpen word={across} currentLetters={[]}
    onClose={() => {}} onSubmit={onSubmit} />));
  const inputs = container.querySelectorAll('input');
  await type(inputs[0], 'B'); await type(inputs[1], 'E'); await type(inputs[2], 'A');
  await click('힌트 2회');
  await act(async () => root.render(null));
  await act(async () => vi.advanceTimersByTime(250));
  expect(onSubmit).not.toHaveBeenCalled();
});

it('separates long explanations from the fixed title, close control, inputs and actions', async () => {
  const longWord = { ...across, meaning: '긴 뜻; '.repeat(30), synonym: 'long synonym; '.repeat(30), example: 'A bear walked slowly. '.repeat(30) };
  await act(async () => root.render(<WordInputModal isOpen word={longWord} currentLetters={[]}
    onClose={() => {}} onSubmit={() => false} />));
  const region = container.querySelector('[aria-label="문제 설명"]');
  expect(region?.textContent).toContain(longWord.meaning);
  expect(region?.getAttribute('tabindex')).toBe('0');
  expect(region?.querySelector('input, button')).toBeNull();
  expect(region?.contains(container.querySelector('[aria-label="닫기"]'))).toBe(false);
  expect(container.querySelectorAll('[role="dialog"] input')).toHaveLength(4);
  expect(container.textContent).toContain('힌트 2회');
});

it.each([[12, 6], [8, 4], [5, 2], [1, 0]])('shows %i blanks as %i hints in a new modal', async (blanks, hints) => {
  await act(async () => root.render(<WordInputModal isOpen word={{ ...across, word: 'ABCDEFGHIJKL' }}
    currentLetters={Array.from({ length: 12 }, (_, index) => index < blanks ? '' : 'ABCDEFGHIJKL'[index])}
    onClose={() => {}} onSubmit={() => false} />));
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('힌트'));
  expect(button?.textContent?.trim()).toBe(`힌트 ${hints}회`);
  expect(button?.disabled).toBe(hints === 0);
});
