import { expect, it } from 'vitest';
import { primaryMeaning } from '../src/components/primaryMeaning.js';

it('shows the first meaning before a comma or semicolon', () => {
  expect(primaryMeaning('항상, 언제나')).toBe('항상');
  expect(primaryMeaning('모든; 모두')).toBe('모든');
});
it('preserves punctuation inside nested or full-width parentheses', () => {
  expect(primaryMeaning('말하다 (사람, 동물; 기타), 이야기하다')).toBe('말하다 (사람, 동물; 기타)');
  expect(primaryMeaning('뜻（설명, 보충）; 다른 뜻')).toBe('뜻（설명, 보충）');
  expect(primaryMeaning('뜻 (설명 (하나, 둘); 보충), 다른 뜻')).toBe('뜻 (설명 (하나, 둘); 보충)');
});
it('handles single meanings and empty prefixes', () => {
  expect(primaryMeaning(' 눈 ')).toBe('눈');
  expect(primaryMeaning('')).toBe('');
  expect(primaryMeaning(', 뜻')).toBe(', 뜻');
});
