import { useState } from 'react';
import { IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { usePictureBookAudio } from '../adapters/usePictureBookAudio.js';

export function PictureBookAudio({ id, text }: { id: string; text: string }) {
  const audio = usePictureBookAudio(id, text, import.meta.env.VITE_PICTURE_BOOK_AUDIO_BASE_URL?.trim() || 'https://crossword-content-audio.minotree0902.workers.dev/picture-book-audio/');
  const [choosing, setChoosing] = useState(false);
  const active = audio.status === 'loading' || audio.status === 'playing' || audio.status === 'gap';
  return <div className="mobile-reading-actions" role="group" aria-label="그림책 영어 듣기">
    <IonButton fill="outline" disabled={!audio.configured} onClick={() => void audio.play()}>{active ? '듣기 중지' : '듣기'}</IonButton>
    <IonButton fill="outline" onClick={() => { if (active) void audio.play(); else setChoosing(true); }}>{active ? '연속듣기 중지' : '연속듣기'}</IonButton>
    <span role="status">{!audio.configured ? '음성 업로드 준비 중' : audio.status === 'loading' ? '음성을 불러오는 중' : audio.status === 'error' ? '음성을 재생하지 못했어요. 다시 눌러 주세요.' : ''}</span>
    {active && <span role="status">{audio.round} / {audio.repeatCount}회</span>}
    <IonModal isOpen={choosing} onDidDismiss={() => setChoosing(false)} aria-label="연속듣기 횟수">
      <IonHeader><IonToolbar><IonTitle>연속듣기 횟수</IonTitle><IonButton slot="end" onClick={() => setChoosing(false)}>닫기</IonButton></IonToolbar></IonHeader>
      <IonContent className="ion-padding"><p>현재 페이지를 몇 번 들을까요?</p>
        {([5,10] as const).map(count => <IonButton key={count} disabled={!audio.configured} onClick={() => { setChoosing(false); void audio.play(count); }}>{count}회 듣기</IonButton>)}
        {!audio.configured && <p>음성 업로드 후 재생할 수 있어요.</p>}
      </IonContent>
    </IonModal>
  </div>;
}
