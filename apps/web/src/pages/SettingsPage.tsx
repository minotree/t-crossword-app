import { useState, useSyncExternalStore } from 'react';
import { defaultVocabList, wordnetLicense } from '@t-crossword/core';
import { wordProgressStore } from '../adapters/wordProgress.js';
import { version } from '../../package.json';
import { pwaInstall } from '../adapters/pwaInstall.js';
import '@t-crossword/ui/tokens.css';
import '../styles/settings.css';

export function SettingsPage() {
  const progress = useSyncExternalStore(wordProgressStore.subscribe, wordProgressStore.getSnapshot);
  const [message, setMessage] = useState('');
  const installation = useSyncExternalStore(pwaInstall.subscribe, pwaInstall.getSnapshot);
  const [installError, setInstallError] = useState('');
  const install = async () => {
    setInstallError('');
    try { await pwaInstall.prompt(); }
    catch { setInstallError('앱을 설치하지 못했습니다. 브라우저 메뉴에서 다시 시도해 주세요.'); }
  };
  const completed = new Set(progress.completedWordIds);
  const count = defaultVocabList.filter((word) => completed.has(word.id)).length;
  const reset = () => {
    setMessage('');
    if (!window.confirm(`학습완료 기록 ${count}개를 초기화할까요?\n초기화한 단어는 다시 출제됩니다. 즐겨찾기와 오답노트는 유지됩니다.`)) return;
    if (wordProgressStore.resetCompleted()) setMessage('학습 기록을 초기화했습니다.');
  };

  return <div className="mnu-ui mnu-web-settings">
    <main className="mnu-web-settings-main">
      <h1>설정</h1>
      {progress.error && <p role="alert" className="text-rose-700">{progress.error}</p>}
      {message && <p role="status" className="text-emerald-700">{message}</p>}
      <div className="mnu-web-settings-columns">
        <div className="mnu-web-settings-column">
          {!installation.installed && <section aria-labelledby="app-installation" className="mnu-web-settings-card">
            <h2 id="app-installation">앱 설치 안내</h2>
            <p>영어 낱말을 홈 화면에 추가해 더 편리하게 이용해 보세요.</p>
            {installation.available ? <button type="button" className="mnu-web-settings-install" onClick={() => { void install(); }}>영어 낱말 설치</button> : <>
              <p>브라우저 메뉴에서 <strong>‘앱 설치’ 또는 ‘홈 화면에 추가’</strong>를 선택해 주세요.</p>
              <p>iPhone·iPad에서는 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택해 주세요.</p>
            </>}
            {installError && <p role="alert" className="text-rose-700">{installError}</p>}
          </section>}
          <section aria-labelledby="app-information" className="mnu-web-settings-card">
            <h2 id="app-information">앱 정보</h2>
            <dl className="mnu-web-settings-details">
              <div><dt>앱 이름</dt><dd>영어 낱말</dd></div>
              <div><dt>PWA 버전</dt><dd>v{version}</dd></div>
              <div><dt>개발 및 운영</dt><dd>MNU App Studio</dd></div>
              <div><dt>학습 기록 저장 방식</dt><dd>현재 기기에 저장</dd></div>
            </dl>
          </section>
          <section aria-labelledby="support-policy" className="mnu-web-settings-card">
            <h2 id="support-policy">고객지원 및 정책</h2>
            <div className="mnu-web-settings-links">
              <a href="https://mnuappstudio.com/privacy/crossword/web/" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
              <a href="mailto:support@mnuappstudio.com">문의하기: support@mnuappstudio.com</a>
              <a href="https://mnuappstudio.com" target="_blank" rel="noopener noreferrer">공식 홈페이지: MNU App Studio</a>
            </div>
            <p>영어 낱말 웹·PWA의 개인정보 처리에 관한 안내를 확인할 수 있습니다.</p>
          </section>
        </div>
        <div className="mnu-web-settings-column">
          <section aria-labelledby="vocabulary-guide" className="mnu-web-settings-card">
            <h2 id="vocabulary-guide" className="mb-3 text-lg font-bold">단어장 구성 안내</h2>
            <p className="mb-3 inline-block rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">총 {defaultVocabList.length.toLocaleString('ko-KR')}개 단어</p>
            <p className="text-sm leading-relaxed text-slate-600">초급·중급·고급 3,339개는 2022 개정 교육과정의 교육부 지정 기본 어휘와 9급 공무원 시험 영어 어휘를 바탕으로 선별했습니다. 특급에는 학술·심화 영어 어휘 500개를 추가했습니다.</p>
            <dl className="mt-4 divide-y divide-slate-200 border-t border-slate-200 text-sm leading-relaxed">
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-4"><dt className="font-bold text-blue-700">초급</dt><dd className="text-slate-600">초등학교 권장 영어 어휘</dd></div>
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-4"><dt className="font-bold text-blue-700">중급</dt><dd className="text-slate-600">중학교·고등학교 영어 공통과목 권장 어휘</dd></div>
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-4"><dt className="font-bold text-blue-700">고급</dt><dd className="text-slate-600">고등학교 영어 외 과목 권장 어휘 및 9급 공무원 시험 영어 어휘</dd></div>
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 pt-4"><dt className="font-bold text-blue-700">특급</dt><dd className="text-slate-600">학술·심화 영어 어휘 500개. 공식 토플 어휘 목록이나 출제 빈도 순위는 아닙니다.</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">퀴즈에는 선택한 난이도와 그 아래 난이도의 미완료 단어가 함께 출제됩니다. 학습완료한 단어도 오답노트에 표시 중이면 다시 출제됩니다. 오답노트에서 삭제하면 학습완료 단어는 출제 대상에서 제외됩니다. 학습완료 수는 선택한 난이도의 단어만 집계합니다.</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">특급의 뜻·예문·해석은 AI를 활용해 작성하고 편집 검수했습니다. 의미 검토에는 WordNet 3.0을 참고했습니다.</p>
            <div className="mnu-web-settings-notices">
            <h3 className="mb-3 font-bold">콘텐츠 이용 고지</h3>
            <details><summary className="cursor-pointer py-2 text-sm font-medium">WordNet 3.0 이용 조건</summary>
              <pre lang="en" className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">{wordnetLicense}</pre>
            </details>
            </div>
          </section>
          <section aria-labelledby="data-management" className="mnu-web-settings-card">
            <h2 id="data-management">데이터 관리</h2>
            <p>학습 완료 단어 <strong>{count.toLocaleString('ko-KR')}개</strong></p>
            <p>학습 완료 상태만 초기화합니다. 즐겨찾기와 오답노트 등 다른 기록은 유지됩니다.</p>
            <button type="button" onClick={reset} disabled={progress.completedWordIds.length === 0} className="mnu-web-settings-reset">학습 기록 초기화</button>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
