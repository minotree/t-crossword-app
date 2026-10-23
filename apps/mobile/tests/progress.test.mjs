import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { hideHintedWord, isNotebookWord, readProgress, recordHintedWord, writeProgress } from '../src/adapters/progress.ts';

let values;
beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } });
});
test('starts empty without changing unrelated app storage', () => {
  values.set('web-learning', 'preserve');
  assert.deepEqual(readProgress(), { completed: [], bookmarks: [] });
  assert.equal(values.get('web-learning'), 'preserve');
});
test('restores and deduplicates completed words and bookmarks', () => {
  writeProgress({ completed: ['one', 'one'], bookmarks: ['two', 'two'] });
  assert.deepEqual(readProgress(), { completed: ['one'], bookmarks: ['two'] });
});
test('rejects malformed storage without overwriting existing records', () => {
  values.set('mobile-learning-v1', '{broken');
  assert.throws(readProgress);
  assert.equal(values.get('mobile-learning-v1'), '{broken');
});
test('rejects unexpected field types', () => {
  for (const value of [{ completed: [5], bookmarks: [] }, { completed: [], bookmarks: null }, []]) {
    values.set('mobile-learning-v1', JSON.stringify(value));
    assert.throws(readProgress);
  }
});
test('propagates unavailable and full storage instead of reporting success', () => {
  localStorage.getItem = () => { throw new Error('unavailable'); };
  assert.throws(readProgress, /unavailable/);
  localStorage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => writeProgress({ completed: ['one'], bookmarks: [] }), /quota/);
});

test('hiding preserves history and other records, persists, and hint reuse restores only that word', () => {
  const original = { completed: ['one'], bookmarks: ['one'], hintedWords: ['one', 'two'] };
  const hidden = hideHintedWord(hideHintedWord(original, 'one'), 'two');
  writeProgress(hidden);
  assert.equal(isNotebookWord(readProgress(), 'one'), false);
  assert.deepEqual(readProgress().hintedWords, ['one', 'two']);
  assert.deepEqual(readProgress().completed, ['one']);
  assert.deepEqual(readProgress().bookmarks, ['one']);
  assert.equal(isNotebookWord(original, 'one'), true);
  const restored = recordHintedWord(readProgress(), 'one');
  writeProgress(recordHintedWord(restored, 'one'));
  assert.equal(isNotebookWord(readProgress(), 'one'), true);
  assert.equal(isNotebookWord(readProgress(), 'two'), false);
  assert.deepEqual(readProgress().hintedWords, ['one', 'two']);
});

test('legacy hint history remains visible and malformed hidden records are preserved and rejected', () => {
  writeProgress({ completed: [], bookmarks: [], hintedWords: ['one'] });
  assert.equal(isNotebookWord(readProgress(), 'one'), true);
  assert.equal(isNotebookWord(readProgress(), 'other'), false);
  for (const hiddenHintedWords of [null, 'one', [1]]) {
    const raw = JSON.stringify({ completed: [], bookmarks: [], hiddenHintedWords });
    values.set('mobile-learning-v1', raw);
    assert.throws(readProgress);
    assert.equal(values.get('mobile-learning-v1'), raw);
  }
});

test('failed hide persistence retains the previous visible notebook', () => {
  writeProgress({ completed: [], bookmarks: [], hintedWords: ['one'] });
  const original = readProgress();
  localStorage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => writeProgress(hideHintedWord(original, 'one')), /quota/);
  assert.equal(isNotebookWord(readProgress(), 'one'), true);
});
