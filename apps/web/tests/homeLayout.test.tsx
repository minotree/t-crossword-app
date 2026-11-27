// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { transferableAbortController } from 'node:util';
import { AppLayout } from '../src/app/AppLayout.js';
import { HomePage } from '../src/pages/HomePage.js';
import { wordProgressStore } from '../src/adapters/wordProgress.js';

it('keeps home links and every menu route, and updates the learned count from the existing store', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  // Node Request requires a Node AbortSignal rather than jsdom's signal.
  vi.stubGlobal('AbortController', function () { return transferableAbortController(); });
  const paths = ['/quiz', '/word-bank', '/picture-books', '/settings'];
  const router = createMemoryRouter([{ path: '/', element: <AppLayout />, children: [
    { index: true, element: <HomePage /> },
    ...paths.map(path => ({ path, element: <p>{path}</p> })),
  ] }]);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const before = localStorage.getItem('t-crossword.word-progress.v1');
  try {
    await act(async () => root.render(<RouterProvider router={router} />));
    expect(container.querySelector('h1')?.textContent).toContain('오신 것을 환영합니다');
    expect(container.querySelector('a[href="/quiz"]')?.textContent).toContain('퀴즈 시작');
    expect(container.querySelector('a[href="/word-bank"]')?.textContent).toContain('단어장 보기');
    const initialCount = wordProgressStore.getSnapshot().completedWordIds.length;
    await act(async () => wordProgressStore.markCompleted('home-layout-test'));
    expect(container.querySelector('header span')?.textContent).toBe(`${initialCount + 1}개 학습`);
    for (const path of paths) {
      const link = container.querySelector<HTMLAnchorElement>(`nav a[href="${path}"]`);
      expect(link).not.toBeNull();
      await act(async () => link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
      expect(router.state.location.pathname).toBe(path);
      expect(container.querySelector('.mnu-web-home-shell')).toBeNull();
      await act(async () => router.navigate('/'));
    }
    expect(container.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe('/');
    expect(container.querySelector('[data-page-scroll]')?.className).toContain('overflow-y-auto');
  } finally {
    await act(async () => root.unmount());
    router.dispose();
    container.remove();
    if (before === null) localStorage.removeItem('t-crossword.word-progress.v1');
    else localStorage.setItem('t-crossword.word-progress.v1', before);
    wordProgressStore.reload();
    vi.unstubAllGlobals();
  }
});
