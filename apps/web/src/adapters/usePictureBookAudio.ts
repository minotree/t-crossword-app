import { useCallback, useEffect, useRef, useState } from 'react';

// App-owned browser lifecycle; narration remains an external static MP3.
export function usePictureBookAudio(id: string, text: string, base: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'gap' | 'error'>('idle');
  const [repeatCount, setRepeatCount] = useState<1 | 5 | 10>(1);
  const [round, setRound] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);
  const stop = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current); controller.current?.abort(); controller.current = null;
    const current = audio.current; audio.current = null;
    if (current) {
      current.onplaying = null; current.onended = null; current.onerror = null; current.onwaiting = null;
      current.pause(); current.removeAttribute('src'); current.load();
    }
  }, []);
  useEffect(() => {
    setStatus('idle');
    const leave = () => { stop(); setStatus('idle'); };
    const hide = () => { if (document.hidden) leave(); };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', leave);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', leave); stop(); };
  }, [id, text, base, stop]);
  const play = async (count: 1 | 5 | 10 = 1) => {
    if (status === 'loading' || status === 'playing' || status === 'gap') { stop(); setStatus('idle'); return; }
    stop();
    if (!base) return;
    const attempt = generation.current;
    const fail = () => { if (generation.current === attempt) { stop(); setStatus('error'); } };
    setRepeatCount(count); setRound(1); setStatus('loading');
    controller.current = new AbortController();
    timer.current = setTimeout(fail, 15000);
    try {
      const root = new URL(base.endsWith('/') ? base : base + '/');
      if (root.protocol !== 'https:' || root.username || root.password || root.search || root.hash) throw new Error('Invalid audio URL');
      const response = await fetch(new URL('manifest.json', root), { signal: controller.current.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('Audio manifest unavailable');
      const entries: unknown = await response.json();
      if (generation.current !== attempt) return;
      if (!Array.isArray(entries)) throw new Error('Invalid manifest');
      const entry: unknown = entries.find((item: unknown) => typeof item === 'object' && item !== null && 'id' in item && item.id === id);
      if (typeof entry !== 'object' || entry === null || !('text' in entry) || entry.text !== text ||
        !('file' in entry) || typeof entry.file !== 'string' || !('sha256' in entry) || typeof entry.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.file !== `${id}-${entry.sha256.slice(0, 16)}.mp3`) throw new Error('Narration differs from page');
      const current = new Audio(); audio.current = current;
      current.preload = 'none'; current.src = new URL(entry.file, root).href;
      current.playbackRate = 1; current.preservesPitch = true;
      current.onplaying = () => { if (generation.current === attempt) { clearTimeout(timer.current); setStatus('playing'); } };
      let completed = 0;
      current.onended = () => {
        if (generation.current !== attempt) return;
        clearTimeout(timer.current);
        completed++;
        if (completed >= count) { stop(); setStatus('idle'); return; }
        setStatus('gap');
        timer.current = setTimeout(() => {
          if (generation.current !== attempt) return;
          try {
            current.currentTime = 0;
            setRound(completed + 1); setStatus('loading');
            timer.current = setTimeout(fail, 15000);
            void current.play().catch(fail);
          } catch { fail(); }
        }, 1000);
      };
      current.onerror = fail;
      current.onwaiting = () => { if (generation.current === attempt) { clearTimeout(timer.current); setStatus('loading'); timer.current = setTimeout(fail, 15000); } };
      await current.play();
    } catch { fail(); }
  };
  const stopPlayback = () => { stop(); setStatus('idle'); };
  return { status, play, stopPlayback, repeatCount, round, configured: !!base };
}
