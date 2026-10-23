// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { PictureBooks, pictureBooks } from '../src/components/PictureBooks.js';

it('warms the top three visible works and updates them when the list scrolls', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.assign(window, { __appsInTossConstants: { safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } } });
  window.matchMedia = vi.fn((media: string) => ({ matches: false, media, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true }));
  const images: HTMLImageElement[] = [];
  vi.stubGlobal('Image', class {
    constructor() {
      const image = document.createElement('img');
      image.decode = vi.fn().mockResolvedValue(undefined);
      images.push(image);
      return image;
    }
  });
  vi.useFakeTimers();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onSelect = vi.fn();
  let firstVisible = 2;
  const geometry = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Array.from(container.querySelectorAll('.book-list > li')).indexOf(this);
    const top = this.tagName === 'LI' ? 100 + (index - firstVisible) * 60 : 100;
    const height = this.tagName === 'LI' ? 60 : 300;
    return { top, bottom: top + height, left: 0, right: 400, width: 400, height, x: 0, y: top, toJSON() {} };
  });
  try {
    await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6">
      <main className="scroll-page"><PictureBooks level="beginner" selectedId={null} pageIndex={0} onSelect={onSelect} onLevelChange={() => {}} onPageChange={() => {}} /></main>
    </TDSMobileAITProvider>));
    expect(images).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(100); });
    const works = pictureBooks.filter(book => book.level === 'beginner');
    expect(images.map(image => image.getAttribute('src'))).toEqual(works.slice(2, 5).map(book => `/${book.pages[0]?.image}`));
    firstVisible = 7;
    await act(async () => {
      container.querySelector('.book-list-scroll')?.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });
    expect(images.filter(image => image.hasAttribute('src')).map(image => image.getAttribute('src')))
      .toEqual(works.slice(7, 10).map(book => `/${book.pages[0]?.image}`));
    const target = container.querySelectorAll('.book-list button')[8];
    await act(async () => { target?.dispatchEvent(new Event('pointerdown', { bubbles: true })); });
    expect(images).toHaveLength(6);
    await act(async () => { target?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(images).toHaveLength(6);
    expect(onSelect).toHaveBeenCalledWith(works[8]?.id);
    await act(async () => root.unmount());
    expect(images.every(image => !image.hasAttribute('src'))).toBe(true);
  } finally {
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    geometry.mockRestore();
  }
});
