// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { subscribeWordAudioLifecycle } from '../src/adapters/wordAudioLifecycle.js';

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => true) } }));
afterEach(() => vi.restoreAllMocks());

it('stops on native background, document hide, page hide, and removes listeners on cleanup', async () => {
  const remove = vi.fn().mockResolvedValue(undefined);
  const add = vi.mocked(App.addListener).mockResolvedValue({ remove });
  const stop = vi.fn(); const error = vi.fn();
  const cleanup = subscribeWordAudioLifecycle(stop, error);
  await Promise.resolve();
  const callback = add.mock.calls[0][1] as (state: { isActive: boolean }) => void;
  callback({ isActive: false }); expect(stop).toHaveBeenCalledTimes(1);
  callback({ isActive: true }); expect(stop).toHaveBeenCalledTimes(1);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide'));
  expect(stop).toHaveBeenCalledTimes(3);
  cleanup(); expect(remove).toHaveBeenCalledOnce();
  window.dispatchEvent(new Event('pagehide')); expect(stop).toHaveBeenCalledTimes(4);
  expect(error).not.toHaveBeenCalled();
});

it('removes a native listener that arrives after cleanup and reports setup failure', async () => {
  let resolve: (handle: { remove: () => Promise<void> }) => void = () => {};
  vi.mocked(App.addListener).mockReturnValue(new Promise(done => { resolve = done; }));
  const cleanup = subscribeWordAudioLifecycle(vi.fn(), vi.fn());
  cleanup();
  const remove = vi.fn().mockResolvedValue(undefined);
  resolve({ remove }); await Promise.resolve(); expect(remove).toHaveBeenCalledOnce();
  const error = vi.fn();
  vi.mocked(App.addListener).mockRejectedValue(new Error('unsupported'));
  const dispose = subscribeWordAudioLifecycle(vi.fn(), error);
  await Promise.resolve(); await Promise.resolve();
  expect(error).toHaveBeenCalledOnce(); dispose();
});

it('uses browser lifecycle only outside native apps', () => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(false);
  const add = vi.mocked(App.addListener).mockClear();
  const stop = vi.fn(); const cleanup = subscribeWordAudioLifecycle(stop, vi.fn());
  window.dispatchEvent(new Event('pagehide'));
  expect(stop).toHaveBeenCalledOnce(); expect(add).not.toHaveBeenCalled(); cleanup();
});
