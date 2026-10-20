import { expect, it } from 'vitest';
import { maskWordInExample } from './maskWordInExample.js';
import vocabulary from '../assets/vocab.json';

it.each([
  ['score', 'Our team scored three goals.', 'Our team _____ three goals.'],
  ['study', 'She studies and studied while studying.', 'She _____ and _____ while _____.'],
  ['run', 'He runs, ran and is running.', 'He ___, ___ and is ___.'],
  ['fight', 'They fought.', 'They _____.'],
  ['child', 'The children play.', 'The _____ play.'],
  ['happy', 'She is happier and happiest.', 'She is _____ and _____.'],
  ['big', 'A bigger box.', 'A ___ box.'],
  ['teach', 'The teacher teaches.', 'The teacher _____.'],
  ['alright', 'It is all right.', 'It is _______.'],
  ['vigor/vigour', 'With vigor and vigour.', 'With ____________ and ____________.'],
  ['i', 'I think it is nice.', '_ think it is nice.'],
  ['a', 'A bird flies as high as a tree.', '_ bird flies as high as _ tree.'],
])('masks inflections of %s without exposing their length', (word, example, expected) => {
  expect(maskWordInExample(example, word)).toBe(expected);
});

it('covers every vocabulary example containing an answer or inflected answer', () => {
  // PERIOD uses the synonym "time" rather than an inflection of the answer.
  const absent = vocabulary.filter(({ word, example }) =>
    example && !maskWordInExample(example, word).includes('_'));
  expect(absent.map(({ word }) => word)).toEqual(['PERIOD']);
});

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
