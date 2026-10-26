import { describe, expect, it } from 'vitest';
import { createWordProgressStore, WORD_PROGRESS_KEY } from '../src/adapters/wordProgress.js';
import { defaultVocabList, generateCrossword } from '@t-crossword/core';

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe('device word progress', () => {
  it('persists mistakes once and restores dismissed words on another mistake', () => {
    const storage = memoryStorage();
    const store = createWordProgressStore(() => storage);
    store.recordMistake('word-2');
    store.recordMistake('word-2');
    store.markCompleted('word-2');
    store.toggleBookmark('word-2');
    store.dismissMistake('word-2');
    store.recordMistake('word-2');
    expect(createWordProgressStore(() => storage).getSnapshot()).toEqual({
      completedWordIds: ['word-2'], bookmarkedWordIds: ['word-2'],
      hintUsedWordIds: ['word-2'], dismissedMistakeWordIds: [], error: null,
    });
  });
  it('dismisses mistakes durably without removing history, bookmarks or completion', () => {
    const storage = memoryStorage();
    const store = createWordProgressStore(() => storage);
    store.markHintUsed('word-2');
    store.markHintUsed('word-3');
    store.markCompleted('word-2');
    store.toggleBookmark('word-2');
    store.dismissMistake('word-2');
    store.dismissMistake('word-2');
    const restored = createWordProgressStore(() => storage);
    expect(restored.getSnapshot()).toEqual({
      completedWordIds: ['word-2'], bookmarkedWordIds: ['word-2'],
      hintUsedWordIds: ['word-2', 'word-3'], dismissedMistakeWordIds: ['word-2'], error: null,
    });
    restored.resetCompleted();
    expect(createWordProgressStore(() => storage).getSnapshot().dismissedMistakeWordIds).toEqual(['word-2']);
    restored.markHintUsed('word-2');
    expect(createWordProgressStore(() => storage).getSnapshot().dismissedMistakeWordIds).toEqual([]);
  });

  it('rejects invalid dismissed mistake records', () => {
    const storage = memoryStorage();
    storage.setItem(WORD_PROGRESS_KEY, JSON.stringify({
      completedWordIds: [], bookmarkedWordIds: [], dismissedMistakeWordIds: [42],
    }));
    expect(createWordProgressStore(() => storage).getSnapshot().error).not.toBeNull();
  });

  it('persists hint history without duplicates and keeps it after resetting completed words', () => {
    const storage = memoryStorage();
    const store = createWordProgressStore(() => storage);
    store.markHintUsed('word-2');
    store.markHintUsed('word-2');
    store.markCompleted('word-2');
    store.resetCompleted();
    expect(createWordProgressStore(() => storage).getSnapshot().hintUsedWordIds).toEqual(['word-2']);
  });

  it('loads legacy progress with an empty hint history', () => {
    const storage = memoryStorage();
    storage.setItem(WORD_PROGRESS_KEY, JSON.stringify({ completedWordIds: ['word-2'], bookmarkedWordIds: ['word-3'] }));
    expect(createWordProgressStore(() => storage).getSnapshot()).toEqual({
      completedWordIds: ['word-2'], bookmarkedWordIds: ['word-3'], hintUsedWordIds: [], dismissedMistakeWordIds: [], error: null,
    });
  });

  it('rejects invalid hint history', () => {
    const storage = memoryStorage();
    storage.setItem(WORD_PROGRESS_KEY, JSON.stringify({ completedWordIds: [], bookmarkedWordIds: [], hintUsedWordIds: [42] }));
    expect(createWordProgressStore(() => storage).getSnapshot().error).not.toBeNull();
  });
  it('resets completed records durably while keeping bookmarks', () => {
    const storage = memoryStorage();
    const store = createWordProgressStore(() => storage);
    store.markCompleted('word-2');
    store.toggleBookmark('word-2');
    expect(store.resetCompleted()).toBe(true);
    expect(createWordProgressStore(() => storage).getSnapshot()).toEqual({
      completedWordIds: [], bookmarkedWordIds: ['word-2'], hintUsedWordIds: [], dismissedMistakeWordIds: [], error: null,
    });
  });

  it('retains completed records when reset cannot be saved', () => {
    let blocked = false;
    const memory = memoryStorage();
    const store = createWordProgressStore(() => ({
      getItem: memory.getItem,
      setItem: (key, value) => { if (blocked) throw new Error('Blocked'); memory.setItem(key, value); },
    }));
    store.markCompleted('word-2');
    blocked = true;
    expect(store.resetCompleted()).toBe(false);
    expect(store.getSnapshot().completedWordIds).toEqual(['word-2']);
    expect(store.getSnapshot().error).not.toBeNull();
  });
  it('excludes learned words after restoring device storage', () => {
    const storage = memoryStorage();
    const original = generateCrossword(defaultVocabList, 'beginner', 8);
    const solved = original.words[0];
    expect(solved).toBeDefined();
    createWordProgressStore(() => storage).markCompleted(solved.id);
    const restored = createWordProgressStore(() => storage);
    const completed = new Set(restored.getSnapshot().completedWordIds);
    const next = generateCrossword(defaultVocabList.map((word) => ({
      ...word, isQuizUsed: completed.has(word.id) ? true : word.isQuizUsed,
    })), 'advanced', 10);
    expect(next.words.some((word) => word.id === solved.id)).toBe(false);
    expect(defaultVocabList.find((word) => word.id === solved.id)?.isQuizUsed).toBe(false);
  });
  it('restores completed words and bookmarks in a new session', () => {
    const storage = memoryStorage();
    const first = createWordProgressStore(() => storage);
    first.markCompleted('word-2');
    first.markCompleted('word-2');
    first.toggleBookmark('word-3');
    const restored = createWordProgressStore(() => storage);
    expect(restored.getSnapshot()).toEqual({ completedWordIds: ['word-2'], bookmarkedWordIds: ['word-3'], hintUsedWordIds: [], dismissedMistakeWordIds: [], error: null });
    restored.toggleBookmark('word-3');
    expect(createWordProgressStore(() => storage).getSnapshot().bookmarkedWordIds).toEqual([]);
    expect(restored.getSnapshot().completedWordIds).toEqual(['word-2']);
  });

  it('reports invalid stored data without interpreting it as learned words', () => {
    const storage = memoryStorage();
    storage.setItem(WORD_PROGRESS_KEY, JSON.stringify({ completedWordIds: [42], bookmarkedWordIds: [] }));
    const store = createWordProgressStore(() => storage);
    expect(store.getSnapshot().completedWordIds).toEqual([]);
    expect(store.getSnapshot().error).not.toBeNull();
  });

  it('keeps current progress and exposes a warning when writing fails', () => {
    const store = createWordProgressStore(() => ({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } }));
    store.markCompleted('word-2');
    expect(store.getSnapshot().completedWordIds).toEqual(['word-2']);
    expect(store.getSnapshot().error).not.toBeNull();
  });

  it('notifies subscribers and reloads progress written by another session', () => {
    const storage = memoryStorage();
    const first = createWordProgressStore(() => storage);
    const second = createWordProgressStore(() => storage);
    let notifications = 0;
    const unsubscribe = first.subscribe(() => { notifications++; });
    second.markCompleted('word-4');
    first.reload();
    expect(first.getSnapshot().completedWordIds).toEqual(['word-4']);
    expect(notifications).toBe(1);
    unsubscribe();
    first.markCompleted('word-5');
    expect(notifications).toBe(1);
  });
});
