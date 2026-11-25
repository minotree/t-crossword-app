import { useEffect, useId, useRef } from 'react';

/** Stop before another control's click runs, without cancelling its normal action. */
export function useAudioOutsideClick(enabled: boolean, stop: () => void): string {
  const owner = useId();
  const latestStop = useRef(stop);
  latestStop.current = stop;
  useEffect(() => {
    if (!enabled) return;
    const outside = (event: MouseEvent) => {
      // Ionic buttons may originate inside a shadow root (or a modal portal).
      const ownControl = event.composedPath().some(node =>
        node instanceof HTMLElement && node.dataset.mobileAudioControl === owner);
      if (!ownControl) latestStop.current();
    };
    document.addEventListener('click', outside, true);
    return () => document.removeEventListener('click', outside, true);
  }, [enabled, owner]);
  return owner;
}
