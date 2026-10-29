import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@toss/tds-mobile';
import manifest from '../data/encouragement-audio.json';

export function EncouragementAudio({ english }: { english: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const current = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const entry = manifest.find(item => item.english === english);
  const stop = useCallback(() => {
    clearTimeout(timer.current);
    const audio = current.current;
    current.current = null;
    if (audio) {
      audio.onplaying = null; audio.onended = null; audio.onerror = null; audio.onwaiting = null;
      audio.pause(); audio.removeAttribute('src'); audio.load();
    }
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) { stop(); setStatus('idle'); } };
    const leave = () => { stop(); setStatus('idle'); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', leave);
      stop();
    };
  }, [stop]);
  const toggle = () => {
    if (current.current) { stop(); setStatus('idle'); return; }
    if (!entry || !/^encouragement-\d{2}-[a-f0-9]{16}\.mp3$/.test(entry.file)) { setStatus('error'); return; }
    try {
      const audio = new Audio();
      current.current = audio;
      setStatus('loading');
      const fail = () => { if (current.current === audio) { stop(); setStatus('error'); } };
      const wait = () => {
        if (current.current !== audio) return;
        clearTimeout(timer.current); setStatus('loading'); timer.current = setTimeout(fail, 15000);
      };
      audio.preload = 'none';
      audio.src = `https://crossword-content-audio.minotree0902.workers.dev/encouragement-audio/${entry.file}`;
      audio.onplaying = () => { if (current.current === audio) { clearTimeout(timer.current); setStatus('playing'); } };
      audio.onended = () => { if (current.current === audio) { stop(); setStatus('idle'); } };
      audio.onwaiting = wait;
      audio.onerror = fail;
      wait();
      void audio.play().catch(fail);
    } catch { stop(); setStatus('error'); }
  };
  const active = status === 'loading' || status === 'playing';
  return <>
    <Button size="small" variant="weak" aria-label={active ? '응원 문구 듣기 중지' : '응원 문구 영어 듣기'} aria-pressed={active} onClick={toggle}>
      {status === 'loading' ? '불러오는 중 · 중지' : status === 'playing' ? '듣기 중지' : '영어 듣기'}
    </Button>
    {status === 'error' && <p role="alert">음성을 재생하지 못했어요. 다시 눌러 주세요.</p>}
  </>;
}
