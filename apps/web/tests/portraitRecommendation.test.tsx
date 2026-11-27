// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { PortraitRecommendation } from '../src/components/PortraitRecommendation.js';
import { QuizPage } from '../src/pages/QuizPage.js';
import type { CrosswordWord } from '@t-crossword/core';

const generate = vi.hoisted(() => vi.fn());
vi.mock('@t-crossword/core', async original => ({ ...await original<typeof import('@t-crossword/core')>(), generateCrossword: generate }));
vi.mock('../src/components/CrosswordBoard.js', () => ({ CrosswordBoard: ({ onSelectWord }: { onSelectWord: (word: CrosswordWord) => void }) =>
  <button onClick={() => onSelectWord({ id: 'bear', word: 'BEAR', meaning: '곰', orientation: 'across', startRow: 0, startCol: 0, number: 1, hintLimit: 0, hintUsedCount: 0 })}>test word</button> }));
vi.mock('../src/components/WordInputModal.js', () => ({ WordInputModal: ({ isOpen }: { isOpen: boolean }) =>
  isOpen ? <input aria-label="test answer" defaultValue="" /> : null }));

function viewport(width: number, height: number, coarse: boolean, hover = false) {
  const queries: { query: string; matches: boolean; listeners: Set<() => void> }[] = [];
  const matches = (query: string) => width > height &&
    (!query.includes('max-height') || height <= 500) &&
    (!query.includes('pointer: coarse') || coarse) &&
    (!query.includes('hover: none') || !hover);
  vi.stubGlobal('matchMedia', (query: string) => {
    const entry = { query, matches: matches(query), listeners: new Set<() => void>() };
    queries.push(entry);
    return { get matches() { return entry.matches; }, media: query,
      addEventListener: (_name: string, listener: () => void) => entry.listeners.add(listener),
      removeEventListener: (_name: string, listener: () => void) => entry.listeners.delete(listener) };
  });
  return {
    change(w: number, h: number) {
      width = w; height = h;
      const changed = queries.filter(entry => entry.matches !== matches(entry.query));
      for (const entry of queries) entry.matches = matches(entry.query);
      changed.forEach(entry => entry.listeners.forEach(listener => listener()));
    },
    listenerCount: () => queries.reduce((total, entry) => total + entry.listeners.size, 0),
  };
}
afterEach(() => { vi.unstubAllGlobals(); generate.mockReset(); });

it.each([
  [390, 859, true, false, false], [844, 390, true, false, true], [640, 360, true, false, true],
  [768, 1024, true, false, false], [1024, 768, true, false, false],
  [1280, 720, false, true, false], [844, 390, false, true, false], [640, 360, false, true, false],
  [844, 390, true, true, false],
])('advises at %ix%i, coarse=%s hover=%s only when appropriate', async (width, height, coarse, hover, visible) => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  viewport(Number(width), Number(height), Boolean(coarse), Boolean(hover));
  const host = document.createElement('div'); const root = createRoot(host);
  try {
    await act(async () => root.render(<PortraitRecommendation />));
    expect(Boolean(host.querySelector('aside'))).toBe(visible);
  } finally { await act(async () => root.unmount()); }
});

it('dismisses throughout landscape resizes, hides on portrait, rearms on the next landscape and releases listeners', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const media = viewport(844, 390, true);
  const host = document.createElement('div'); const root = createRoot(host);
  try {
    await act(async () => root.render(<PortraitRecommendation />));
    expect(host.textContent).toContain('세로 화면에서 학습해 보세요.');
    await act(async () => host.querySelector('button')?.click());
    await act(async () => { media.change(1024, 768); });
    await act(async () => { media.change(640, 360); });
    await act(async () => root.render(<PortraitRecommendation />));
    expect(host.querySelector('aside')).toBeNull();
    await act(async () => { media.change(390, 859); });
    await act(async () => { media.change(844, 390); });
    expect(host.querySelector('aside')).not.toBeNull();
    await act(async () => { media.change(390, 859); });
    expect(host.querySelector('aside')).toBeNull();
  } finally { await act(async () => root.unmount()); }
  expect(media.listenerCount()).toBe(0);
});

it('keeps the generated puzzle and open answer input when rotating or dismissing', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const media = viewport(390, 859, true);
  generate.mockReturnValue({ size: 8, level: 'beginner', words: [{ id: 'bear', word: 'BEAR' }], grid: [] });
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<QuizPage />));
    const word = [...host.querySelectorAll('button')].find(button => button.textContent === 'test word');
    await act(async () => word?.click());
    const input = host.querySelector<HTMLInputElement>('input[aria-label="test answer"]');
    if (!input) throw new Error('Answer not open');
    input.value = 'BE';
    await act(async () => { media.change(844, 390); });
    await act(async () => host.querySelector<HTMLButtonElement>('.mnu-web-portrait-advice button')?.click());
    await act(async () => { media.change(390, 859); });
    expect(host.querySelector('input')).toBe(input);
    expect(input.value).toBe('BE');
    expect(generate).toHaveBeenCalledTimes(1);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
