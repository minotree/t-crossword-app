// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { followAnswerViewport } from '../src/adapters/answerViewport.js';

it('follows the visible keyboard area and removes viewport listeners on cleanup', () => {
  const viewport = Object.assign(new EventTarget(), { height: 380, offsetTop: 20 });
  vi.stubGlobal('visualViewport', viewport);
  try {
    const overlay = document.createElement('div');
    const dispose = followAnswerViewport(overlay);
    expect(overlay.style.height).toBe('380px');
    expect(overlay.style.top).toBe('20px');
    viewport.height = 280; viewport.offsetTop = 30;
    viewport.dispatchEvent(new Event('resize'));
    expect(overlay.style.height).toBe('280px');
    expect(overlay.style.top).toBe('30px');
    dispose(); viewport.height = 500; viewport.dispatchEvent(new Event('resize'));
    expect(overlay.style.height).toBe('280px');
  } finally { vi.unstubAllGlobals(); }
});
