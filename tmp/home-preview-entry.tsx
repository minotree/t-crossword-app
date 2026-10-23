import React from '../apps/toss/node_modules/react/index.js';
import { renderToStaticMarkup } from '../apps/toss/node_modules/react-dom/server.node.js';
import { Button } from '../apps/toss/node_modules/@toss/tds-mobile';
import { TDSMobileAITProvider } from '../apps/toss/node_modules/@toss/tds-mobile-ait';
import { NavigationIcon } from '../apps/toss/src/components/NavigationIcon.tsx';
const isGameBusy=false, openQuiz=()=>{}, setPage=()=>{};
export const markup = renderToStaticMarkup(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><div className="app-shell">
<header className="app-heading"><h1>영어 퍼즐</h1><div className="wallet-heading"><span>24개 학습</span><strong>💡 31개</strong></div></header>
<main className="scroll-page"><section className="home-welcome" aria-labelledby="welcome-title">
          <p className="home-title">영어 단어 십자낱말 풀이</p>
          <div className="home-puzzle" aria-hidden="true"><div>{['W', 'O', 'R', '', 'D', '', '', 'S', ''].map((letter, index) => <span key={index} className={letter ? 'letter' : ''}>{letter}</span>)}</div></div>
          <h2 id="welcome-title">영어 단어 십자낱말 풀이에<br />오신 것을 환영합니다!</h2>
          <p className="home-description">단어장에 저장된 단어들로 맞춤형 십자낱말 퍼즐을 즐기고 영어 실력을 키워보세요.</p>
          <div className="home-actions">
            <Button display="block" disabled={isGameBusy} loading={isGameBusy} onClick={openQuiz}><NavigationIcon name="quiz" />퍼즐 퀴즈 시작하기</Button>
            <Button display="block" variant="weak" onClick={() => setPage('words')}><NavigationIcon name="words" />단어장 관리하기</Button>
          </div>
        </section></main>
<nav className="bottom-navigation">{[['home','홈'],['quiz','퀴즈 풀기'],['words','단어장'],['books','그림책'],['settings','설정']].map(([name,label])=><Button key={name} size="medium" variant="weak" aria-current={name==='home'?'page':undefined}><span className="navigation-item"><NavigationIcon name={name}/>{label}</span></Button>)}</nav>
<aside className="ad-banner"><div className="mock-ad"><span className="mock-ad-icon">⚡</span><div><b>테스트 광고</b><p>테스트 광고 문구 · AD</p><small>심의필 2025-광고-00001</small></div></div></aside>
</div></TDSMobileAITProvider>);