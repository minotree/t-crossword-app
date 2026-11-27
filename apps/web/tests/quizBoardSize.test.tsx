// @vitest-environment jsdom
import { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { calculateQuizBoardSize, useQuizBoardSize } from '../src/hooks/useQuizBoardSize.js';

// Explicit height-budget fixtures, not browser measurements: 112px encouragement,
// 44px clue button, 16px gaps, and the current control/menu estimates.
const fixtures = [
  { viewport: '390x859', width: 366, height: 439, portrait: true, expected: [366, 366, 366] },
  { viewport: '360x640', width: 336, height: 220, portrait: true, expected: [336, 336, 336] },
  { viewport: '844x390', width: 812, height: -43, portrait: false, expected: [292, 322, 360] },
  { viewport: '768x1024', width: 736, height: 591, portrait: false, expected: [591, 591, 591] },
  { viewport: '1024x768', width: 992, height: 335, portrait: false, expected: [335, 335, 360] },
  { viewport: '1032x1376', width: 1000, height: 943, portrait: false, expected: [600, 600, 600] },
  { viewport: '1376x1032', width: 1344, height: 599, portrait: false, expected: [599, 599, 599] },
  { viewport: '1280x720', width: 1248, height: 287, portrait: false, expected: [292, 322, 360] },
  { viewport: '1366x768', width: 1334, height: 335, portrait: false, expected: [335, 335, 360] },
  { viewport: '1920x1080', width: 1888, height: 647, portrait: false, expected: [600, 600, 600] },
];
it.each(fixtures)('sizes all three grids at $viewport from the explicit height budget', ({ width, height, portrait, expected }) => {
  expect(([8, 10, 12] as const).map(size => calculateQuizBoardSize(width, height, size, portrait))).toEqual(expected);
});
it('prioritizes narrow width, handles no height, caps large boards and ignores unmeasurable layouts', () => {
  expect(calculateQuizBoardSize(280, 100, 12, false)).toBe(280);
  expect(calculateQuizBoardSize(800, 0, 10, false)).toBe(322);
  expect(calculateQuizBoardSize(900, 1000, 12, false)).toBe(600);
  expect(calculateQuizBoardSize(900, 1000, 12, false, 800)).toBe(800);
  expect(calculateQuizBoardSize(780, 1000, 10, false, 800)).toBe(780);
  expect(calculateQuizBoardSize(780, 460, 10, false, 800)).toBe(460);
  expect(calculateQuizBoardSize(280, 100, 12, false, 800)).toBe(280);
  expect(calculateQuizBoardSize(0, 100, 10, false)).toBeUndefined();
  expect(calculateQuizBoardSize(800, NaN, 10, false)).toBeUndefined();
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function measurementFixture(twoColumns = false) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal('innerWidth', 1280); vi.stubGlobal('innerHeight', 720);
  const frames = new Map<number, FrameRequestCallback>(); let frameId = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const observers: { callback: () => void; targets: Set<Element>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal('ResizeObserver', class {
    entry;
    constructor(callback: () => void) { this.entry = { callback, targets: new Set<Element>(), disconnect: vi.fn() }; observers.push(this.entry); }
    observe(element: Element) { this.entry.targets.add(element); }
    unobserve(element: Element) { this.entry.targets.delete(element); }
    disconnect() { this.entry.disconnect(); }
  });
  let mainHeight = 500, quoteHeight = 100, before = 20;
  const rect = (top: number, height: number) => ({ top, height, left: 0, right: 1280, bottom: top + height, width: 1280, x: 0, y: top, toJSON: () => ({}) });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.dataset.measure === 'stack') return rect(before - (this.parentElement?.scrollTop ?? 0), 500);
    if (this.dataset.measure === 'button') return rect(0, 44);
    if (this.dataset.measure === 'quote') return rect(0, quoteHeight);
    return rect(0, mainHeight);
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.dataset.measure === 'stack' ? 1248 : 1280; });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => mainHeight);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  function Harness({ paused }: { paused: boolean }) {
    const mainRef = useRef<HTMLElement>(null), stackRef = useRef<HTMLDivElement>(null);
    const hintsButtonRef = useRef<HTMLButtonElement>(null), encouragementRef = useRef<HTMLDivElement>(null);
    const size = useQuizBoardSize({ mainRef, stackRef, hintsButtonRef, encouragementRef, gridSize: 8, puzzleVersion: 1, hasPuzzle: true, paused });
    return <main ref={mainRef} data-measure="main" style={{ padding: '0 16px 10px' }}>
      <div ref={stackRef} data-measure="stack" style={{ rowGap: '8px', ...(twoColumns ? { display: 'grid', gridTemplateColumns: '580px 380px' } : {}) }}>
        <div data-board />
        <button ref={hintsButtonRef} data-measure="button">hints</button>
        <div data-slot><div ref={encouragementRef} data-measure="quote">quote</div></div>
        <output>{size}</output>
      </div>
    </main>;
  }
  const render = async (paused = false) => { await act(async () => root.render(<Harness paused={paused} />)); };
  const flush = async () => {
    await act(async () => {
      const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0));
    });
  };
  await render(); await flush();
  return { host, frames, observers, render, flush,
    size: () => Number(host.querySelector('output')?.textContent),
    quote: (height: number) => { quoteHeight = height; },
    notice: (height: number) => { before = height; },
    height: (height: number) => { mainHeight = height; },
    destroy: async () => { await act(async () => root.unmount()); host.remove(); },
  };
}

it('uses the left grid track and full body height in two columns, independently of translation/error height', async () => {
  const fixture = await measurementFixture(true);
  try {
    expect(fixture.size()).toBe(470);
    fixture.quote(700);
    fixture.observers[0].callback(); await fixture.flush();
    expect(fixture.size()).toBe(470);
    fixture.height(900);
    fixture.observers[0].callback(); await fixture.flush();
    expect(fixture.size()).toBe(580);
    const stack = fixture.host.querySelector<HTMLElement>('[data-measure="stack"]');
    if (stack) stack.style.gridTemplateColumns = '280px 380px';
    fixture.observers[0].callback(); await fixture.flush();
    expect(fixture.size()).toBe(280);
    if (stack) { stack.style.display = ''; stack.style.gridTemplateColumns = ''; }
    fixture.quote(100); fixture.height(500);
    window.dispatchEvent(new Event('resize')); await fixture.flush();
    expect(fixture.size()).toBe(310);
  } finally { await fixture.destroy(); }
});

it('measures intrinsic text height, handles translation/long text/audio errors, coalesces callbacks and ignores scroll position', async () => {
  const fixture = await measurementFixture();
  try {
    expect(fixture.size()).toBe(310);
    const observer = fixture.observers[0];
    expect([...observer.targets].some(element => element.hasAttribute('data-slot') || element.hasAttribute('data-board') || element.getAttribute('data-measure') === 'stack')).toBe(false);
    fixture.quote(180);
    for (let i = 0; i < 20; i++) observer.callback();
    expect(fixture.frames.size).toBe(1);
    await fixture.flush(); expect(fixture.size()).toBe(292);
    fixture.quote(100); observer.callback(); await fixture.flush(); expect(fixture.size()).toBe(310);
    const main = fixture.host.querySelector('main'); if (main) main.scrollTop = 250;
    observer.callback(); await fixture.flush(); expect(fixture.size()).toBe(310);
    observer.callback(); await fixture.flush(); expect(fixture.size()).toBe(310);
    expect(fixture.frames.size).toBe(0);
  } finally { await fixture.destroy(); }
  expect(fixture.observers[0].disconnect).toHaveBeenCalledOnce();
});

it('remeasures recommendation mount/removal even when the scroll container height is unchanged', async () => {
  const fixture = await measurementFixture();
  try {
    const main = fixture.host.querySelector('main');
    const notice = document.createElement('aside');
    fixture.notice(100);
    await act(async () => { main?.prepend(notice); });
    await fixture.flush(); expect(fixture.size()).toBe(292);
    expect(fixture.observers[0].targets.has(notice)).toBe(true);
    fixture.notice(20);
    await act(async () => notice.remove());
    await fixture.flush(); expect(fixture.size()).toBe(310);
  } finally { await fixture.destroy(); }
});

it('holds size while the answer/keyboard is open, waits for keyboard dismissal and cleans pending observers/frames', async () => {
  const fixture = await measurementFixture();
  try {
    expect(fixture.size()).toBe(310);
    await fixture.render(true);
    fixture.height(180); vi.stubGlobal('innerHeight', 400);
    window.dispatchEvent(new Event('resize')); await fixture.flush(); expect(fixture.size()).toBe(310);
    await fixture.render(false); await fixture.flush(); expect(fixture.size()).toBe(310);
    fixture.height(600); vi.stubGlobal('innerHeight', 720);
    window.dispatchEvent(new Event('resize')); await fixture.flush(); expect(fixture.size()).toBe(410);
    fixture.observers.at(-1)?.callback();
    expect(fixture.frames.size).toBe(1);
  } finally { await fixture.destroy(); }
  expect(fixture.frames.size).toBe(0);
  expect(fixture.observers.every(observer => observer.disconnect.mock.calls.length === 1)).toBe(true);
});
