// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { createWordAudio } from '../src/adapters/wordAudio.js';

const manifest = {
  a: { word: 'YOU', example: 'You can sit here.', file: 'word-2-0123456789abcdef.mp3' },
  b: { word: 'SEA', example: 'The sea is blue.', file: 'word-3-0123456789abcdef.mp3' },
};
function fixture(base = 'https://audio.example.com/word-audio/') {
  const elements: HTMLAudioElement[] = [];
  const factory = () => {
    const audio = document.createElement('audio');
    vi.spyOn(audio, 'play').mockResolvedValue(); vi.spyOn(audio, 'pause').mockImplementation(() => {}); vi.spyOn(audio, 'load').mockImplementation(() => {});
    elements.push(audio); return audio;
  };
  return { store: createWordAudio(base, manifest, factory), elements, factory };
}
afterEach(() => vi.useRealTimers());

it('loads only on click, plays at normal/slow speed, and toggles stop', () => {
  const { store, elements } = fixture();
  expect(elements).toHaveLength(0);
  store.speak('a', manifest.a.word, manifest.a.example, false);
  expect(store.getSnapshot().status).toBe('loading');
  expect(elements[0].src).toBe('https://audio.example.com/word-audio/' + manifest.a.file);
  elements[0].dispatchEvent(new Event('playing'));
  expect(store.getSnapshot().status).toBe('playing');
  store.speak('a', manifest.a.word, manifest.a.example, false);
  expect(elements[0].pause).toHaveBeenCalled();
  expect(store.getSnapshot().status).toBe('idle');
  store.speak('a', manifest.a.word, manifest.a.example, true);
  expect(elements[1].playbackRate).toBe(0.7);
  expect(elements[1].preservesPitch).toBe(true);
  elements[1].dispatchEvent(new Event('ended'));
  expect(store.getSnapshot().status).toBe('idle');
});

it('cancels the previous word and ignores its late play rejection', async () => {
  const { elements, factory } = fixture();
  const old = factory();
  let rejectOld: (reason: Error) => void = () => {};
  vi.mocked(old.play).mockReturnValue(new Promise<void>((_, reject) => { rejectOld = reject; }));
  let calls = 0;
  const second = createWordAudio('https://audio.example.com/', manifest, () => calls++ === 0 ? old : factory());
  second.speak('a', manifest.a.word, manifest.a.example, false);
  second.speak('b', manifest.b.word, manifest.b.example, false);
  rejectOld(new Error('old'));
  await Promise.resolve();
  expect(second.getSnapshot().wordId).toBe('b');
  elements[1].dispatchEvent(new Event('playing'));
  expect(second.getSnapshot().status).toBe('playing');
  second.stop();
});

it('stops the current file before another word starts', () => {
  const { store, elements } = fixture();
  store.speak('a', manifest.a.word, manifest.a.example, false);
  store.speak('b', manifest.b.word, manifest.b.example, false);
  expect(elements[0].pause).toHaveBeenCalled();
  expect(elements[0].getAttribute('src')).toBeNull();
  expect(store.getSnapshot().wordId).toBe('b');
  store.stop();
});

it('rejects stale content, unsafe paths and unconfigured or insecure origins', () => {
  const { store, elements } = fixture();
  expect(store.hasAudio('a', 'YOU', 'Changed.')).toBe(false);
  store.speak('a', 'YOU', 'Changed.', false);
  expect(store.getSnapshot().status).toBe('error');
  expect(elements).toHaveLength(0);
  for (const origin of ['', 'http://external.example/', 'https://user:pass@example.com/', 'https://example.com/?x=1']) {
    const instance = fixture(origin);
    instance.store.speak('a', manifest.a.word, manifest.a.example, false);
    expect(instance.store.getSnapshot().status).toBe('error');
    expect(instance.elements).toHaveLength(0);
  }
  const unsafe = createWordAudio('https://example.com/', { a: { ...manifest.a, file: '../evil.mp3' } });
  expect(unsafe.hasAudio('a', manifest.a.word, manifest.a.example)).toBe(false);
});

it('reports load errors and timeouts and releases pending playback', () => {
  vi.useFakeTimers();
  const { store, elements } = fixture();
  store.speak('a', manifest.a.word, manifest.a.example, false);
  elements[0].dispatchEvent(new Event('error'));
  expect(store.getSnapshot().status).toBe('error');
  store.speak('a', manifest.a.word, manifest.a.example, false);
  vi.advanceTimersByTime(15000);
  expect(store.getSnapshot().status).toBe('error');
  expect(vi.getTimerCount()).toBe(0);
});

it('clears playback state on an external pause and times out stalled playback', () => {
  vi.useFakeTimers();
  const { store, elements } = fixture();
  store.speak('a', manifest.a.word, manifest.a.example, false);
  elements[0].dispatchEvent(new Event('playing'));
  elements[0].dispatchEvent(new Event('pause'));
  expect(store.getSnapshot().status).toBe('idle');
  store.speak('a', manifest.a.word, manifest.a.example, false);
  elements[1].dispatchEvent(new Event('playing'));
  elements[1].dispatchEvent(new Event('waiting'));
  expect(store.getSnapshot().status).toBe('loading');
  vi.advanceTimersByTime(15000);
  expect(store.getSnapshot().status).toBe('error');
});
