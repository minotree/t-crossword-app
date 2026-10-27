import { useState } from 'react';
import { Button } from '@toss/tds-mobile';
import { defaultVocabList, type CrosswordWord } from '@t-crossword/core';
import { AnswerModal } from '../components/AnswerModal.js';

const source = defaultVocabList.find(word => word.word === 'MASS');
if (!source) throw new Error('MASS 미리보기 단어가 없습니다.');
const word: CrosswordWord = {
  ...source, id: 'preview-long-mass', orientation: 'across', number: 9, startRow: 0, startCol: 0,
  hintLimit: 0, hintUsedCount: 0,
  example: Array(6).fill(source.example).join(' '),
};

/** Loaded only by the development entry, never by a release build. */
export function AnswerLayoutPreview() {
  const [open, setOpen] = useState(true);
  const [completed, setCompleted] = useState(false);
  const requestedHeight = Number(new URLSearchParams(window.location.search).get('height'));
  const height = Number.isFinite(requestedHeight) && requestedHeight >= 180 && requestedHeight <= 600 ? requestedHeight : 360;
  return <div className="app-shell">
    <style>{`.answer-modal { max-height: min(85dvh, ${height}px); }`}</style>
    <header className="app-heading"><h1>정답 모달 · 긴 설명 테스트</h1></header>
    <main className="scroll-page">
      <p>긴 뜻·동의어와 반복 예문으로 작은 화면을 재현합니다. 모달 높이는 최대 {height}px입니다.</p>
      <p>설명을 스크롤하며 입력칸과 하단 버튼이 유지되는지 확인해 주세요. 학습 기록은 저장하지 않습니다.</p>
      {completed && <p role="status">정답입니다. 다시 열어 반복해서 확인할 수 있습니다.</p>}
      <Button onClick={() => { setCompleted(false); setOpen(true); }}>다시 열기</Button>
      <Button variant="weak" onClick={() => window.location.assign(window.location.pathname)}>일반 앱으로 돌아가기</Button>
    </main>
    {open && <AnswerModal word={word} onClose={() => setOpen(false)} onSubmit={(_, answer) => {
      if (answer !== word.word) return false;
      setCompleted(true); setOpen(false); return true;
    }} />}
  </div>;
}
