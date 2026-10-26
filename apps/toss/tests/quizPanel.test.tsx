// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { QuizPanel, type QuizPanelHandle } from '../src/components/QuizPanel.js';

const across: CrosswordWord = { id: 'across', word: 'SEA', meaning: '바다', orientation: 'across', startRow: 0, startCol: 0, number: 16, hintLimit: 1, hintUsedCount: 0 };
const down: CrosswordWord = { ...across, id: 'down', word: 'SUN', meaning: '해', orientation: 'down' };
const puzzle: CrosswordPuzzle = { level: 'beginner', size: 8, words: [across, down], grid: [[{ row: 0, col: 0, letter: 'S', acrossNumber: 16, downNumber: 16 }]] };
let root: Root;
let container: HTMLDivElement;
const onSelect = vi.fn();
const panel = createRef<QuizPanelHandle>();
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.assign(window, { __appsInTossConstants: { safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } } });
  window.matchMedia = vi.fn((media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true }));
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
beforeEach(() => { onSelect.mockReset(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render(solvedIds: string[] = []) {
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><QuizPanel ref={panel} puzzle={puzzle} solvedIds={solvedIds} onSelectWord={onSelect} /></TDSMobileAITProvider>));
}
async function click(selector: string) {
  const button = container.querySelector<HTMLButtonElement>(selector);
  if (!button) throw new Error(`Missing ${selector}`);
  await act(async () => button.click());
}
it('opens two direction clues and selects the requested answer', async () => {
  await render();
  await click('.cell-number');
  expect(onSelect).not.toHaveBeenCalled();
  expect(container.querySelectorAll('dialog .clue-button')).toHaveLength(2);
  await click('dialog .direction-choices > div:last-child button');
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(down);
  expect(container.querySelector('dialog')).toBeNull();
});

it('keeps the full-width board and list action together without an internal board scroller', async () => {
  await render();
  const board = container.querySelector('.board-area');
  const action = container.querySelector('.all-hints-button');
  if (!board || !action) throw new Error('Missing board or action');
  expect(container.querySelector('.board-scroll')).toBeNull();
  expect(board.parentElement).toBe(action.parentElement);
  await click('.all-hints-button');
  expect(board.querySelector('.clues')).not.toBeNull();
  await click('.hint-overlay-heading button');
  expect(board.querySelector('.clues')).toBeNull();
});
it.each([['across', down], ['down', across]] as const)('opens only the unsolved direction after %s is solved', async (solved, expected) => {
  await render([solved]); await click('.cell-number');
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(expected);
  expect(container.querySelector('dialog')).toBeNull();
});
it('disables a fully solved number and completed list items', async () => {
  await render(['across', 'down']); await click('.cell-number');
  expect(onSelect).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLButtonElement>('.cell-number')?.disabled).toBe(true);
  await click('.all-hints-button');
  expect([...container.querySelectorAll<HTMLButtonElement>('.clue-button')].every(button => button.disabled)).toBe(true);
});
it('opens the overlay with fixed headings, closes on Escape/back and preserves focus', async () => {
  await render();
  expect(container.querySelector('.clues')).toBeNull();
  await click('.all-hints-button');
  expect(container.querySelector('.clue-headings')).not.toBeNull();
  expect(document.activeElement).toBe(container.querySelector('.hint-overlay-heading button'));
  await act(async () => container.querySelector('.clues')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(container.querySelector('.clues')).toBeNull();
  expect(document.activeElement).toBe(container.querySelector('.all-hints-button'));
  await click('.all-hints-button');
  await act(async () => { expect(panel.current?.closeOverlay()).toBe(true); });
  expect(container.querySelector('.clues')).toBeNull();
});
