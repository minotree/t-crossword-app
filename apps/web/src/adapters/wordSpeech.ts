import { createWordAudio } from './wordAudio.js';

export interface WordSpeechState {
  wordId: string | null;
  rate: number;
  playing: boolean;
  loading?: boolean;
  error: string | null;
}

export function createWordSpeechStore(audio = createWordAudio('https://crossword-word-audio.minotree0902.workers.dev/word-audio/')) {
  const snapshot = (): WordSpeechState => {
    const state = audio.getSnapshot();
    return { wordId: state.wordId, rate: state.slow ? 0.7 : 1,
      playing: state.status === 'playing', loading: state.status === 'loading', error: state.error };
  };
  let state = snapshot();
  audio.subscribe(() => { state = snapshot(); });
  return {
    getSnapshot: () => state,
    subscribe: audio.subscribe,
    stop: audio.stop,
    speak: (id: string, word: string, example: string | undefined, slow = false) => audio.speak(id, word, example ?? '', slow),
  };
}

export const wordSpeechStore = createWordSpeechStore();
