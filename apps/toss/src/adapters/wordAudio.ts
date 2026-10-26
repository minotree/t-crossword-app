export interface AudioEntry { word: string; example: string; file: string }
export interface AudioState { wordId: string | null; slow: boolean; status: 'idle' | 'loading' | 'playing' | 'error'; error: string | null }

export function createWordAudio(base: string, manifest: Record<string, AudioEntry>, createAudio: () => HTMLAudioElement = () => new Audio()) {
  let state: AudioState = { wordId: null, slow: false, status: 'idle', error: null };
  let current: HTMLAudioElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  const listeners = new Set<() => void>();
  const emit = (next: AudioState) => { state = next; listeners.forEach(listener => listener()); };
  const release = () => {
    clearTimeout(timer);
    if (current) {
      current.onplaying = null; current.onended = null; current.onerror = null; current.onpause = null; current.onwaiting = null;
      current.pause(); current.removeAttribute('src'); current.load(); current = null;
    }
  };
  const stop = () => { generation++; release(); emit({ wordId: null, slow: false, status: 'idle', error: null }); };
  const hasAudio = (id: string, word: string, example: string) => {
    const entry = manifest[id];
    return !!entry && entry.word === word && entry.example === example && /^word-\d+-[a-f0-9]{16}\.mp3$/.test(entry.file);
  };
  return {
    configured: base.trim().length > 0,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    hasAudio,
    stop,
    speak(id: string, word: string, example: string, slow: boolean) {
      if (state.wordId === id && state.slow === slow && (state.status === 'playing' || state.status === 'loading')) { stop(); return; }
      stop();
      const attempt = generation;
      const fail = (message: string) => {
        if (generation !== attempt) return;
        generation++; release(); emit({ wordId: id, slow, status: 'error', error: message });
      };
      if (!hasAudio(id, word, example)) { fail('현재 단어와 일치하는 음성이 없습니다.'); return; }
      let url: URL;
      try {
        if (!base.trim()) throw new Error();
        const root = new URL(base.endsWith('/') ? base : base + '/');
        if (root.username || root.password || root.search || root.hash ||
          (root.protocol !== 'https:' && !(root.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(root.hostname)))) throw new Error();
        url = new URL(manifest[id].file, root);
      } catch { fail('음성 재생 주소가 설정되지 않았습니다.'); return; }
      emit({ wordId: id, slow, status: 'loading', error: null });
      try {
        const audio = createAudio(); current = audio;
        audio.preload = 'none'; audio.src = url.href; audio.playbackRate = slow ? 0.7 : 1; audio.preservesPitch = true;
        audio.onplaying = () => { if (generation === attempt) { clearTimeout(timer); emit({ wordId: id, slow, status: 'playing', error: null }); } };
        audio.onended = () => { if (generation === attempt) stop(); };
        audio.onpause = () => { if (generation === attempt) stop(); };
        audio.onwaiting = () => {
          if (generation !== attempt) return;
          clearTimeout(timer); emit({ wordId: id, slow, status: 'loading', error: null });
          timer = setTimeout(() => fail('음성 재생이 지연되고 있습니다. 다시 눌러 주세요.'), 15000);
        };
        audio.onerror = () => fail('음성을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.');
        timer = setTimeout(() => fail('음성 재생이 지연되고 있습니다. 다시 눌러 주세요.'), 15000);
        void audio.play().catch(() => fail('음성을 재생하지 못했습니다. 다시 눌러 주세요.'));
      } catch { fail('이 환경에서 음성을 재생하지 못했습니다.'); }
    },
  };
}
export type WordAudio = ReturnType<typeof createWordAudio>;
