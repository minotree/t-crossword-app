import { useEffect, useRef, useState } from 'react';
import { Button } from '@toss/tds-mobile';
import { usePictureBookAudio } from '../adapters/usePictureBookAudio.js';
import { useInterstitialAd } from '../adapters/interstitialAd.js';
import { Modal } from './Modal.js';

export function PictureBookAudio({ id, text }: { id: string; text: string }) {
  const audio = usePictureBookAudio(id, text, import.meta.env.VITE_PICTURE_BOOK_AUDIO_BASE_URL?.trim() || 'https://crossword-content-audio.minotree0902.workers.dev/picture-book-audio/');
  const ad = useInterstitialAd();
  const [choosing, setChoosing] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const mounted = useRef(true);
  const busy = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const active = audio.status === 'loading' || audio.status === 'playing' || audio.status === 'gap';
  const continuous = async () => {
    if (busy.current) return;
    if (active) { void audio.play(); return; }
    busy.current = true; setAdvertising(true);
    try { await ad.show(); if (mounted.current) setChoosing(true); }
    finally { busy.current = false; if (mounted.current) setAdvertising(false); }
  };
  return <div className="picture-book-audio-controls" role="group" aria-label="그림책 영어 듣기">
    <Button size="small" variant="weak" disabled={!audio.configured || advertising} onClick={() => void audio.play()}>{active ? '듣기 중지' : '듣기'}</Button>
    <Button size="small" variant="weak" disabled={advertising} onClick={() => void continuous()}>{advertising ? '광고 확인 중' : active ? '연속듣기 중지' : '연속듣기'}</Button>
    <span className="picture-book-audio-count" role="status">{active ? `${audio.round} / ${audio.repeatCount}회` : ''}</span>
    <span className="picture-book-audio-status" role="status">{!audio.configured ? '음성 업로드 준비 중' : audio.status === 'gap' ? '1초 후 다시 재생' : audio.status === 'loading' ? '음성을 불러오는 중' : audio.status === 'error' ? '음성을 재생하지 못했어요. 다시 눌러 주세요.' : ''}</span>
    {choosing && <Modal title="연속듣기 횟수" onClose={() => setChoosing(false)}>
      <p>현재 페이지를 몇 번 들을까요?</p>
      <div className="reading-actions">{([5, 10] as const).map(count => <Button key={count} disabled={!audio.configured} onClick={() => { setChoosing(false); void audio.play(count); }}>{count}회 듣기</Button>)}</div>
      {!audio.configured && <p role="status">음성 업로드 후 재생할 수 있어요.</p>}
    </Modal>}
  </div>;
}
