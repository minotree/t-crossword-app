// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { AnswerModal } from '../src/components/AnswerModal.js';

const word = { id: 'sea', word: 'SEA', meaning: '바다', synonym: 'ocean', orientation: 'down' as const,
  startRow: 0, startCol: 0, number: 2, hintLimit: 1, hintUsedCount: 0 };
let container: HTMLDivElement;
let root: Root;
const onSubmit = vi.fn<(...args: Parameters<Parameters<typeof AnswerModal>[0]['onSubmit']>) => boolean>();
const onMistake = vi.fn<(id: string) => void>();

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.assign(window, { __appsInTossConstants: { safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } } });
  window.matchMedia = vi.fn((media: string) => ({ matches: false, media, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true }));
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  onSubmit.mockReset().mockReturnValue(false);
  onMistake.mockReset();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

async function render(currentLetters: string[] = []) {
  await act(async () => {
    root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><AnswerModal word={word} currentLetters={currentLetters} onClose={() => {}} onSubmit={onSubmit} onMistake={onMistake} /></TDSMobileAITProvider>);
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); });
  return Array.from(container.querySelectorAll('input'));
}

async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Input setter missing');
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('records a mistake immediately with an incomplete answer and ignores correct or cleared letters', async () => {
  const inputs = await render();
  await type(inputs[0], 'X');
  expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
  expect(onMistake).toHaveBeenCalledWith(word.id);
  expect(onSubmit).not.toHaveBeenCalled();
  await type(inputs[0], 'S');
  await type(inputs[0], '');
  expect(onMistake).toHaveBeenCalledTimes(1);
});

it('fits the dialog into the keyboard viewport and restores centering when closed', async () => {
  const viewport = Object.assign(new EventTarget(), { height: 400, offsetTop: 30 });
  vi.stubGlobal('visualViewport', viewport);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  try {
    await render();
    const dialog = container.querySelector('dialog');
    expect(dialog?.style.inset).toBe('38px 0 auto');
    expect(dialog?.style.maxHeight).toBe('384px');
    const stableStyle = dialog?.getAttribute('style');
    viewport.offsetTop = 70;
    await act(async () => {
      viewport.dispatchEvent(new Event('scroll'));
      container.querySelectorAll('input')[1]?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dialog?.getAttribute('style')).toBe(stableStyle);
    viewport.height = 300;
    await act(async () => { viewport.dispatchEvent(new Event('resize')); });
    expect(dialog?.style.maxHeight).toBe('284px');
    expect(dialog?.style.inset).toBe('38px 0 auto');
    viewport.height = 800;
    await act(async () => { viewport.dispatchEvent(new Event('resize')); });
    expect(dialog?.getAttribute('style')).toBeNull();
  } finally { vi.unstubAllGlobals(); }
});

describe('Toss letter input', () => {
  it('keeps red feedback on other cells across focus moves and subsequent input', async () => {
    const inputs = await render();
    await type(inputs[0], 'X');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    await act(async () => inputs[1].focus());
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    await type(inputs[1], 'Y');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
    await type(inputs[0], 'S');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('false');
    expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
  });
  it('skips completed crossing cells and submits the correct word only once', async () => {
    onSubmit.mockReturnValue(true);
    const inputs = await render(['', 'E', '']);
    expect(inputs).toHaveLength(3);
    expect(inputs[1].readOnly).toBe(true);
    expect(inputs[1].value).toBe('E');
    await type(inputs[0], 's');
    expect(document.activeElement).toBe(inputs[2]);
    await type(inputs[2], 'a');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(word, 'SEA');
    await act(async () => { container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps red feedback unlimited while leaving submission available', async () => {
    const inputs = await render();
    for (const value of ['X', 'Y', 'Z']) await type(inputs[0], value);
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    await type(inputs[0], 'Q');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    expect(container.textContent).not.toContain('남은 횟수');
    await type(inputs[1], 'Q'); await type(inputs[2], 'Q');
    await act(async () => { container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(onSubmit).toHaveBeenCalledWith(word, 'QQQ');
    expect(container.textContent).toContain('정답이 아닙니다.');
  });

  it('does not mark correct letters, deletion or non-English input as incorrect', async () => {
    const inputs = await render();
    await type(inputs[0], 'S'); await type(inputs[0], ''); await type(inputs[0], '가');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('false');
    expect(container.textContent).toContain('영문으로 입력해 주세요.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('backspaces past crossing cells and resets feedback when reopened', async () => {
    const inputs = await render(['', 'E', '']);
    await type(inputs[0], 'X');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    await act(async () => { inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })); });
    expect(inputs[0].value).toBe(''); expect(inputs[1].value).toBe('E');
    expect(document.activeElement).toBe(inputs[0]);
    await act(async () => root.render(null));
    const reopened = await render(['', 'E', '']);
    expect(reopened[0].getAttribute('aria-invalid')).toBe('false');
  });

  it('reports missing cells and offers no letter-reveal control', async () => {
    await render();
    await act(async () => { container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(container.textContent).toContain('모든 칸에 글자를 입력해 주세요.');
    expect(container.querySelectorAll('.answer-actions button')).toHaveLength(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
