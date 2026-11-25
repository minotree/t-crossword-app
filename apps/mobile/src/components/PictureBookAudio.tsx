import { useCallback, useEffect, useRef, useState } from 'react';
import { IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { usePictureBookAudio } from '../adapters/usePictureBookAudio.js';
import { androidInterstitial } from '../adapters/androidInterstitial.js';
import { useAudioOutsideClick } from '../adapters/useAudioOutsideClick.js';

export function PictureBookAudio({ id, text, menuActive = true }: { id: string; text: string; menuActive?: boolean }) {
  const audio = usePictureBookAudio(id, text, import.meta.env.VITE_PICTURE_BOOK_AUDIO_BASE_URL?.trim() || 'https://crossword-content-audio.minotree0902.workers.dev/picture-book-audio/');
  const chant = usePictureBookAudio(id, text, import.meta.env.VITE_PICTURE_BOOK_CHANT_BASE_URL?.trim() || 'https://crossword-content-audio.minotree0902.workers.dev/beginner-chants/');
  const [choosing, setChoosing] = useState(false);
  const [waitingForAd, setWaitingForAd] = useState(false);
  const repeatRequest = useRef<5 | 10 | null>(null);
  const playbackGeneration = useRef(0);
  const activeMenu = useRef(menuActive);
  activeMenu.current = menuActive;
  const cancelPlayback = useCallback(() => {
    playbackGeneration.current++;
    repeatRequest.current = null;
    setWaitingForAd(false); setChoosing(false);
    audio.stopPlayback(); chant.stopPlayback();
  }, [audio.stopPlayback, chant.stopPlayback]);
  useEffect(() => {
    if (!menuActive) cancelPlayback();
    window.addEventListener('pagehide', cancelPlayback);
    return () => {
      cancelPlayback();
      window.removeEventListener('pagehide', cancelPlayback);
    };
  }, [id, text, menuActive, cancelPlayback]);
  const startRepeat = async () => {
    const count = repeatRequest.current;
    repeatRequest.current = null;
    if (count === null || !activeMenu.current) return;
    const attempt = playbackGeneration.current;
    const result = await androidInterstitial.showForPictureBook();
    if (attempt !== playbackGeneration.current || !activeMenu.current) return;
    setWaitingForAd(false);
    if (result !== 'blocked' && !document.hidden) void audio.play(count);
  };
  const active = audio.status === 'loading' || audio.status === 'playing' || audio.status === 'gap';
  const chantActive = chant.status === 'loading' || chant.status === 'playing' || chant.status === 'gap';
  const owner = useAudioOutsideClick(menuActive && (active || chantActive || waitingForAd || choosing), cancelPlayback);
  const hasChant = /^beginner-\d{2}-01$/.test(id);
  return <div className={hasChant ? 'mobile-reading-actions' : 'mobile-reading-actions mobile-reading-actions-no-chant'} role="group" aria-label="그림책 영어 듣기">
    <IonButton data-mobile-audio-control={owner} fill="outline" disabled={!audio.configured || waitingForAd} onClick={() => { chant.stopPlayback(); void audio.play(); }}>{active ? '듣기 중지' : '듣기'}</IonButton>
    <IonButton data-mobile-audio-control={owner} fill="outline" disabled={waitingForAd} onClick={() => { chant.stopPlayback(); if (active) void audio.play(); else setChoosing(true); }}>{active ? '연속듣기 중지' : '연속듣기'}</IonButton>
    {hasChant && <IonButton data-mobile-audio-control={owner} fill="outline" disabled={!chant.configured || waitingForAd} onClick={() => { audio.stopPlayback(); setChoosing(false); void chant.play(); }}>{chantActive ? '챈트 중지' : '챈트 듣기'}</IonButton>}
    {chant.status === 'loading' && <span role="status">챈트를 불러오는 중</span>}
    {chant.status === 'error' && <span role="status">챈트를 재생하지 못했어요. 다시 눌러 주세요.</span>}
    <span role="status">{!audio.configured ? '음성 업로드 준비 중' : audio.status === 'loading' ? '음성을 불러오는 중' : audio.status === 'error' ? '음성을 재생하지 못했어요. 다시 눌러 주세요.' : ''}</span>
    {active && <span role="status">{audio.round} / {audio.repeatCount}회</span>}
    <IonModal isOpen={choosing} onDidDismiss={() => { setChoosing(false); void startRepeat(); }} aria-label="연속듣기 횟수">
      <IonHeader><IonToolbar><IonTitle>연속듣기 횟수</IonTitle><IonButton slot="end" onClick={() => setChoosing(false)}>닫기</IonButton></IonToolbar></IonHeader>
      <IonContent className="ion-padding"><p>현재 페이지를 몇 번 들을까요?</p>
        {([5,10] as const).map(count => <IonButton key={count} data-mobile-audio-control={owner} disabled={!audio.configured || waitingForAd} onClick={() => {
          if (repeatRequest.current !== null || waitingForAd) return;
          repeatRequest.current = count; setWaitingForAd(true); setChoosing(false);
        }}>{count}회 듣기</IonButton>)}
        {!audio.configured && <p>음성 업로드 후 재생할 수 있어요.</p>}
      </IonContent>
    </IonModal>
  </div>;
}
