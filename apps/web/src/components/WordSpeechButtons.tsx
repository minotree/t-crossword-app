import type { WordSpeechState } from '../adapters/wordSpeech.js';

export function WordSpeechButtons({ wordId, word, speech, onSpeak }: {
  wordId: string;
  word: string;
  speech: WordSpeechState;
  onSpeak: (slow: boolean) => void;
}) {
  const active = (speech.playing || speech.loading) && speech.wordId === wordId;
  return <><div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`${word} 영어 단어와 예문 듣기`}>
    {[{ slow: false, label: '듣기', rate: 1 }, { slow: true, label: '느리게', rate: 0.7 }].map(item => {
      const playing = active && speech.rate === item.rate;
      return <button key={item.label} type="button" aria-pressed={playing}
        aria-label={`${word} 단어와 예문 ${playing ? '재생 중지' : item.slow ? '느리게 듣기' : '듣기'}`}
        onClick={() => onSpeak(item.slow)}
        className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${playing ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
        {playing ? '중지' : item.label}
      </button>;
    })}
  </div>
    {speech.wordId === wordId && speech.loading && <p role="status" className="mt-2 text-sm text-slate-600">음성을 불러오는 중입니다.</p>}
    {speech.wordId === wordId && speech.error && <p role="alert" className="mt-2 text-sm text-rose-700">{speech.error}</p>}
  </>;
}
