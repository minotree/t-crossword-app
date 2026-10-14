import { expect, it } from 'vitest';
import { maskWordInExample } from './maskWordInExample.js';

it('masks every occurrence regardless of case', () => {
  expect(maskWordInExample('Rich people can be rich.', 'RICH')).toBe('____ people can be ____.');
});
it('keeps punctuation and possessives without matching other words', () => {
  expect(maskWordInExample("The cat's toy is beside a catalog. Cat!", 'cat'))
    .toBe("The ___'s toy is beside a catalog. ___!");
});
it('handles absent answers and empty examples', () => {
  expect(maskWordInExample('She is wealthy.', 'rich')).toBe('She is wealthy.');
  expect(maskWordInExample('', 'rich')).toBe('');
  expect(maskWordInExample('Hello.', '')).toBe('Hello.');
});
