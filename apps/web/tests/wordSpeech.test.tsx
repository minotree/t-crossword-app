// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createWordSpeechStore } from '../src/adapters/wordSpeech.js';
import { WordSpeechButtons } from '../src/components/WordSpeechButtons.js';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: { lang: string } | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}
let spoken: FakeUtterance[];
let cancel: ReturnType<typeof vi.fn>;
beforeEach(() => {
  spoken = [];
  cancel = vi.fn();
  vi.useFakeTimers();
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', { cancel, speak: (utterance: FakeUtterance) => { spoken.push(utterance); },
    getVoices: () => [{ lang: 'ko-KR' }, { lang: 'en-GB' }, { lang: 'en-US' }] });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('reads only the English word and example with an English voice and the selected speed', () => {
  const store = createWordSpeechStore();
  store.speak('you', 'YOU', 'You can sit here.', true);
  expect(spoken[0]).toMatchObject({ text: 'you. You can sit here.', lang: 'en-US', rate: 0.7, voice: { lang: 'en-US' } });
  spoken[0].onstart?.();
  vi.advanceTimersByTime(9000);
  expect(store.getSnapshot().playing).toBe(true);
  spoken[0].onend?.();
  expect(store.getSnapshot().playing).toBe(false);
});

it('replaces current speech and ignores late cancellation events from the previous word', () => {
  const store = createWordSpeechStore();
  store.speak('one', 'ONE', undefined);
  store.speak('two', 'TWO', 'There are two books.');
  expect(cancel).toHaveBeenCalledTimes(2);
  spoken[0].onerror?.({ error: 'canceled' });
  spoken[0].onend?.();
  expect(store.getSnapshot()).toMatchObject({ wordId: 'two', playing: true, error: null });
  store.speak('two', 'TWO', undefined);
  expect(store.getSnapshot().playing).toBe(false);
  expect(spoken).toHaveLength(2);
});

it('switches speeds by replacing speech and exposes missing English voice errors', () => {
  const store = createWordSpeechStore();
  store.speak('one', 'ONE', undefined);
  store.speak('one', 'ONE', undefined, true);
  expect(spoken[1].rate).toBe(0.7);
  spoken[1].onerror?.({ error: 'language-unavailable' });
  expect(store.getSnapshot()).toMatchObject({ playing: false, error: expect.stringContaining('영어 음성') });
  store.speak('one', 'ONE', undefined);
  expect(store.getSnapshot().error).toBeNull();
});

it('handles unsupported environments without throwing or pretending to play', () => {
  vi.stubGlobal('speechSynthesis', undefined);
  const store = createWordSpeechStore();
  store.speak('one', 'ONE', undefined);
  expect(store.getSnapshot()).toMatchObject({ playing: false, error: expect.stringContaining('지원하지 않습니다') });
});

it('uses the requested English language while the browser voice list is still loading', () => {
  vi.stubGlobal('speechSynthesis', { cancel, speak: (utterance: FakeUtterance) => { spoken.push(utterance); }, getVoices: () => [] });
  const store = createWordSpeechStore();
  store.speak('one', 'ONE', undefined);
  expect(spoken[0]).toMatchObject({ lang: 'en-US', voice: null });
  vi.advanceTimersByTime(8000);
  expect(store.getSnapshot()).toMatchObject({ playing: false, error: expect.stringContaining('시작되지 않았습니다') });
});

it('explicitly stops speech and clears the playback watchdog for navigation cleanup', () => {
  const store = createWordSpeechStore();
  store.speak('one', 'ONE', undefined);
  store.stop();
  vi.advanceTimersByTime(9000);
  expect(store.getSnapshot()).toMatchObject({ wordId: null, playing: false, error: null });
});

it('provides keyboard-operable listen, slow and stop buttons with accessible state', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onSpeak = vi.fn();
  try {
    await act(async () => root.render(<WordSpeechButtons wordId="one" word="ONE"
      speech={{ wordId: 'one', rate: 0.7, playing: true, error: null }} onSpeak={onSpeak} />));
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].textContent).toBe('듣기');
    expect(buttons[1].textContent).toBe('중지');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    await act(async () => buttons[0].click());
    expect(onSpeak).toHaveBeenCalledWith(false);
    await act(async () => buttons[1].click());
    expect(onSpeak).toHaveBeenLastCalledWith(true);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
