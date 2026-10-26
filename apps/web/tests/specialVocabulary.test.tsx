// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { wordnetLicense } from '@t-crossword/core';
import { QuizPage } from '../src/pages/QuizPage.js';
import { SettingsPage } from '../src/pages/SettingsPage.js';

it('switches the PWA quiz to special and shows the full notice in settings', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<QuizPage />));
    const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent === '특급');
    if (!button) throw new Error('Special choice missing');
    await act(async () => button.click());
    expect(container.textContent).toMatch(/학습완료\s*0\s*\/\s*500/);
    expect(container.querySelectorAll('button[aria-label*="정답 입력"]').length).toBeGreaterThan(0);
    await act(async () => root.render(<SettingsPage />));
    expect(container.textContent).toContain('3,839');
    expect(container.textContent).toContain('학술·심화 영어 어휘 500개');
    expect(container.querySelector('details pre')?.textContent).toBe(wordnetLicense);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
