import type { MobileWordAudio, AudioState } from '../adapters/wordAudio.js';
import { useAudioOutsideClick } from '../adapters/useAudioOutsideClick.js';

export function WordAudioButtons({ id, word, example, audio, state }: {
  id: string; word: string; example: string; audio: MobileWordAudio; state: AudioState;
}) {
  const owner = useAudioOutsideClick(state.wordId === id && (state.status === 'loading' || state.status === 'playing'), audio.stop);
  if (!audio.configured) return null;
  return <div className="mobile-word-audio">
    <div className="mobile-word-audio-actions">{[false, true].map(slow => {
      const active = state.wordId === id && state.slow === slow && (state.status === 'loading' || state.status === 'playing');
      return <button key={String(slow)} data-mobile-audio-control={owner} type="button" aria-pressed={active}
        aria-label={`${word} ${slow ? '느리게 듣기' : '듣기'}${active ? ' 중지' : ''}`}
        onClick={() => audio.speak(id, word, example, slow)}>{active ? '중지' : slow ? '느리게' : '듣기'}</button>;
    })}<span className="mobile-word-audio-notice">온라인 음성 · AI 생성</span></div>
    {state.wordId === id && state.status === 'loading' && <p role="status">음성을 불러오는 중입니다.</p>}
    {state.wordId === id && state.error && <p role="alert">{state.error}</p>}
  </div>;
}
