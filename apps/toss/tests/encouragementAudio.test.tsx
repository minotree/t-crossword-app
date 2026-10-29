// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { EncouragementAudio } from '../src/components/EncouragementAudio.js';
import entries from '../src/data/encouragement-audio.json';

let root: Root;
let container: HTMLDivElement;
let elements: HTMLAudioElement[];
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.assign(window, { __appsInTossConstants: { safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } } });
  window.matchMedia = vi.fn((media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true }));
  elements = [];
  vi.stubGlobal('Audio', function () {
    const audio = document.createElement('audio');
    vi.spyOn(audio, 'play').mockResolvedValue();
    vi.spyOn(audio, 'pause').mockImplementation(() => {});
    vi.spyOn(audio, 'load').mockImplementation(() => {});
    elements.push(audio);
    return audio;
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function render(index = 0) {
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><EncouragementAudio key={entries[index].english} english={entries[index].english} /></TDSMobileAITProvider>));
}
async function click() { await act(async () => container.querySelector('button')?.click()); }

it('plays only after click, exposes loading/stop and releases on phrase change', async () => {
  await render(); expect(elements).toHaveLength(0);
  await click(); expect(elements[0].src).toContain('/encouragement-audio/'+entries[0].file);
  expect(container.textContent).toContain('불러오는 중');
  await act(async () => { elements[0].dispatchEvent(new Event('playing')); });
  expect(container.textContent).toContain('듣기 중지');
  await render(1); expect(elements[0].pause).toHaveBeenCalled();
  expect(elements[0].hasAttribute('src')).toBe(false);
  await click(); await click(); expect(elements[1].hasAttribute('src')).toBe(false);
});

it('stops when hidden and allows retry after loading timeout', async () => {
  vi.useFakeTimers(); await render(); await click();
  await act(async () => vi.advanceTimersByTime(15000));
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  await click(); expect(elements).toHaveLength(2);
  const previous = Object.getOwnPropertyDescriptor(document, 'hidden');
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(elements[1].hasAttribute('src')).toBe(false);
  if (previous) Object.defineProperty(document, 'hidden', previous); else Reflect.deleteProperty(document, 'hidden');
});

it('ignores a rejected play promise after switching phrases', async () => {
  await render(); await click(); await click();
  let reject: ((reason: Error) => void) | undefined;
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
  // Factory instances have their own play mock; override the constructor for this attempt.
  vi.stubGlobal('Audio', function () {
    const audio = document.createElement('audio');
    vi.spyOn(audio, 'pause').mockImplementation(() => {}); vi.spyOn(audio, 'load').mockImplementation(() => {});
    return audio;
  });
  await click(); await render(1);
  await act(async () => reject?.(new Error('cancelled')));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
