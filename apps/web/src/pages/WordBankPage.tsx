import { useMemo, useState, useSyncExternalStore } from 'react';
import { defaultVocabList } from '@t-crossword/core';
import { wordProgressStore } from '../adapters/wordProgress.js';

const tabs = [
  { key: 'all', label: '전체' },
  { key: 'bookmarked', label: '즐겨찾기' },
  { key: 'completed', label: '학습완료' },
  { key: 'mistakes', label: '오답노트' },
] as const;
const levels = { beginner: '초급', intermediate: '중급', advanced: '고급' };

export function WordBankPage() {
  const progress = useSyncExternalStore(wordProgressStore.subscribe, wordProgressStore.getSnapshot);
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('all');
  const [query, setQuery] = useState('');
  const completed = useMemo(() => new Set(progress.completedWordIds), [progress.completedWordIds]);
  const bookmarked = useMemo(() => new Set(progress.bookmarkedWordIds), [progress.bookmarkedWordIds]);
  const hintUsed = useMemo(() => new Set(progress.hintUsedWordIds), [progress.hintUsedWordIds]);
  const dismissedMistakes = useMemo(() => new Set(progress.dismissedMistakeWordIds), [progress.dismissedMistakeWordIds]);
  const words = defaultVocabList.filter((word) => {
    if (tab === 'completed' && !completed.has(word.id) && word.isQuizUsed !== true) return false;
    if (tab === 'bookmarked' && !bookmarked.has(word.id)) return false;
    if (tab === 'mistakes' && (!hintUsed.has(word.id) || dismissedMistakes.has(word.id))) return false;
    const search = query.trim().toLowerCase();
    return word.word.toLowerCase().includes(search) || word.meaning.toLowerCase().includes(search);
  });

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-10">
      <header className="bg-white border-b border-slate-200">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-black">나의 단어장</h1>
          <p className="text-sm text-slate-500" aria-live="polite">{words.length}개 단어</p>
        </div>
      </header>
      <main className="w-full max-w-4xl mx-auto px-4 pt-4">
        {progress.error && <p role="alert" className="mb-3 text-sm text-rose-700">{progress.error}</p>}
        <nav aria-label="단어장 분류" className="flex rounded-xl bg-white border border-slate-200 overflow-hidden">
          {tabs.map((item) => (
            <button key={item.key} type="button" aria-pressed={tab === item.key} onClick={() => setTab(item.key)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 ${tab === item.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>
              {item.label}
            </button>
          ))}
        </nav>
        {tab === 'mistakes' && <p className="mt-3 text-sm text-slate-600">이 기기에 저장된 기존 오답노트 기록입니다. 삭제해도 단어와 학습 기록은 유지됩니다.</p>}
        <label className="block mt-4">
          <span className="sr-only">단어 또는 뜻 검색</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="단어 또는 뜻 검색"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>
        {words.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-slate-500">
          {query.trim() ? '검색 결과가 없습니다.' : tab === 'mistakes' ? '저장된 오답노트 기록이 없습니다.' : tab === 'completed' ? '퍼즐에서 정답을 맞히면 여기에 표시됩니다.' : '즐겨찾기한 단어가 없습니다.'}
        </p>}
        <ul className="mt-3 space-y-2">
          {words.map((word) => (
            <li key={word.id} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-lg">{word.word}</span>
                  <span className="text-xs text-slate-500">{levels[word.level]} · {word.partOfSpeech}</span>
                  {(completed.has(word.id) || word.isQuizUsed === true) && <span className="text-xs font-bold text-emerald-700">✓ 학습완료</span>}
                </div>
                <p className="mt-1 text-sm">{word.meaning}</p>
                {word.synonym?.trim() && (
                  <p className="mt-1 break-words text-sm text-indigo-700">동의어: {word.synonym}</p>
                )}
                {word.example && <p className="mt-2 text-sm text-slate-500">{word.example}<br />{word.exampleMeaning}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2">
              <button type="button" aria-label={`${word.word} 즐겨찾기`} aria-pressed={bookmarked.has(word.id)}
                onClick={() => wordProgressStore.toggleBookmark(word.id)} className="text-2xl text-amber-500 rounded-lg px-2 focus:ring-2 focus:ring-indigo-500">
                {bookmarked.has(word.id) ? '★' : '☆'}
              </button>
              {tab === 'mistakes' && (
                <button type="button" aria-label={`${word.word} 오답노트에서 삭제`}
                  onClick={() => wordProgressStore.dismissMistake(word.id)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-indigo-600">
                  삭제
                </button>
              )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
