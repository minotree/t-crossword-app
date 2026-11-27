import type { ReactNode } from 'react';

export interface HomeScreenProps {
  quizAction: ReactNode;
  wordBankAction: ReactNode;
}

/** Navigation and platform button rendering belong to the consuming app. */
export function HomeScreen({ quizAction, wordBankAction }: HomeScreenProps) {
  return <main className="mnu-ui mnu-home">
    <section className="mnu-home__welcome" aria-labelledby="mnu-home-heading">
      <p className="mnu-home__title">영어 단어 십자낱말 풀이</p>
      <div className="mnu-home__body">
        <div className="mnu-home__puzzle" aria-hidden="true">
          <div className="mnu-home__grid">
            {['W', 'O', 'R', '', 'D', '', '', 'S', ''].map((letter, index) =>
              <span key={index} className={`mnu-home__cell${letter ? ' mnu-home__cell--letter' : ''}`}>{letter}</span>)}
          </div>
        </div>
        <h1 id="mnu-home-heading" className="mnu-home__heading">영어 단어 십자낱말 풀이에<br />오신 것을 환영합니다!</h1>
        <p className="mnu-home__description">단어장에 저장된 단어들로 맞춤형 십자낱말 퍼즐을 즐기고 영어 실력을 키워보세요.</p>
        <div className="mnu-home__actions">{quizAction}{wordBankAction}</div>
      </div>
    </section>
  </main>;
}
