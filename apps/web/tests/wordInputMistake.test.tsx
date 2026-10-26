// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { WordInputModal } from '../src/components/WordInputModal.js';
import { createWordProgressStore } from '../src/adapters/wordProgress.js';

it('saves an incorrect letter immediately before the answer is complete or submitted', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); } };
  const store = createWordProgressStore(() => storage);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onSubmit = vi.fn(() => false);
  try {
    await act(async () => root.render(<WordInputModal isOpen word={{
      id: 'from', word: 'FROM', meaning: '~부터', orientation: 'down',
      startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0,
    }} currentLetters={['F', 'R', '', '']} onClose={() => {}}
      onSubmit={onSubmit} onMistake={store.recordMistake} />));
    const input = container.querySelectorAll('input')[2];
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) throw new Error('Input setter missing');
      setter.call(input, 'A');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(createWordProgressStore(() => storage).getSnapshot().hintUsedWordIds).toEqual(['from']);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
