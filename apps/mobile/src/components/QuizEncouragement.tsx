import { useEffect, useRef, useState } from 'react';
import { IonButton } from '@ionic/react';
import encouragements from '../data/encouragements.json';
import { EncouragementAudio } from './EncouragementAudio.js';

const colors = ['#1b64da', '#8b95a1'];

// The parent keys this by puzzle version, resetting translation and playback per puzzle.
export function QuizEncouragement({ puzzleVersion }: { puzzleVersion: number }) {
  const [color] = useState(() => colors[Math.floor(Math.random() * colors.length)]);
  const [translated, setTranslated] = useState(false);
  const region = useRef<HTMLElement>(null);
  const requestedScroll = useRef(false);
  const phrase = encouragements[(Math.max(1, puzzleVersion) - 1) % encouragements.length];
  useEffect(() => {
    if (!requestedScroll.current) return;
    requestedScroll.current = false;
    // This screen owns its scroll container inside IonContent; avoid scrolling the page/footer.
    const screen = region.current?.closest<HTMLElement>('.mobile-screen-quiz');
    screen?.scrollTo({ top: translated ? screen.scrollHeight : 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [translated]);
  if (!phrase) return null;
  return <aside ref={region} className="mobile-quiz-encouragement" aria-label="학습 응원 문구" style={{ color }}>
    <p lang="en">{phrase.english}</p>
    <div className="mobile-encouragement-actions">
      <IonButton size="small" fill="clear" aria-expanded={translated} aria-controls="mobile-encouragement-translation"
        onClick={() => { requestedScroll.current = true; setTranslated(value => !value); }}>{translated ? '해석 닫기' : '해석 보기'}</IonButton>
      <EncouragementAudio english={phrase.english} />
    </div>
    <p id="mobile-encouragement-translation" lang="ko" hidden={!translated}>{phrase.korean}</p>
  </aside>;
}
