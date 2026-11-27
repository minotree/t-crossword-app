// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { createEncouragementAudio } from '../src/adapters/encouragementAudio.js';
import { EncouragementAudio } from '../src/components/EncouragementAudio.js';
import { wordSpeechStore } from '../src/adapters/wordSpeech.js';

const url = 'https://crossword-content-audio.minotree0902.workers.dev/encouragement-audio/encouragement-01-d09e28d8172e1d33.mp3';
function audioElement() {
  const audio = document.createElement('audio');
  vi.spyOn(audio, 'play').mockResolvedValue();
  vi.spyOn(audio, 'pause').mockImplementation(() => {});
  vi.spyOn(audio, 'load').mockImplementation(() => {});
  return audio;
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it('plays only on request, toggles stop, handles timeout/error/retry and clears stale callbacks', async () => {
  vi.useFakeTimers();
  const elements: HTMLAudioElement[] = [];
  const factory = vi.fn(() => { const audio = audioElement(); elements.push(audio); return audio; });
  const player = createEncouragementAudio(url, factory);
  expect(factory).not.toHaveBeenCalled();
  player.toggle();
  expect(elements[0].src).toBe(url);
  expect(elements[0].preload).toBe('none');
  elements[0].dispatchEvent(new Event('playing'));
  expect(player.getSnapshot()).toBe('playing');
  player.toggle();
  expect(elements[0].pause).toHaveBeenCalledOnce();
  expect(elements[0].hasAttribute('src')).toBe(false);
  expect(player.getSnapshot()).toBe('idle');
  player.toggle();
  await vi.advanceTimersByTimeAsync(15000);
  expect(player.getSnapshot()).toBe('error');
  player.toggle();
  elements[2].dispatchEvent(new Event('error'));
  expect(player.getSnapshot()).toBe('error');
  player.toggle();
  elements[3].dispatchEvent(new Event('ended'));
  expect(player.getSnapshot()).toBe('idle');
  player.toggle();
  const lateFailure = elements[4].onerror;
  player.stop(); player.toggle();
  lateFailure?.call(elements[4], new Event('error'));
  expect(player.getSnapshot()).toBe('loading');
  player.stop();
});

it('ignores late rejected play promises and permits retry after a real rejection', async () => {
  let reject: (reason?: unknown) => void = () => {};
  const first = audioElement();
  vi.mocked(first.play).mockReturnValue(new Promise<void>((_resolve, fail) => { reject = fail; }));
  const next = audioElement();
  const player = createEncouragementAudio(url, vi.fn().mockReturnValueOnce(first).mockReturnValue(next));
  player.toggle(); player.stop(); player.toggle();
  reject(new Error('late'));
  await Promise.resolve();
  expect(player.getSnapshot()).toBe('loading');
  player.stop();
  vi.mocked(next.play).mockRejectedValue(new Error('blocked'));
  player.toggle(); await Promise.resolve();
  expect(player.getSnapshot()).toBe('error');
  player.stop();
});

it('cleans playback on phrase changes, pagehide and unmount, and stops word-bank speech before playback', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const elements: HTMLAudioElement[] = [];
  vi.stubGlobal('Audio', function () { const audio = audioElement(); elements.push(audio); return audio; });
  const speechStop = vi.spyOn(wordSpeechStore, 'stop');
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<EncouragementAudio url={url} />));
    expect(elements).toHaveLength(0);
    await act(async () => host.querySelector('button')?.click());
    expect(speechStop).toHaveBeenCalled();
    expect(elements).toHaveLength(1);
    await act(async () => root.render(<EncouragementAudio url={url + '?next'} />));
    expect(elements[0].pause).toHaveBeenCalled();
    await act(async () => host.querySelector('button')?.click());
    await act(async () => window.dispatchEvent(new Event('pagehide')));
    expect(elements[1].pause).toHaveBeenCalled();
    await act(async () => host.querySelector('button')?.click());
    await act(async () => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(elements[2].pause).toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(async () => host.querySelector('button')?.click());
    await act(async () => document.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(elements[3].pause).toHaveBeenCalled();
    await act(async () => host.querySelector('button')?.click());
    await act(async () => root.unmount());
    expect(elements[4].pause).toHaveBeenCalled();
  } finally { host.remove(); }
});
