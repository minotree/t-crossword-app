import { useId, useState, type ReactNode } from 'react';

const colors = ['#1b64da', '#8b95a1'];

/** Key by successful puzzle version to reset translation and presentation color. */
export function LearningEncouragement({ phrase, audioControl }: {
  phrase: { english: string; korean: string };
  audioControl: ReactNode;
}) {
  const [translated, setTranslated] = useState(false);
  const [color] = useState(() => colors[Math.floor(Math.random() * colors.length)]);
  const translationId = useId();
  return <aside className="mnu-encouragement" aria-label="학습 응원 문구" style={{ color }}>
    <p lang="en">{phrase.english}</p>
    <div className="mnu-encouragement__actions">
      <button type="button" aria-expanded={translated} aria-controls={translationId}
        onClick={() => setTranslated(value => !value)}>{translated ? '해석 닫기' : '해석 보기'}</button>
      {audioControl}
    </div>
    <p id={translationId} lang="ko" hidden={!translated}>{phrase.korean}</p>
  </aside>;
}
