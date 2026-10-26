export interface Progress {
  completedWordIds: string[];
  bookmarkedWordIds: string[];
  hintUsedWordIds: string[];
  dismissedMistakeWordIds: string[];
}

export interface ProgressStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const PROGRESS_KEY = 't-crossword.toss.progress.v1';

export function parseProgress(raw: string | null): Progress {
  if (raw === null) return { completedWordIds: [], bookmarkedWordIds: [], hintUsedWordIds: [], dismissedMistakeWordIds: [] };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' ||
      !('completedWordIds' in value) || !('bookmarkedWordIds' in value)) {
    throw new Error('저장된 학습 기록의 형식을 확인하지 못했습니다.');
  }
  const { completedWordIds, bookmarkedWordIds } = value;
  const hintUsedWordIds = 'hintUsedWordIds' in value ? value.hintUsedWordIds : [];
  const dismissedMistakeWordIds = 'dismissedMistakeWordIds' in value ? value.dismissedMistakeWordIds : [];
  if (!Array.isArray(completedWordIds) || !completedWordIds.every((id): id is string => typeof id === 'string') ||
      !Array.isArray(bookmarkedWordIds) || !bookmarkedWordIds.every((id): id is string => typeof id === 'string') ||
      !Array.isArray(hintUsedWordIds) || !hintUsedWordIds.every((id): id is string => typeof id === 'string') ||
      !Array.isArray(dismissedMistakeWordIds) || !dismissedMistakeWordIds.every((id): id is string => typeof id === 'string')) {
    throw new Error('저장된 학습 기록의 형식을 확인하지 못했습니다.');
  }
  return { completedWordIds: [...new Set(completedWordIds)], bookmarkedWordIds: [...new Set(bookmarkedWordIds)],
    hintUsedWordIds: [...new Set(hintUsedWordIds)], dismissedMistakeWordIds: [...new Set(dismissedMistakeWordIds)] };
}

export function dismissMistake(progress: Progress, id: string): Progress {
  return { ...progress, dismissedMistakeWordIds: [...new Set([...progress.dismissedMistakeWordIds, id])] };
}

export function recordHintUsed(progress: Progress, id: string): Progress {
  return { ...progress, hintUsedWordIds: [...new Set([...progress.hintUsedWordIds, id])],
    dismissedMistakeWordIds: progress.dismissedMistakeWordIds.filter((value) => value !== id) };
}

export function isMistakeVisible(progress: Progress, id: string): boolean {
  return progress.hintUsedWordIds.includes(id) && !progress.dismissedMistakeWordIds.includes(id);
}

// Keep legacy notebook records in the existing storage format.
export const recordMistake = recordHintUsed;

/** Keep writes in order even when a previous write fails. */
export function createProgressRepository(storage: ProgressStorage) {
  let pending = Promise.resolve();
  return {
    async load() { return parseProgress(await storage.getItem(PROGRESS_KEY)); },
    save(progress: Progress): Promise<void> {
      const value = JSON.stringify(progress);
      const write = pending.then(() => storage.setItem(PROGRESS_KEY, value));
      // The caller receives the rejection; recovery only keeps the queue usable.
      pending = write.catch(() => {});
      return write;
    },
  };
}
