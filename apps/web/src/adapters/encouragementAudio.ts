export type EncouragementAudioStatus = 'idle' | 'loading' | 'playing' | 'error';

/** Browser-only playback; injected Audio factory keeps lifecycle races testable. */
export function createEncouragementAudio(url: string | undefined, createAudio: () => HTMLAudioElement = () => new Audio()) {
  let status: EncouragementAudioStatus = 'idle';
  let current: HTMLAudioElement | null = null;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const emit = (next: EncouragementAudioStatus) => { status = next; listeners.forEach(listener => listener()); };
  const release = () => {
    clearTimeout(timer);
    const audio = current;
    current = null;
    if (audio) {
      audio.onplaying = null; audio.onended = null; audio.onerror = null; audio.onwaiting = null; audio.onpause = null;
      audio.pause(); audio.removeAttribute('src'); audio.load();
    }
  };
  const stop = () => { generation++; release(); emit('idle'); };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => status,
    stop,
    toggle() {
      if (current) { stop(); return; }
      stop();
      const attempt = generation;
      const fail = () => { if (generation === attempt) { generation++; release(); emit('error'); } };
      const wait = () => {
        if (generation !== attempt) return;
        clearTimeout(timer); emit('loading'); timer = setTimeout(fail, 15000);
      };
      try {
        if (!url) throw new Error('Audio entry unavailable');
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Invalid audio URL');
        const audio = createAudio(); current = audio;
        audio.preload = 'none'; audio.src = parsed.href;
        audio.onplaying = () => { if (generation === attempt) { clearTimeout(timer); emit('playing'); } };
        audio.onended = () => { if (generation === attempt) stop(); };
        audio.onpause = () => { if (generation === attempt) stop(); };
        audio.onwaiting = wait;
        audio.onerror = fail;
        wait();
        void audio.play().catch(fail);
      } catch { fail(); }
    },
  };
}
