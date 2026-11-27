import { useEffect, useMemo, useState } from 'react';
import '@t-crossword/ui/tokens.css';
import '../styles/portraitRecommendation.css';

const recommendationQuery = '(orientation: landscape) and (max-height: 500px) and (pointer: coarse) and (hover: none)';

/** Advisory only: keep the quiz mounted and usable in either orientation. */
export function PortraitRecommendation() {
  const queries = useMemo(() => typeof window.matchMedia === 'function' ? {
    recommended: window.matchMedia(recommendationQuery),
    landscape: window.matchMedia('(orientation: landscape)'),
  } : undefined, []);
  const [recommended, setRecommended] = useState(() => queries?.recommended.matches ?? false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!queries) return;
    const update = () => {
      setRecommended(queries.recommended.matches);
      // Changing height/input while still landscape must not repeat the advice.
      if (!queries.landscape.matches) setDismissed(false);
    };
    queries.recommended.addEventListener('change', update);
    queries.landscape.addEventListener('change', update);
    return () => {
      queries.recommended.removeEventListener('change', update);
      queries.landscape.removeEventListener('change', update);
    };
  }, [queries]);
  if (!recommended || dismissed) return null;
  return <aside className="mnu-ui mnu-web-portrait-advice" aria-label="화면 방향 안내">
    <h2>세로 화면에서 학습해 보세요.</h2>
    <p>십자낱말 퍼즐은 세로 화면에서 더욱 편리하게 이용할 수 있습니다.</p>
    <button type="button" onClick={() => setDismissed(true)}>가로 화면 계속 이용</button>
  </aside>;
}
