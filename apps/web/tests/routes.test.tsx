import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter } from 'react-router-dom';
import { isValidElement } from 'react';
import { appRoutes } from '../src/app/routes.js';

const loaded = vi.hoisted(() => new Set<string>());
vi.mock('../src/pages/QuizPage.js', () => { loaded.add('quiz'); return { QuizPage: () => null }; });
vi.mock('../src/pages/WordBankPage.js', () => { loaded.add('word-bank'); return { WordBankPage: () => null }; });
vi.mock('../src/pages/PictureBooksPage.js', () => { loaded.add('picture-books'); return { PictureBooksPage: () => null }; });
vi.mock('../src/pages/SettingsPage.js', () => { loaded.add('settings'); return { SettingsPage: () => null }; });

const routers: ReturnType<typeof createMemoryRouter>[] = [];
function routerAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  routers.push(router);
  return router;
}
afterEach(() => { routers.splice(0).forEach(router => router.dispose()); });

describe('route code splitting', () => {
  it('loads no feature module for the home page, then resolves only the selected menu', async () => {
    const router = routerAt('/');
    expect(router.state.initialized).toBe(true);
    expect(loaded.size).toBe(0);
    await router.navigate('/picture-books?level=advanced&book=advanced-sf-01&page=10');
    expect([...loaded]).toEqual(['picture-books']);
    expect(router.state.errors).toBeNull();
    expect(router.state.location.search).toContain('page=10');
    await router.navigate('/');
    expect(router.state.location.pathname).toBe('/');
  });

  it.each(['/quiz', '/word-bank', '/picture-books', '/settings'])('resolves a direct entry to %s', async (path) => {
    const router = routerAt(path);
    await vi.waitFor(() => expect(router.state.initialized).toBe(true));
    expect(router.state.errors).toBeNull();
    expect(isValidElement(router.state.matches.at(-1)?.route.element)).toBe(true);
  });

  it('retains an error view when a feature chunk cannot be loaded', async () => {
    const route = appRoutes[0]?.children?.find(route => route.path === 'quiz');
    expect(route?.errorElement).toBeTruthy();
    const router = createMemoryRouter([{ path: '/', errorElement: route?.errorElement,
      lazy: async () => { throw new Error('Offline chunk'); } }]);
    routers.push(router);
    await vi.waitFor(() => expect(router.state.initialized).toBe(true));
    expect(Object.values(router.state.errors ?? {})).toHaveLength(1);
  });
});
