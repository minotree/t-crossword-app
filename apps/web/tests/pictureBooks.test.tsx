import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PictureBooksPage } from '../src/pages/PictureBooksPage.js';

function render(query: string) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[`/picture-books${query}`]}>
    <PictureBooksPage />
  </MemoryRouter>);
}

describe('advanced picture books', () => {
  it('lists seven adult works and all three novel genres while retaining other levels', () => {
    const html = render('?level=advanced');
    expect((html.match(/book=advanced-/g) ?? []).length).toBe(7);
    for (const genre of ['SF', '현실 미스터리', '법정 드라마']) expect(html).toContain(genre);
    expect(html).not.toContain('준비 중');
    expect((render('').match(/book=beginner-/g) ?? []).length).toBe(45);
    expect((render('?level=intermediate').match(/book=intermediate-/g) ?? []).length).toBe(9);
  });

  it.each(['sf', 'mystery', 'courtroom'])('opens the first and last %s pages with translations', (genre) => {
    const query = `?level=advanced&book=advanced-${genre}-01`;
    const first = render(query);
    expect(first).toContain(`advanced-${genre}-01-01.webp`);
    expect(first).toContain('disabled=""');
    expect(first).toContain('해석 보기');
    expect(first).toContain('lang="ko"');
    expect(first).toContain('lang="en" class="sr-only"');
    const last = render(`${query}&page=10`);
    expect(last).toContain(`advanced-${genre}-01-10.webp`);
    expect(last).not.toContain('다음 →');
    expect(last).toContain('href="/picture-books?level=advanced"');
  });

  it.each(['0', '-1', '11', 'NaN', '1.5'])('recovers from invalid page %s', (page) => {
    expect(render(`?level=advanced&book=advanced-courtroom-01&page=${page}`)).toContain('advanced-courtroom-01-01.webp');
  });

  it('opens essay page three and prevents a book from leaking across difficulty levels', () => {
    expect(render('?level=advanced&book=advanced-essay-01&page=3')).toContain('advanced-essay-01-03.webp');
    const html = render('?level=beginner&book=advanced-courtroom-01');
    expect(html).toContain('선택한 그림책을 찾을 수 없습니다');
    expect(html).not.toContain('advanced-courtroom-01-01.webp');
  });
});
