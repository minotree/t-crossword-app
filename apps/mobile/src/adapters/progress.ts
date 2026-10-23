export interface LearningProgress { completed: string[]; bookmarks: string[]; hintedWords?: string[]; hiddenHintedWords?: string[] }
export function hideHintedWord(progress: LearningProgress, id: string): LearningProgress {
  return { ...progress, hiddenHintedWords: [...new Set([...(progress.hiddenHintedWords ?? []), id])] };
}
export function recordHintedWord(progress: LearningProgress, id: string): LearningProgress {
  return { ...progress, hintedWords: [...new Set([...(progress.hintedWords ?? []), id])], hiddenHintedWords: (progress.hiddenHintedWords ?? []).filter(value => value !== id) };
}
export function isNotebookWord(progress: LearningProgress, id: string): boolean {
  return (progress.hintedWords ?? []).includes(id) && !(progress.hiddenHintedWords ?? []).includes(id);
}
const key = 'mobile-learning-v1';
export function readProgress(): LearningProgress {
  const raw = localStorage.getItem(key);
  if (raw === null) return { completed: [], bookmarks: [] };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('completed' in value) || !('bookmarks' in value) ||
    !Array.isArray(value.completed) || !Array.isArray(value.bookmarks) ||
    !value.completed.every(id => typeof id === 'string') || !value.bookmarks.every(id => typeof id === 'string')) {
    throw new Error('학습 기록을 읽을 수 없습니다.');
  }
  const hinted = 'hintedWords' in value ? value.hintedWords : undefined;
  const hidden = 'hiddenHintedWords' in value ? value.hiddenHintedWords : undefined;
  if (hidden !== undefined && (!Array.isArray(hidden) || !hidden.every(id => typeof id === 'string'))) throw new Error('오답노트 숨김 기록을 읽을 수 없습니다.');
  if (hinted !== undefined && (!Array.isArray(hinted) || !hinted.every(id => typeof id === 'string'))) throw new Error('힌트 이력을 읽을 수 없습니다.');
  return { completed: [...new Set<string>(value.completed)], bookmarks: [...new Set<string>(value.bookmarks)], ...(Array.isArray(hinted) ? { hintedWords: [...new Set<string>(hinted)] } : {}), ...(Array.isArray(hidden) ? { hiddenHintedWords: [...new Set<string>(hidden)] } : {}) };
}
export function writeProgress(value: LearningProgress): void { localStorage.setItem(key, JSON.stringify(value)); }
