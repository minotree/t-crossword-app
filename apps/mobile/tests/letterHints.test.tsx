// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defaultVocabList, generateCrossword } from '@t-crossword/core';
import { AnswerEntry } from '../src/components/AnswerEntry.js';
import { HomePage } from '../src/pages/HomePage.js';
import { readProgress, writeProgress } from '../src/adapters/progress.js';

// Test mobile state transitions without pretending that jsdom runs Ionic/native bridges.
vi.mock('@ionic/react', () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { IonPage: Box, IonContent: Box, IonHeader: Box, IonFooter: Box, IonTitle: Box, IonToolbar: Box,
    IonIcon: () => null,
    IonButton: ({ children, onClick, disabled, type }: { children?: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' | 'reset' }) =>
      <button type={type ?? 'button'} disabled={disabled} onClick={onClick}>{children}</button>,
  };
});

const puzzle = generateCrossword(defaultVocabList, 'beginner', 8);
const target = (() => {
  const entry = puzzle.words.find(word => word.orientation === 'across');
  if (!entry) throw new Error('Missing across word');
  return entry;
})();
const word = { id: 'bear', word: 'BEAR', meaning: '곰', orientation: 'across' as const,
  startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0 };
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear(); vi.useFakeTimers();
  window.matchMedia = vi.fn(media => ({ matches: false, media, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  vi.stubGlobal('Worker', class {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    postMessage() { this.onmessage?.({ data: { puzzle } }); }
    terminate() {}
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function click(text: string) {
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.trim() === text);
  if (!button) throw new Error(`Missing button: ${text}`);
  await act(async () => button.click());
}
async function type(input: HTMLInputElement, value: string, isComposing = false) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Missing setter');
    setter.call(input, value); input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing }));
  });
}

it.each([false, true])('handles English input immediately with native isComposing=%s', async isComposing => {
  const onSubmit = vi.fn();
  await act(async () => root.render(<AnswerEntry word={word} known={['', 'E', '', '']}
    error="" onClose={() => {}} onSubmit={onSubmit} />));
  await act(async () => vi.advanceTimersByTime(1));
  const inputs = container.querySelectorAll('input');
  expect(inputs[0].maxLength).toBe(1);
  const focusNext = vi.spyOn(inputs[2], 'focus');
  const selectNext = vi.spyOn(inputs[2], 'select');
  await type(inputs[0], 'b', isComposing);
  expect(inputs[0].value).toBe('B');
  expect(focusNext).toHaveBeenCalledWith({ preventScroll: true });
  expect(selectNext).toHaveBeenCalled();
  expect(document.activeElement).toBe(inputs[2]);
  await type(inputs[2], 'a', isComposing);
  expect(onSubmit).not.toHaveBeenCalled();
  await type(inputs[3], 'r', isComposing);
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith('BEAR');
  await type(inputs[3], 'r', isComposing);
  expect(onSubmit).toHaveBeenCalledOnce();
});

it('selects an existing letter for replacement and still advances when the letter is unchanged', async () => {
  await act(async () => root.render(<AnswerEntry word={word} known={['', '', '', '']}
    error="" onClose={() => {}} onSubmit={() => {}} />));
  await act(async () => vi.advanceTimersByTime(1));
  const inputs = container.querySelectorAll('input');
  await type(inputs[0], 'x'); await type(inputs[1], 'e');
  await act(async () => inputs[0].focus());
  expect(inputs[0].selectionStart).toBe(0); expect(inputs[0].selectionEnd).toBe(1);
  await type(inputs[0], 'b');
  expect(inputs[0].value).toBe('B'); expect(document.activeElement).toBe(inputs[1]);
  expect(inputs[1].selectionStart).toBe(0); expect(inputs[1].selectionEnd).toBe(1);
  await act(async () => inputs[0].focus());
  await type(inputs[0], 'b');
  expect(document.activeElement).toBe(inputs[1]);
  await act(async () => { inputs[1].setSelectionRange(1, 1); inputs[1].click(); });
  expect(inputs[1].selectionStart).toBe(0); expect(inputs[1].selectionEnd).toBe(1);
});

it('validates only the last character and retains Android deletion and arrow navigation', async () => {
  const onMistake = vi.fn();
  await act(async () => root.render(<AnswerEntry word={word} known={['', 'E', '', '']}
    error="" onClose={() => {}} onSubmit={() => {}} onMistake={onMistake} />));
  await act(async () => vi.advanceTimersByTime(1));
  const inputs = container.querySelectorAll('input');
  await type(inputs[0], 'x');
  expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
  await type(inputs[0], 'b\uD55C');
  expect(inputs[0].value).toBe('X'); expect(onMistake).toHaveBeenCalledOnce();
  await type(inputs[0], 'xb');
  expect(inputs[0].value).toBe('B'); expect(inputs[0].getAttribute('aria-invalid')).toBeNull();
  await act(async () => inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true })));
  expect(document.activeElement).toBe(inputs[0]);
  expect(inputs[0].value).toBe('B'); // Android moves back without clearing the previous cell.
  await type(inputs[0], '');
  expect(inputs[0].value).toBe('');
  await act(async () => inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  expect(document.activeElement).toBe(inputs[2]);
  await act(async () => inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
  expect(document.activeElement).toBe(inputs[0]);
});

async function openTarget() {
  await click('퀴즈 시작'); await click('문제 전체 보기');
  const clue = Array.from(container.querySelectorAll<HTMLButtonElement>('.mobile-clue-button')).find(button => button.textContent?.includes(target.meaning));
  if (!clue) throw new Error('Missing clue');
  await act(async () => clue.click());
  await act(async () => vi.advanceTimersByTime(1));
  return Array.from(container.querySelectorAll<HTMLInputElement>('.mobile-answer input'));
}

it.each([[12, 6], [8, 4], [5, 2], [1, 0]])('initializes %i empty cells with %i hints', async (blanks, hints) => {
  await act(async () => root.render(<AnswerEntry word={{ ...word, word: 'ABCDEFGHIJKL' }}
    known={Array.from({ length: 12 }, (_, index) => index < blanks ? '' : 'ABCDEFGHIJKL'[index])}
    error="" onClose={() => {}} onSubmit={() => {}} />));
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent === `힌트 ${hints}회`);
  expect(button?.disabled).toBe(hints === 0);
});

it('keeps the first wrong letter revealed, clears only its feedback, and moves to the next editable cell', async () => {
  const onSubmit = vi.fn();
  await act(async () => root.render(<AnswerEntry word={word} known={['', '', '', '']} error="" onClose={() => {}} onSubmit={onSubmit} />));
  await act(async () => vi.advanceTimersByTime(1));
  const inputs = container.querySelectorAll('input');
  await type(inputs[0], 'X'); await type(inputs[1], 'X'); await click('힌트 2회');
  expect(inputs[0].value).toBe('B'); expect(inputs[0].readOnly).toBe(true);
  expect(inputs[0].getAttribute('aria-invalid')).toBeNull();
  expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
  expect(document.activeElement).toBe(inputs[1]);
  await act(async () => vi.advanceTimersByTime(3000));
  expect(inputs[0].value).toBe('B');
  await type(inputs[0], 'X'); expect(inputs[0].value).toBe('B');
  expect(onSubmit).not.toHaveBeenCalled();
});

it('preserves the hinted notebook entry when the same click completes the word', async () => {
  writeProgress({ completed: [target.id], bookmarks: [target.id], hintedWords: [target.id], hiddenHintedWords: [target.id] });
  await act(async () => root.render(<HomePage />));
  const inputs = await openTarget();
  for (let index = 0; index < target.word.length - 1; index++) await type(inputs[index], target.word[index]);
  await click(`힌트 ${Math.floor(target.word.length / 2)}회`);
  expect(readProgress()).toEqual({ completed: [target.id], bookmarks: [target.id], hintedWords: [target.id], hiddenHintedWords: [] });
  expect(container.querySelector('.mobile-answer input')).toBeNull();
  expect(container.querySelector('.mobile-quiz-summary-actions')?.textContent).toContain(`1 / ${puzzle.words.length}`);
});

it('does not consume a hint or reveal a letter when notebook persistence fails', async () => {
  await act(async () => root.render(<HomePage />));
  const inputs = await openTarget();
  const hints = Math.floor(target.word.length / 2);
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  await click(`힌트 ${hints}회`);
  expect(inputs[0].value).toBe(''); expect(inputs[0].readOnly).toBe(false);
  expect(container.textContent).toContain('기록 저장에 실패했습니다.');
  expect(container.textContent).toContain(`힌트 ${hints}회`);
  save.mockRestore(); await click(`힌트 ${hints}회`);
  expect(inputs[0].value).toBe(target.word[0]);
  expect(readProgress().hintedWords).toEqual([target.id]);
  expect(readProgress().completed).toEqual([]);
});

it('loads word audio only after a tap and stops on speed, search, page hide and menu changes', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    schemaVersion: 1, pauseMs: 500, audioPath: 'word-audio/', sourceCsvSha256: 'a'.repeat(64),
    entries: { YOU: { id: 'external-id', word: 'YOU', example: 'You can sit here.',
      file: 'word-2-aaaaaaaaaaaaaaaa.mp3', sha256: 'a'.repeat(64), seconds: 3.4 } },
  }) }));
  const elements: HTMLAudioElement[] = [];
  vi.stubGlobal('Audio', vi.fn(function () {
    const audio = document.createElement('audio');
    vi.spyOn(audio, 'play').mockResolvedValue();
    vi.spyOn(audio, 'pause').mockImplementation(() => {});
    vi.spyOn(audio, 'load').mockImplementation(() => {});
    elements.push(audio); return audio;
  }));
  const play = async (label: string) => {
    const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!button) throw new Error('Audio button missing');
    await act(async () => button.click());
  };
  await act(async () => root.render(<HomePage />));
  await click('단어장 보기');
  expect(elements).toHaveLength(0);
  expect(
    container.querySelector('.mobile-word-audio-notice')?.textContent
  ).toBe('온라인 음성 · AI 생성');
  await play('YOU 듣기');
  expect(elements[0].src).toMatch(/^https:\/\/crossword-word-audio\.minotree0902\.workers\.dev\/word-audio\/word-2-[a-f0-9]{16}\.mp3$/);
  await act(async () => elements[0].dispatchEvent(new Event('playing')));
  expect(container.querySelector('button[aria-label="YOU 듣기 중지"]')?.getAttribute('aria-pressed')).toBe('true');
  await play('YOU 느리게 듣기');
  expect(elements[0].pause).toHaveBeenCalled();
  expect(elements[1].playbackRate).toBe(0.7);
  const search = container.querySelector<HTMLInputElement>('input[type="search"]');
  if (!search) throw new Error('Search missing');
  await type(search, 'YOU');
  expect(elements[1].pause).toHaveBeenCalled();
  await play('YOU 듣기');
  await act(async () => window.dispatchEvent(new Event('pagehide')));
  expect(elements[2].pause).toHaveBeenCalled();
  await play('YOU 듣기'); await click('홈');
  expect(elements[3].pause).toHaveBeenCalled();
});

it('shows the word audio internet requirement in settings notices', async () => {
  await act(async () => root.render(<HomePage />));
  await click('설정');
  const notices = container.querySelector('[aria-labelledby="mobile-settings-notices"]');
  expect(notices).not.toBeNull();
  expect(notices?.textContent).toContain('단어장 듣기는 단어와 예문을 함께 재생합니다. AI 생성 음성이며 인터넷 연결이 필요합니다.');
});

it('separates long explanations from the title and mobile answer controls', async () => {
  const longWord = { ...word, meaning: '긴 뜻; '.repeat(30), synonym: 'long synonym; '.repeat(30), example: 'A bear walked slowly. '.repeat(30) };
  await act(async () => root.render(<AnswerEntry word={longWord} known={['', '', '', '']} error="" onClose={() => {}} onSubmit={() => {}} />));
  const region = container.querySelector('[aria-label="문제 설명"]');
  expect(region?.textContent).toContain(longWord.meaning);
  expect(region?.getAttribute('tabindex')).toBe('0');
  expect(region?.querySelector('input, button, h2')).toBeNull();
  expect(container.querySelector('.mobile-answer-controls')?.contains(container.querySelector('input'))).toBe(true);
  expect(container.querySelectorAll('.mobile-answer-actions button')).toHaveLength(3);
});
