import { useEffect, useState, type CSSProperties } from 'react';

const colors = ['#facc15', '#2563eb', '#7c3aed', '#f97316', '#ec4899', '#10b981'];
const pieces = Array.from({ length: 72 }, (_, index) => ({
  '--confetti-color': colors[index % colors.length],
  '--confetti-start': `${15 + (index % 3) * 35}%`,
  '--confetti-x': `${((index * 37) % 91) - 45}vw`,
  '--confetti-rise': `-${55 + ((index * 19) % 41)}dvh`,
  '--confetti-end': `-${20 + ((index * 13) % 35)}dvh`,
  '--confetti-spin': `${((index * 97) % 1080) - 540}deg`,
  animationDelay: `${Math.floor(index / 24) * 320 + (index % 8) * 35}ms`,
  animationDuration: `${2400 + (index % 5) * 140}ms`,
  borderRadius: index % 3 === 0 ? '50%' : '2px',
  width: index % 4 === 0 ? '7px' : '10px',
  height: index % 4 === 0 ? '22px' : '10px',
} satisfies CSSProperties & Record<`--confetti-${string}`, string>));

export function CompletionConfetti() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;
  return (
    <div aria-hidden="true" className="completion-confetti">
      {pieces.map((style, index) => <span key={index} className="completion-confetti-piece" style={style} />)}
    </div>
  );
}
