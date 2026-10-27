// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createWordSpeechStore } from '../src/adapters/wordSpeech.js';
import { createWordAudio } from '../src/adapters/wordAudio.js';
import { WordSpeechButtons } from '../src/components/WordSpeechButtons.js';

const entry = { id: 'external', word: 'YOU', example: 'You can sit here.',
  file: 'word-2-aaaaaaaaaaaaaaaa.mp3', sha256: 'a'.repeat(64), seconds: 3.4 };
const manifest = { schemaVersion: 1, pauseMs: 500, audioPath: 'word-audio/', sourceCsvSha256: 'a'.repeat(64), entries: { YOU: entry } };
function fixture() {
  const elements: HTMLAudioElement[] = [];
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
  vi.stubGlobal('fetch', fetcher);
  const audio = createWordAudio('https://audio.example.com/word-audio/', undefined, () => {
    const element = document.createElement('audio');
    vi.spyOn(element, 'play').mockResolvedValue();
    vi.spyOn(element, 'pause').mockImplementation(() => {});
    vi.spyOn(element, 'load').mockImplementation(() => {});
    elements.push(element); return element;
  });
  return { store: createWordSpeechStore(audio), elements, fetcher };
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it('loads the manifest once and resolves the word independently of the app ID', async () => {
  const { store, elements, fetcher } = fixture();
  expect(fetcher).not.toHaveBeenCalled();
  await store.speak('different-id', 'you', entry.example, true);
  expect(fetcher).toHaveBeenCalledWith(new URL('https://audio.example.com/manifest.json'), expect.objectContaining({ credentials: 'omit' }));
  expect(elements[0].src).toBe('https://audio.example.com/word-audio/' + entry.file);
  expect(elements[0].preload).toBe('none');
  expect(elements[0].playbackRate).toBe(0.7);
  expect(store.getSnapshot()).toMatchObject({ loading: true, playing: false });
  elements[0].dispatchEvent(new Event('playing'));
  expect(store.getSnapshot()).toMatchObject({ loading: false, playing: true });
  await store.speak('different-id', 'YOU', entry.example, true);
  expect(elements[0].pause).toHaveBeenCalled();
  await store.speak('another-id', 'YOU', entry.example);
  expect(fetcher).toHaveBeenCalledTimes(1);
  store.stop();
});

it('rejects missing words and changed examples without requesting MP3', async () => {
  const { store, elements } = fixture();
  await store.speak('x', 'MISSING', entry.example);
  expect(store.getSnapshot().error).toBeTruthy();
  await store.speak('x', 'YOU', 'Different example.');
  expect(store.getSnapshot().error).toBeTruthy();
  expect(elements).toHaveLength(0);
});

it('allows a failed manifest request to be retried', async () => {
  const { store, fetcher, elements } = fixture();
  fetcher.mockRejectedValueOnce(new Error('offline'));
  await store.speak('x', 'YOU', entry.example);
  expect(store.getSnapshot()).toMatchObject({ playing: false, loading: false, error: expect.any(String) });
  await store.speak('x', 'YOU', entry.example);
  expect(elements).toHaveLength(1);
  store.stop();
});

it('does not start playback if navigation stops a pending manifest load', async () => {
  const { store, fetcher, elements } = fixture();
  let resolve!: (value: unknown) => void;
  fetcher.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const pending = store.speak('x', 'YOU', entry.example);
  store.stop();
  resolve({ ok: true, json: async () => manifest });
  await pending;
  expect(elements).toHaveLength(0);
  expect(store.getSnapshot().wordId).toBeNull();
});

it('ignores late media events and reports playback failures and timeouts', async () => {
  vi.useFakeTimers();
  const { store, elements } = fixture();
  await store.speak('one', 'YOU', entry.example);
  const oldError = elements[0].onerror;
  await store.speak('two', 'YOU', entry.example);
  oldError?.call(elements[0], new Event('error'));
  expect(store.getSnapshot().wordId).toBe('two');
  vi.advanceTimersByTime(15000);
  expect(store.getSnapshot()).toMatchObject({ playing: false, loading: false, error: expect.any(String) });
  expect(elements[1].pause).toHaveBeenCalled();
  await store.speak('three', 'YOU', entry.example);
  elements[2].dispatchEvent(new Event('error'));
  expect(store.getSnapshot().error).toBeTruthy();
  store.stop();
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
