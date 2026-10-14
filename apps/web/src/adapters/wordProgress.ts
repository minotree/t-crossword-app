export interface WordProgress {
  completedWordIds: string[];
  bookmarkedWordIds: string[];
  error: string | null;
}

type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const WORD_PROGRESS_KEY = 't-crossword.word-progress.v1';

export function createWordProgressStore(getStorage: () => ProgressStorage) {
  let snapshot: WordProgress = { completedWordIds: [], bookmarkedWordIds: [], error: null };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const load = () => {
    try {
      const raw = getStorage().getItem(WORD_PROGRESS_KEY);
      if (!raw) {
        snapshot = { completedWordIds: [], bookmarkedWordIds: [], error: null };
      } else {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' ||
            !('completedWordIds' in parsed) || !('bookmarkedWordIds' in parsed)) throw new Error('Invalid progress');
        const completed = parsed.completedWordIds;
        const bookmarks = parsed.bookmarkedWordIds;
        if (!Array.isArray(completed) || !completed.every((id): id is string => typeof id === 'string') ||
            !Array.isArray(bookmarks) || !bookmarks.every((id): id is string => typeof id === 'string')) throw new Error('Invalid progress');
        snapshot = { completedWordIds: [...new Set(completed)], bookmarkedWordIds: [...new Set(bookmarks)], error: null };
      }
    } catch {
      snapshot = { ...snapshot, error: '기기의 학습 기록을 읽지 못했습니다. 저장소 설정을 확인해 주세요.' };
    }
    emit();
  };
  const save = (next: WordProgress) => {
    snapshot = { ...next, error: null };
    try {
      getStorage().setItem(WORD_PROGRESS_KEY, JSON.stringify({
        completedWordIds: snapshot.completedWordIds,
        bookmarkedWordIds: snapshot.bookmarkedWordIds,
      }));
    } catch {
      snapshot = { ...snapshot, error: '학습 기록을 기기에 저장하지 못했습니다. 새로고침하면 이번 기록이 사라질 수 있습니다.' };
    }
    emit();
  };
  load();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    reload: load,
    resetCompleted(): boolean {
      const next = { ...snapshot, completedWordIds: [], error: null };
      try {
        getStorage().setItem(WORD_PROGRESS_KEY, JSON.stringify({
          completedWordIds: [], bookmarkedWordIds: next.bookmarkedWordIds,
        }));
        snapshot = next;
        emit();
        return true;
      } catch {
        snapshot = { ...snapshot, error: '학습 기록을 초기화하지 못했습니다. 저장소 설정을 확인해 주세요.' };
        emit();
        return false;
      }
    },
    markCompleted(id: string) {
      save({ ...snapshot, completedWordIds: [...new Set([...snapshot.completedWordIds, id])] });
    },
    toggleBookmark(id: string) {
      const ids = snapshot.bookmarkedWordIds;
      save({ ...snapshot, bookmarkedWordIds: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id] });
    },
  };
}

export const wordProgressStore = createWordProgressStore(() => window.localStorage);
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === WORD_PROGRESS_KEY || event.key === null) wordProgressStore.reload();
  });
}
