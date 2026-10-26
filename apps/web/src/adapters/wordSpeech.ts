export interface WordSpeechState {
  wordId: string | null;
  rate: number;
  playing: boolean;
  error: string | null;
}

/** Browser adapter only. Android WebView needs a native adapter, not this API. */
export function createWordSpeechStore() {
  let state: WordSpeechState = { wordId: null, rate: 1, playing: false, error: null };
  let current: SpeechSynthesisUtterance | null = null;
  let startTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: WordSpeechState) => {
    state = next;
    listeners.forEach(listener => listener());
  };
  const supported = () => typeof window !== 'undefined' && Boolean(window.speechSynthesis) &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  const cancel = () => {
    current = null;
    clearTimeout(startTimer);
    if (supported()) window.speechSynthesis.cancel();
  };
  const stop = () => {
    try {
      cancel();
      publish({ ...state, wordId: null, playing: false, error: null });
    } catch {
      publish({ ...state, playing: false, error: '음성 재생을 중지하지 못했습니다. 화면을 새로고침해 주세요.' });
    }
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    stop,
    speak(wordId: string, word: string, example: string | undefined, slow = false) {
      const rate = slow ? 0.7 : 1;
      if (state.playing && state.wordId === wordId && state.rate === rate) {
        stop();
        return;
      }
      try {
        cancel();
        if (!supported()) {
          publish({ wordId, rate, playing: false, error: '이 환경에서는 음성 읽기를 지원하지 않습니다. Chrome 또는 Safari에서 이용해 주세요.' });
          return;
        }
        const text = [word.trim().toLowerCase(), example?.trim()].filter(Boolean).join('. ');
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(item => /^en[-_]US$/i.test(item.lang)) ??
          voices.find(item => /^en(?:[-_]|$)/i.test(item.lang));
        if (voice) utterance.voice = voice;
        current = utterance;
        utterance.onstart = () => { if (current === utterance) clearTimeout(startTimer); };
        utterance.onend = () => {
          if (current !== utterance) return;
          current = null;
          clearTimeout(startTimer);
          publish({ wordId: null, rate, playing: false, error: null });
        };
        utterance.onerror = event => {
          if (current !== utterance) return;
          current = null;
          clearTimeout(startTimer);
          const unavailable = ['language-unavailable', 'voice-unavailable', 'synthesis-unavailable'].includes(event.error);
          publish({ wordId, rate, playing: false, error: unavailable
            ? '영어 음성을 사용할 수 없습니다. 기기 또는 브라우저의 영어 음성 설정을 확인해 주세요.'
            : '음성을 재생하지 못했습니다. 음량과 음성 설정을 확인한 뒤 다시 눌러 주세요.' });
        };
        publish({ wordId, rate, playing: true, error: null });
        startTimer = setTimeout(() => {
          if (current !== utterance) return;
          stop();
          publish({ wordId, rate, playing: false, error: '음성 재생이 시작되지 않았습니다. 영어 음성 설정을 확인한 뒤 다시 눌러 주세요.' });
        }, 8000);
        window.speechSynthesis.speak(utterance);
      } catch {
        current = null;
        clearTimeout(startTimer);
        publish({ wordId, rate, playing: false, error: '음성을 재생하지 못했습니다. 잠시 후 다시 눌러 주세요.' });
      }
    },
  };
}

export const wordSpeechStore = createWordSpeechStore();
