import type { MobileWordAudio, AudioState } from '../adapters/wordAudio.js';

export function WordAudioButtons({ id, word, example, audio, state }: {
  id: string; word: string; example: string; audio: MobileWordAudio; state: AudioState;
}) {
  if (!audio.configured) return null;
  return <div className="mobile-word-audio">
    <div className="mobile-word-audio-actions">{[false, true].map(slow => {
      const active = state.wordId === id && state.slow === slow && (state.status === 'loading' || state.status === 'playing');
      return <button key={String(slow)} type="button" aria-pressed={active}
        aria-label={`${word} ${slow ? '느리게 듣기' : '듣기'}${active ? ' 중지' : ''}`}
        onClick={() => audio.speak(id, word, example, slow)}>{active ? '중지' : slow ? '느리게' : '듣기'}</button>;
    })}</div>
    {state.wordId === id && state.status === 'loading' && <p role="status">음성을 불러오는 중입니다.</p>}
    {state.wordId === id && state.error && <p role="alert">{state.error}</p>}
  </div>;
}
