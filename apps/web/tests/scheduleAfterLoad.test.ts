import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleAfterLoad } from '../src/adapters/scheduleAfterLoad.js';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('background PWA registration scheduling', () => {
  it('waits for page load and then runs the fallback timer', () => {
    vi.useFakeTimers();
    const view = new EventTarget();
    vi.stubGlobal('window', view);
    vi.stubGlobal('document', { readyState: 'loading' });
    const task = vi.fn();
    const cancel = scheduleAfterLoad(task);
    vi.advanceTimersByTime(5000);
    expect(task).not.toHaveBeenCalled();
    view.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(999);
    expect(task).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(task).toHaveBeenCalledTimes(1);
    cancel();
  });

  it('cancels both the load listener and an already scheduled fallback', () => {
    vi.useFakeTimers();
    const view = new EventTarget();
    vi.stubGlobal('window', view);
    vi.stubGlobal('document', { readyState: 'loading' });
    const task = vi.fn();
    scheduleAfterLoad(task)();
    view.dispatchEvent(new Event('load'));
    vi.runAllTimers();
    expect(task).not.toHaveBeenCalled();
    vi.stubGlobal('document', { readyState: 'complete' });
    scheduleAfterLoad(task)();
    vi.runAllTimers();
    expect(task).not.toHaveBeenCalled();
  });

  it('uses the idle deadline on supported browsers and cancels stale callbacks', () => {
    const requestIdleCallback = vi.fn(() => 7);
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal('window', { requestIdleCallback, cancelIdleCallback, removeEventListener: vi.fn() });
    vi.stubGlobal('document', { readyState: 'complete' });
    const task = vi.fn();
    const cancel = scheduleAfterLoad(task);
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    cancel();
    expect(cancelIdleCallback).toHaveBeenCalledWith(7);
    const callback = requestIdleCallback.mock.calls[0]?.[0];
    if (typeof callback === 'function') callback();
    expect(task).not.toHaveBeenCalled();
  });
});
