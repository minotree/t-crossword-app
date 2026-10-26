import { describe, expect, it, vi } from 'vitest';
import { createProgressRepository, parseProgress, PROGRESS_KEY, dismissMistake, isMistakeVisible, recordHintUsed, recordMistake, type ProgressStorage } from '../src/adapters/progress.js';

const emptyNotebook = { hintUsedWordIds: [], dismissedMistakeWordIds: [] };

describe('Toss progress storage', () => {
  it('deduplicates mistakes and restores dismissed entries while keeping other progress', () => {
    const original = { completedWordIds: ['sea'], bookmarkedWordIds: ['sea'], ...emptyNotebook };
    const recorded = recordMistake(recordMistake(original, 'sea'), 'sea');
    expect(recorded.hintUsedWordIds).toEqual(['sea']);
    expect(isMistakeVisible(recorded, 'sea')).toBe(true);
    const hidden = dismissMistake(recorded, 'sea');
    expect(isMistakeVisible(hidden, 'sea')).toBe(false);
    const restored = parseProgress(JSON.stringify(recordMistake(hidden, 'sea')));
    expect(restored).toEqual({ ...original, hintUsedWordIds: ['sea'] });
  });
  it('restores a dismissed entry only after successful hint usage without altering other progress', () => {
    const original = parseProgress(JSON.stringify({ completedWordIds: ['sea'], bookmarkedWordIds: ['sea'], hintUsedWordIds: ['sea'], dismissedMistakeWordIds: ['sea'] }));
    const updated = recordHintUsed(original, 'sea');
    expect(isMistakeVisible(updated, 'sea')).toBe(true);
    expect(updated.hintUsedWordIds).toEqual(['sea']);
    expect(updated.completedWordIds).toEqual(['sea']);
    expect(updated.bookmarkedWordIds).toEqual(['sea']);
    expect(original.dismissedMistakeWordIds).toEqual(['sea']);
  });
  it('loads older progress with an empty notebook while keeping existing records', () => {
    expect(parseProgress(JSON.stringify({ completedWordIds: ['sea'], bookmarkedWordIds: ['sea'] }))).toEqual({
      completedWordIds: ['sea'], bookmarkedWordIds: ['sea'], hintUsedWordIds: [], dismissedMistakeWordIds: [],
    });
  });

  it('hides notebook entries durably without deleting hints, bookmarks or completion', async () => {
    let raw: string | null = null;
    const storage: ProgressStorage = { getItem: async () => raw, setItem: async (_key, value) => { raw = value; } };
    const original = parseProgress(JSON.stringify({
      completedWordIds: ['sea'], bookmarkedWordIds: ['sea'], hintUsedWordIds: ['sea', 'book', 'sea'],
    }));
    const next = dismissMistake(dismissMistake(original, 'sea'), 'sea');
    await createProgressRepository(storage).save(next);
    const restored = await createProgressRepository(storage).load();
    expect(isMistakeVisible(restored, 'sea')).toBe(false);
    expect(isMistakeVisible(restored, 'book')).toBe(true);
    expect(isMistakeVisible(restored, 'unknown')).toBe(false);
    expect(restored).toEqual({ completedWordIds: ['sea'], bookmarkedWordIds: ['sea'],
      hintUsedWordIds: ['sea', 'book'], dismissedMistakeWordIds: ['sea'] });
    expect(original.dismissedMistakeWordIds).toEqual([]);
  });

  it.each([{ hintUsedWordIds: [42] }, { dismissedMistakeWordIds: 'sea' }])('rejects malformed notebook fields: %j', (extra) => {
    expect(() => parseProgress(JSON.stringify({ completedWordIds: [], bookmarkedWordIds: [], ...extra }))).toThrow();
  });

  it('loads empty storage and restores unique progress without sharing the web storage key', async () => {
    let raw: string | null = null;
    const storage: ProgressStorage = {
      async getItem(key) { expect(key).toBe(PROGRESS_KEY); return raw; },
      async setItem(key, value) { expect(key).toBe(PROGRESS_KEY); raw = value; },
    };
    const first = createProgressRepository(storage);
    expect(await first.load()).toEqual({ ...emptyNotebook, completedWordIds: [], bookmarkedWordIds: [] });
    await first.save({ ...emptyNotebook, completedWordIds: ['word-1', 'word-1'], bookmarkedWordIds: ['word-2'] });
    expect(await createProgressRepository(storage).load()).toEqual({ ...emptyNotebook, completedWordIds: ['word-1'], bookmarkedWordIds: ['word-2'] });
    expect(PROGRESS_KEY).not.toBe('t-crossword.word-progress.v1');
  });

  it.each(['null', '{}', '{', '{"completedWordIds":[42],"bookmarkedWordIds":[]}', '{"completedWordIds":[],"bookmarkedWordIds":false}'])('rejects malformed records without overwriting them: %s', async (raw) => {
    const setItem = vi.fn();
    const repository = createProgressRepository({ getItem: async () => raw, setItem });
    await expect(repository.load()).rejects.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('serializes rapid writes so an older record cannot replace a newer one', async () => {
    const calls: string[] = [];
    let releaseFirst = () => {};
    const firstPending = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const storage: ProgressStorage = {
      getItem: async () => null,
      async setItem(_key, value) {
        calls.push(value);
        if (calls.length === 1) await firstPending;
      },
    };
    const repository = createProgressRepository(storage);
    const first = repository.save({ ...emptyNotebook, completedWordIds: ['word-1'], bookmarkedWordIds: [] });
    const second = repository.save({ ...emptyNotebook, completedWordIds: ['word-1', 'word-2'], bookmarkedWordIds: [] });
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    releaseFirst();
    await Promise.all([first, second]);
    expect(parseProgress(calls[1]).completedWordIds).toEqual(['word-1', 'word-2']);
  });

  it('propagates storage failures and permits a later retry', async () => {
    const setItem = vi.fn().mockRejectedValueOnce(new Error('Storage blocked')).mockResolvedValue(undefined);
    const repository = createProgressRepository({ getItem: async () => null, setItem });
    const record = { ...emptyNotebook, completedWordIds: ['word-1'], bookmarkedWordIds: [] };
    await expect(repository.save(record)).rejects.toThrow('Storage blocked');
    await expect(repository.save(record)).resolves.toBeUndefined();
    expect(setItem).toHaveBeenCalledTimes(2);
  });
});
