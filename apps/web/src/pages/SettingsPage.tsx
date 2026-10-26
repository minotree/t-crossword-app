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

  return <div className="min-h-full bg-slate-50 text-slate-900">
    <main className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-8 pt-5 sm:px-6">
      <h1 className="text-2xl font-bold">설정</h1>
      <aside aria-label="홈 화면에 추가 안내" className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-relaxed text-slate-600">
        <p className="mb-1 font-bold text-blue-700">영어 낱말을 더 가까이 두세요.</p>
        <p>브라우저 메뉴에서 <strong className="text-blue-700">‘앱 설치’ 또는 ‘홈 화면에 추가’</strong>를 선택해 보세요.</p>
        <p className="mt-2">iPhone·iPad에서는 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택해 주세요.</p>
      </aside>
      {progress.error && <p role="alert" className="mb-4 text-sm text-rose-700">{progress.error}</p>}
      {message && <p role="status" className="mb-4 text-sm text-emerald-700">{message}</p>}
      <section aria-labelledby="data-management" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="data-management" className="mb-3 text-lg font-bold">데이터 관리</h2>
        <p className="mb-3 text-sm leading-7 text-slate-600">학습 완료 상태만 초기화합니다 (완료: {count}개)</p>
        <button type="button" onClick={reset} disabled={progress.completedWordIds.length === 0}
          className="min-h-12 w-full rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-60">
          학습 기록 초기화
        </button>
      </section>
      <section aria-labelledby="app-information" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="app-information" className="mb-3 text-lg font-bold">앱 정보</h2>
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3"><dt className="text-slate-500">앱 이름</dt><dd className="font-medium">영어 단어 십자낱말 풀이</dd></div>
          <div className="flex items-baseline justify-between gap-3 py-3"><dt className="text-slate-500">버전</dt><dd>v{version}</dd></div>
          <div className="pt-3"><dt className="font-medium">학습 기록 저장</dt><dd className="mt-1 leading-relaxed text-slate-500">이 기기에 학습 기록을 저장합니다.</dd></div>
        </dl>
      </section>
      <section aria-labelledby="vocabulary-guide" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="vocabulary-guide" className="mb-3 text-lg font-bold">단어장 구성 안내</h2>
        <p className="mb-3 inline-block rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">총 {defaultVocabList.length.toLocaleString('ko-KR')}개 단어</p>
        <p className="text-sm leading-relaxed text-slate-600">2022 개정 교육과정의 교육부 지정 기본 어휘와 9급 공무원 시험 영어 어휘를 바탕으로 선별했습니다.</p>
        <dl className="mt-4 divide-y divide-slate-200 border-t border-slate-200 text-sm leading-relaxed">
          <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-4"><dt className="font-bold text-blue-700">초급</dt><dd className="text-slate-600">초등학교 권장 영어 어휘</dd></div>
          <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-4"><dt className="font-bold text-blue-700">중급</dt><dd className="text-slate-600">중학교·고등학교 영어 공통과목 권장 어휘</dd></div>
          <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 pt-4"><dt className="font-bold text-blue-700">고급</dt><dd className="text-slate-600">고등학교 영어 외 과목 권장 어휘 및 9급 공무원 시험 영어 어휘</dd></div>
        </dl>
      </section>
    </main>
  </div>;
}
