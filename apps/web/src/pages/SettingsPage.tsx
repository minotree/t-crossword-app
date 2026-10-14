import { useState, useSyncExternalStore } from 'react';
import { defaultVocabList } from '@t-crossword/core';
import { wordProgressStore } from '../adapters/wordProgress.js';
import { version } from '../../package.json';

export function SettingsPage() {
  const progress = useSyncExternalStore(wordProgressStore.subscribe, wordProgressStore.getSnapshot);
  const [message, setMessage] = useState('');
  const completed = new Set(progress.completedWordIds);
  const count = defaultVocabList.filter((word) => completed.has(word.id)).length;
  const reset = () => {
    setMessage('');
    if (!window.confirm(`학습완료 기록 ${count}개를 초기화할까요?\n초기화한 단어는 다시 출제됩니다. 즐겨찾기는 유지됩니다.`)) return;
    if (wordProgressStore.resetCompleted()) setMessage('학습 기록을 초기화했습니다.');
  };

  return <div className="min-h-full bg-white text-slate-900">
    <header className="bg-blue-600 px-4 py-4 text-white shadow-md"><div className="mx-auto max-w-4xl"><h1 className="text-xl font-bold">설정 (Settings)</h1></div></header>
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
      {progress.error && <p role="alert" className="mb-4 text-sm text-rose-700">{progress.error}</p>}
      {message && <p role="status" className="mb-4 text-sm text-emerald-700">{message}</p>}
      <section aria-labelledby="data-management">
        <h2 id="data-management" className="mb-3 text-sm font-medium">데이터 관리</h2>
        <button type="button" onClick={reset} disabled={progress.completedWordIds.length === 0}
          className="flex w-full items-start gap-5 rounded-lg px-1 py-4 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-60">
          <span aria-hidden="true" className="w-8 shrink-0 text-center text-2xl text-amber-500">↻</span>
          <span><span className="block font-medium">학습 기록 초기화</span>
            <span className="mt-1 block text-sm text-slate-500">학습 완료 상태만 초기화합니다 (완료: {count}개)</span>
          </span>
        </button>
      </section>
      <section aria-labelledby="app-information" className="mt-10">
        <h2 id="app-information" className="mb-3 text-sm font-medium">앱 정보</h2>
        <div className="flex items-start gap-5 py-4">
          <span aria-hidden="true" className="w-8 shrink-0 text-center text-xl text-blue-600">ⓘ</span>
          <div className="flex-1 border-b border-slate-200 pb-4"><h3 className="font-medium">앱 이름 및 버전</h3>
            <p className="mt-1 text-sm text-slate-500">영어 단어 십자낱말 풀이 v{version}</p>
          </div>
        </div>
        <div className="flex items-start gap-5 py-2">
          <span aria-hidden="true" className="w-8 shrink-0 text-center text-lg text-slate-500">&lt;/&gt;</span>
          <div><h3 className="font-medium">개발 기술 스택</h3><p className="mt-1 text-sm text-slate-500">React, TypeScript, Vite, Tailwind CSS</p></div>
        </div>
      </section>
    </main>
  </div>;
}
