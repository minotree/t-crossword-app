import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { PictureBooks, pictureBooks } from '../src/components/PictureBooks.js';

describe('prepared Toss picture books', () => {
  it.each(['beginner', 'intermediate', 'advanced'] as const)('omits page arrows and keeps list actions for single-page %s works', (level) => {
    const book = pictureBooks.find(item => item.level === level && item.pages.length === 1);
    if (!book) throw new Error(`Missing single-page ${level} fixture`);
    const html = renderToStaticMarkup(<TDSMobileAITProvider brandPrimaryColor="#3182f6">
      <PictureBooks level={level} selectedId={book.id} pageIndex={0} onLevelChange={() => {}} onSelect={() => {}} onPageChange={() => {}} />
    </TDSMobileAITProvider>);
    expect(html).not.toContain('aria-label="이전 페이지"');
    expect(html).not.toContain('aria-label="다음 페이지"');
    expect(html).not.toContain('image-page-navigation');
    expect(html.match(/목록으로/g)).toHaveLength(1);
  });

  it('loads all reviewed works and corrected reading cards', () => {
    expect(pictureBooks.filter(b => b.level === 'beginner')).toHaveLength(45);
    expect(pictureBooks.filter(b => b.level === 'intermediate')).toHaveLength(9);
    expect(pictureBooks.filter(b => b.level === 'advanced')).toHaveLength(7);
    expect(pictureBooks.reduce((n, b) => n + b.pages.length, 0)).toBe(119);
    expect(pictureBooks.find(b => b.id === 'beginner-32')?.pages[0].text).toContain('work with me.');
    expect(pictureBooks.find(b => b.id === 'advanced-courtroom-01')?.pages[9].translation).toContain('펜은');
  });

  it('renders actual final pages with WebP, translation, accessible English and AI notice', () => {
    const html = renderToStaticMarkup(<TDSMobileAITProvider brandPrimaryColor="#3182f6">
      <PictureBooks level="advanced" onLevelChange={() => {}} selectedId="advanced-sf-01"
        pageIndex={9} onSelect={() => {}} onPageChange={() => {}} />
    </TDSMobileAITProvider>);
    expect(html).toContain('advanced-sf-01-10.webp');
    expect(html).toContain('10 / 10장');
    expect(html.match(/목록으로/g)).toHaveLength(1);
    expect(html).toContain('해석 보기');
    expect(html).toContain('lang="en"');
    expect(html).toContain('AI를 활용해 창작');
    expect(html).not.toContain('그림책을 준비하고 있어요');
  });
});
