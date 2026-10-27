import { Button } from '@toss/tds-mobile';
import type { WordAudio, AudioState } from '../adapters/wordAudio.js';

export function WordAudioButtons({ id, word, example, audio, state }: { id: string; word: string; example: string; audio: WordAudio; state: AudioState }) {
  if (!audio.configured) return null;
  return <div className="word-audio">
    <div className="word-audio-actions">{[false, true].map(slow => {
      const active = state.wordId === id && state.slow === slow && (state.status === 'playing' || state.status === 'loading');
      return <Button key={String(slow)} size="small" variant="weak" aria-pressed={active}
        aria-label={`${word} ${slow ? '느리게 듣기' : '듣기'}${active ? ' 중지' : ''}`}
        onClick={() => audio.speak(id, word, example, slow)}>{active ? '중지' : slow ? '느리게' : '듣기'}</Button>;
    })}</div>
    {state.wordId === id && state.status === 'loading' && <p role="status" className="secondary">음성을 불러오는 중입니다.</p>}
    {state.wordId === id && state.error && <p role="alert">{state.error}</p>}
  </div>;
}
