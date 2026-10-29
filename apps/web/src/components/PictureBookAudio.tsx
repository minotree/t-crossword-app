import { useEffect, useRef, useState } from 'react';
import { usePictureBookAudio } from '../adapters/usePictureBookAudio.js';

export function PictureBookAudio({ id, text }: { id: string; text: string }) {
  const audio = usePictureBookAudio(id, text, import.meta.env.VITE_PICTURE_BOOK_AUDIO_BASE_URL?.trim() || 'https://crossword-content-audio.minotree0902.workers.dev/picture-book-audio/');
  const [choosing, setChoosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (choosing) dialog.current?.showModal(); }, [choosing]);
  const active = audio.status === 'loading' || audio.status === 'playing' || audio.status === 'gap';
  const style = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold disabled:opacity-50';
  return <div className="my-3 flex flex-wrap items-center gap-2" role="group" aria-label="그림책 영어 듣기">
    <button className={style} disabled={!audio.configured} onClick={() => void audio.play()}>{active ? '듣기 중지' : '듣기'}</button>
    <button className={style} onClick={() => { if (active) void audio.play(); else setChoosing(true); }}>{active ? '연속듣기 중지' : '연속듣기'}</button>
    <span role="status">{!audio.configured ? '음성 업로드 준비 중' : audio.status === 'loading' ? '음성을 불러오는 중' : audio.status === 'error' ? '음성을 재생하지 못했어요. 다시 눌러 주세요.' : ''}</span>
    {active && <span role="status">{audio.round} / {audio.repeatCount}회</span>}
    {choosing && <dialog ref={dialog} className="rounded-xl p-6" aria-label="연속듣기 횟수" onCancel={event => { event.preventDefault(); setChoosing(false); }}>
      <h3>연속듣기 횟수</h3><p>현재 페이지를 몇 번 들을까요?</p>
      {([5,10] as const).map(count => <button className={style} key={count} disabled={!audio.configured} onClick={() => { setChoosing(false); void audio.play(count); }}>{count}회 듣기</button>)}
      <button className={style} onClick={() => setChoosing(false)}>닫기</button>
      {!audio.configured && <p>음성 업로드 후 재생할 수 있어요.</p>}
    </dialog>}
  </div>;
}
