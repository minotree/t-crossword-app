// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { AnswerModal } from '../src/components/AnswerModal.js';
import { AnswerLayoutPreview } from '../src/dev/AnswerLayoutPreview.js';

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
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); });

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

it('keeps long explanations in a scroll region separate from the heading, inputs and action buttons', async () => {
  const longWord = { ...word, meaning: '덩어리; 질량; 다량; 대중; 대량의; 모이다; 모으다; 미사',
    synonym: 'bulk (큰 양); assemble (모이다); gather (모으다)',
    example: 'The scientist measured the sea and described the results in a long report. '.repeat(8) };
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><AnswerModal word={longWord}
    onClose={() => {}} onSubmit={onSubmit} /></TDSMobileAITProvider>));
  const region = container.querySelector('[aria-label="문제 설명"]');
  expect(region?.getAttribute('tabindex')).toBe('0');
  expect(region?.textContent).toContain(longWord.meaning);
  expect(region?.textContent).toContain(longWord.synonym);
  expect(region?.querySelector('input, button, form')).toBeNull();
  expect(container.querySelector('.modal-heading')?.parentElement).toBe(region?.parentElement);
  expect(container.querySelector('form')?.parentElement).toBe(region?.parentElement);
  expect(Array.from(container.querySelectorAll('.answer-actions button'), button => button.textContent)).toEqual(['힌트 1회', '정답입력']);
});

it('opens the development long-answer scenario immediately and can reopen it with fresh hints', async () => {
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><AnswerLayoutPreview /></TDSMobileAITProvider>));
  expect(container.querySelector('dialog')?.open).toBe(true);
  expect(container.querySelector('.answer-clue .example')?.textContent?.length).toBeGreaterThan(150);
  const hint = container.querySelector<HTMLButtonElement>('.answer-actions button');
  await act(async () => hint?.click());
  expect(hint?.textContent).toBe('힌트 1회');
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="창 닫기"]')?.click());
  expect(container.querySelector('dialog')).toBeNull();
  const reopen = Array.from(container.querySelectorAll('button')).find(button => button.textContent === '다시 열기');
  await act(async () => reopen?.click());
  expect(container.querySelector('.answer-actions button')?.textContent).toBe('힌트 2회');
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

  it('reports missing cells and places the hint before submission', async () => {
    await render();
    await act(async () => { container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(container.textContent).toContain('모든 칸에 글자를 입력해 주세요.');
    expect(Array.from(container.querySelectorAll('.answer-actions button'), button => button.textContent)).toEqual(['힌트 1회', '정답입력']);
    expect(container.textContent).not.toContain('앞에서부터 정답이 아닌 한 칸을 공개합니다');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

async function hint() {
  const button = container.querySelector<HTMLButtonElement>('.answer-actions button');
  if (!button) throw new Error('Hint missing');
  await act(async () => button.click());
  return button;
}

it('keeps the revealed letter after two seconds and clears only its feedback', async () => {
  const inputs = await render();
  vi.useFakeTimers();
  await type(inputs[0], 'X'); await type(inputs[1], 'Y');
  const button = await hint();
  expect(inputs[0].value).toBe('S');
  expect(inputs[0].getAttribute('aria-invalid')).toBe('false');
  expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
  expect(inputs[0].readOnly).toBe(true);
  expect(button.disabled).toBe(true);
  expect(document.activeElement).toBe(inputs[1]);
  await act(async () => vi.advanceTimersByTime(3000));
  expect(inputs[0].value).toBe('S');
  await type(inputs[0], 'X');
  expect(inputs[0].value).toBe('S');
  await type(inputs[1], '');
  await act(async () => inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })));
  expect(inputs[0].value).toBe('S');
});

it('skips correct letters and completes only once when a hint fills the final incorrect cell', async () => {
  onSubmit.mockReturnValue(true);
  const inputs = await render();
  await type(inputs[0], 'S'); await type(inputs[2], 'A');
  await hint();
  expect(inputs[1].value).toBe('E');
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith(word, 'SEA');
  await hint();
  expect(onSubmit).toHaveBeenCalledTimes(1);
});
it('starts with no hints when only one blank remains', async () => {
  const inputs = await render(['S', 'E', '']);
  expect(container.textContent).toContain('힌트 0회');
  expect((await hint()).disabled).toBe(true);
  expect(inputs[2].value).toBe('');
});

it('recalculates twelve blanks to six hints and eight blanks to four only on a new modal', async () => {
  const longWord = { ...word, word: 'ABCDEFGHIJKL' };
  const show = async (currentLetters: string[]) => act(async () => root.render(
    <TDSMobileAITProvider brandPrimaryColor="#3182f6"><AnswerModal word={longWord} currentLetters={currentLetters} onClose={() => {}} onSubmit={onSubmit} /></TDSMobileAITProvider>,
  ));
  await show([]);
  expect(container.textContent).toContain('힌트 6회');
  await type(container.querySelectorAll('input')[0], 'A');
  expect(container.textContent).toContain('힌트 6회');
  await hint();
  expect(container.querySelectorAll('input')[1].value).toBe('B');
  expect(container.textContent).toContain('힌트 5회');
  await act(async () => root.render(null));
  await show(['A', 'B', 'C', 'D']);
  expect(container.textContent).toContain('힌트 4회');
});
