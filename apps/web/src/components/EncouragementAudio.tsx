import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { createEncouragementAudio } from '../adapters/encouragementAudio.js';
import { wordSpeechStore } from '../adapters/wordSpeech.js';

export function EncouragementAudio({ url }: { url: string | undefined }) {
  const audio = useMemo(() => createEncouragementAudio(url), [url]);
  const status = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const hide = () => { if (document.hidden) audio.stop(); };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !button.current?.contains(event.target)) audio.stop(); };
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('pagehide', audio.stop);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('pagehide', audio.stop);
      audio.stop();
    };
  }, [audio]);
  const active = status === 'loading' || status === 'playing';
  return <>
    <button ref={button} type="button" aria-label={active ? '응원 문구 듣기 중지' : '응원 문구 영어 듣기'} aria-pressed={active}
      onClick={() => { wordSpeechStore.stop(); audio.toggle(); }}>
      {status === 'loading' ? '불러오는 중 · 중지' : status === 'playing' ? '듣기 중지' : '영어 듣기'}
    </button>
    {status === 'error' && <p role="alert">음성을 재생하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.</p>}
  </>;
}
