import { useEffect, useRef, useState } from 'react';
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { homeOutline, gameControllerOutline, bookOutline, imageOutline, settingsOutline } from 'ionicons/icons';
import { defaultVocabList, parseCrosswordPuzzle, type CrosswordPuzzle, type CrosswordWord, type DifficultyLevel, type GridSize } from '@t-crossword/core';
import { hideHintedWord, isNotebookWord, readProgress, recordHintedWord, writeProgress, type LearningProgress } from '../adapters/progress.js';
import './mobile.css';
import { PictureBooks } from '../components/PictureBooks.js';
import { AnswerEntry } from '../components/AnswerEntry.js';
import { followAnswerViewport } from '../adapters/answerViewport.js';
import { configuredHintGateway } from '../adapters/hintGateway.js';
import { exitAndroidApp, subscribeAndroidBack } from '../adapters/androidBack.js';
import type { PictureBooksNavigation } from '../components/PictureBooks.js';
import { navigateBack } from '../adapters/backNavigation.js';


const levels: Record<DifficultyLevel, string> = { beginner: '초급', intermediate: '중급', advanced: '고급' };
type Page = 'home' | 'quiz' | 'words' | 'books' | 'settings';
export function HomePage() {
  const [page, setPage] = useState<Page>('home');
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [error, setError] = useState('');
  const [level, setLevel] = useState<DifficultyLevel>('beginner');
  const [size, setSize] = useState<GridSize>(8);
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [selected, setSelected] = useState<CrosswordWord | null>(null);
  const [answerError, setAnswerError] = useState('');
  const [query, setQuery] = useState('');
  const [wordFilter, setWordFilter] = useState<'all' | 'bookmarks' | 'completed' | 'mistakes'>('all');
  const [visibleCount, setVisibleCount] = useState(100);
  const [busy, setBusy] = useState(false);
  const [gateway] = useState(configuredHintGateway);
  const [hintBalance, setHintBalance] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [hinted, setHinted] = useState<Record<string, string>>({});
  const [hintUsed, setHintUsed] = useState<Record<string, number>>({});
  const [rewarded, setRewarded] = useState(false);
  const [answerBusy, setAnswerBusy] = useState(false);
  const hintRequests = useRef(new Map<string, string>());
  const generating = useRef(false);
  const answerPending = useRef(false);
  const draft = useRef<{ signature: string; puzzle: CrosswordPuzzle; requestId: string; completed: string[] } | null>(null);
  const worker = useRef<Worker | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialog = useRef<HTMLDialogElement>(null);
  const bookNavigation = useRef<PictureBooksNavigation>(null);
  const load = () => { try { setProgress(readProgress()); setError(''); } catch { setError('학습 기록을 읽지 못했습니다. 기록을 덮어쓰지 않고 다시 시도해 주세요.'); } };
  useEffect(() => { load(); return () => { worker.current?.terminate(); clearTimeout(timeout.current); }; }, []);
  useEffect(() => {
    let active = true;
    if (gateway) void gateway.balance().then(value => { if (active) setHintBalance(value); }).catch(() => { if (active) setError('힌트 연결을 확인하지 못했습니다. 퀴즈 생성 시 다시 시도합니다.'); });
    return () => { active = false; };
  }, [gateway]);
  useEffect(() => {
    const element = dialog.current;
    if (!selected || !element) return;
    element.showModal();
    const cleanup = followAnswerViewport(element);
    return () => { cleanup(); element.close(); };
  }, [selected]);
  useEffect(() => { setVisibleCount(100); }, [query, wordFilter]);
  const save = (next: LearningProgress) => {
    try { writeProgress(next); setProgress(next); setError(''); return true; }
    catch { setError('기록 저장에 실패했습니다. 다시 시도해 주세요.'); return false; }
  };
  const generate = (nextLevel: DifficultyLevel = level, nextSize: GridSize = size) => {
    if (!progress || busy || generating.current || answerPending.current) return;
    generating.current = true; setBusy(true); setError('');
    const signature = JSON.stringify({ level: nextLevel, size: nextSize, completed: progress.completed });
    const finish = () => { worker.current?.terminate(); worker.current = null; clearTimeout(timeout.current); generating.current = false; setBusy(false); };
    const register = async (pending: NonNullable<typeof draft.current>) => {
      const result = gateway ? await gateway.register(pending.puzzle, pending.completed, pending.requestId) : null;
      setRoundId(result?.roundId ?? null); if (result) setHintBalance(result.balance);
      setPuzzle(pending.puzzle); setLevel(pending.puzzle.level); setSize(pending.puzzle.size); setSolved([]); setSelected(null);
      setHinted({}); setHintUsed({}); setRewarded(false); hintRequests.current.clear(); draft.current = null;
    };
    if (draft.current?.signature === signature) {
      void register(draft.current).catch(() => setError('판 등록에 실패했습니다. 같은 설정으로 다시 시도해 주세요.')).finally(finish);
      return;
    }
    try {
      const task = new Worker(new URL('../adapters/puzzle.worker.ts', import.meta.url), { type: 'module' });
      worker.current = task;
      task.onmessage = async (event: MessageEvent<unknown>) => {
        try {
          const data = event.data;
          if (!data || typeof data !== 'object' || !('puzzle' in data)) throw new Error();
          const next = parseCrosswordPuzzle(data.puzzle);
          if (!next.words.length) throw new Error();
          clearTimeout(timeout.current);
          draft.current = { signature, puzzle: next, requestId: crypto.randomUUID(), completed: [...progress.completed] };
          await register(draft.current);
        } catch { setError('새 문제를 만들지 못했습니다. 난이도나 크기를 바꾸거나 학습 기록을 확인해 주세요.'); }
        finally { finish(); }
      };
      task.onerror = () => { setError('문제 생성에 실패했습니다. 다시 시도해 주세요.'); finish(); };
      timeout.current = setTimeout(() => { setError('문제 생성 시간이 초과되었습니다. 다시 시도해 주세요.'); finish(); }, 30_000);
      task.postMessage({ level: nextLevel, size: nextSize, completed: progress.completed });
    } catch { setError('이 환경에서 문제를 만들 수 없습니다. 앱을 다시 열어 주세요.'); finish(); }
  };
  const openQuiz = () => {
    setPage('quiz');
    if (!puzzle) generate();
  };
  const choose = (word: CrosswordWord) => { if (!solved.includes(word.id)) { setAnswerError(''); setSelected(word); } };
  const close = () => { if (!answerPending.current) { dialog.current?.close(); setSelected(null); } };
  useEffect(() => subscribeAndroidBack(async () => {
    try {
      await navigateBack({ pending: answerPending.current, answerOpen: selected !== null, page }, {
        closeAnswer: () => { dialog.current?.close(); setSelected(null); },
        closeBook: () => bookNavigation.current?.backToList() ?? false,
        goHome: () => setPage('home'),
        exit: exitAndroidApp,
      });
    } catch { setError('뒤로가기를 처리하지 못했습니다. 다시 시도해 주세요.'); }
  }, () => setError('Android 뒤로가기 연결을 처리하지 못했습니다. 앱을 다시 열어 주세요.')), [page, selected]);
  const submit = async (answer: string) => {
    if (!selected || !progress || answerPending.current) return;
    answerPending.current = true; setAnswerBusy(true); setAnswerError('');
    try {
      const result = gateway && roundId ? await gateway.answer(roundId, selected.id, answer) : null;
      if (result) setHintBalance(result.balance);
      if (result ? !result.correct : answer.trim().toUpperCase() !== selected.word) { setAnswerError('정답이 아닙니다. 다시 입력해 주세요.'); return; }
      if (result?.completed) setRewarded(true);
      if (save({ ...progress, completed: [...new Set([...progress.completed, selected.id])] })) { setSolved(previous => [...new Set([...previous, selected.id])]); dialog.current?.close(); setSelected(null); }
    } catch { setAnswerError('정답 확인에 실패했습니다. 다시 제출해 주세요.'); }
    finally { answerPending.current = false; setAnswerBusy(false); }
  };
  const requestHint = async (index: number) => {
    if (!gateway || !roundId || !selected || !progress || answerPending.current) return;
    answerPending.current = true; setAnswerBusy(true); setAnswerError('');
    const key = `${selected.id}:${index}`;
    const requestId = hintRequests.current.get(key) ?? crypto.randomUUID();
    hintRequests.current.set(key, requestId);
    try {
      const value = await gateway.reveal(roundId, selected.id, index, requestId);
      if (value.index !== index) throw new Error('Invalid hint cell');
      const row = selected.startRow + (selected.orientation === 'down' ? index : 0);
      const col = selected.startCol + (selected.orientation === 'across' ? index : 0);
      setHinted(previous => ({ ...previous, [`${row}:${col}`]: value.letter }));
      setHintUsed(previous => ({ ...previous, [selected.id]: value.used })); setHintBalance(value.balance);
      save(recordHintedWord(progress, selected.id));
    } catch { setAnswerError('힌트를 받지 못했습니다. 같은 칸으로 다시 시도해 주세요.'); }
    finally { answerPending.current = false; setAnswerBusy(false); }
  };
  const visibleWords = defaultVocabList.filter(word => (wordFilter === 'all' || (wordFilter === 'bookmarks' && progress?.bookmarks.includes(word.id)) || (wordFilter === 'completed' && progress?.completed.includes(word.id)) || (wordFilter === 'mistakes' && progress && isNotebookWord(progress, word.id))) && `${word.word} ${word.meaning}`.toLowerCase().includes(query.toLowerCase()));
  const complete = puzzle !== null && puzzle.words.length > 0 && solved.length === puzzle.words.length;
  return <IonPage>
    <IonHeader><IonToolbar><IonTitle>영어 낱말</IonTitle><span slot="end" className="mobile-learned">{progress?.completed.length ?? 0}개 학습 <strong className="mobile-hint-balance">💡 {hintBalance === null ? '연결 필요' : `${hintBalance}개`}</strong></span></IonToolbar></IonHeader>
    <IonContent><div className={`mobile-screen mobile-screen-${page}`}>
      {error && <div role="alert" className="mobile-error">{error}{!progress && <IonButton onClick={load}>다시 불러오기</IonButton>}</div>}
      {!progress ? <p>학습 기록을 준비하고 있어요.</p> : <>
        {page === 'home' && <section className="mobile-welcome">
          <p className="mobile-home-title">영어 단어 십자낱말 풀이</p>
          <div className="mobile-home-body">
            <div className="mobile-home-puzzle" aria-hidden="true"><div>{['W', 'O', 'R', '', 'D', '', '', 'S', ''].map((letter, index) => <span key={index} className={letter ? 'letter' : ''}>{letter}</span>)}</div></div>
            <h1>영어 단어 십자낱말 풀이에<br />오신 것을 환영합니다!</h1>
            <p>단어장에 저장된 단어들로 맞춤형 십자낱말 퍼즐을 즐기고 영어 실력을 키워보세요.</p>
            <div className="mobile-home-actions"><IonButton onClick={openQuiz}><IonIcon icon={gameControllerOutline} slot="start" />퀴즈 시작</IonButton><IonButton fill="outline" onClick={() => setPage('words')}><IonIcon icon={bookOutline} slot="start" />단어장 보기</IonButton></div>
          </div>
        </section>}
        {page === 'quiz' && <section className="mobile-quiz">
          <div className="mobile-quiz-heading"><h1>퀴즈 풀기</h1><IonButton size="small" disabled={busy} onClick={() => generate()}>{busy ? '만드는 중…' : puzzle ? '새 퍼즐' : '퍼즐 만들기'}</IonButton></div>
          <div className="mobile-quiz-options">
            <div className="mobile-choice-row" role="group" aria-label="난이도">{(['beginner', 'intermediate', 'advanced'] as const).map(value => <button key={value} disabled={busy} aria-pressed={level === value} onClick={() => { if (value !== level) generate(value, size); }}>{levels[value]}</button>)}</div>
            <div className="mobile-choice-row" role="group" aria-label="퍼즐 크기">{([8, 10, 12] as const).map(value => <button key={value} disabled={busy} aria-pressed={size === value} onClick={() => { if (value !== size) generate(level, value); }}>{value}×{value}</button>)}</div>
          </div>
          {puzzle && <><p>{levels[puzzle.level]} · {puzzle.size}×{puzzle.size} · {solved.length}/{puzzle.words.length}개 완료</p><div className="mobile-puzzle-layout"><div className="mobile-board" style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${puzzle.size}, minmax(0, 1fr))` }} aria-label="십자낱말 보드">{puzzle.grid.flatMap((row, r) => row.map((cell, c) => {
            const words = puzzle.words.filter(word => word.orientation === 'across' ? word.startRow === r && c >= word.startCol && c < word.startCol + word.word.length : word.startCol === c && r >= word.startRow && r < word.startRow + word.word.length);
            const revealed = Boolean(hinted[`${r}:${c}`]) || words.some(word => solved.includes(word.id));
            return cell ? <button key={`${r}-${c}`} className={revealed ? 'solved' : ''} aria-label={`${r + 1}행 ${c + 1}열${revealed ? ` ${cell.letter}` : ''}`} onClick={() => { const word = words.find(item => !solved.includes(item.id)); if (word) choose(word); }}><small>{cell.acrossNumber ?? cell.downNumber}</small>{revealed ? cell.letter : ''}</button> : <span key={`${r}-${c}`} />;
          }))}</div><div className="mobile-clues">{(['across', 'down'] as const).map(direction => {
            const words = puzzle.words.filter(word => word.orientation === direction).sort((a, b) => a.number - b.number);
            return <section key={direction}>
              <header className="mobile-clue-heading"><h2>{direction === 'across' ? '가로 힌트' : '세로 힌트'}</h2><span aria-label={`${direction === 'across' ? '가로' : '세로'} 완료 ${words.filter(word => solved.includes(word.id)).length}개, 전체 ${words.length}개`}>{words.filter(word => solved.includes(word.id)).length} / {words.length}</span></header>
              <div>{words.map(word => <button disabled={solved.includes(word.id)} key={word.id} onClick={() => choose(word)}>
                <span className="mobile-clue-line"><span>{solved.includes(word.id) ? '✓ ' : ''}{word.number}. {word.meaning}</span><small>{word.word.length}자</small></span>
                {word.synonym?.trim() && <span className="mobile-clue-synonym">동의어: {word.synonym}</span>}
              </button>)}</div>
            </section>;
          })}</div></div>{complete && <p role="status">모든 낱말을 완성했어요! {rewarded ? '완성 보상으로 힌트 5개가 추가되었습니다.' : '단어장에서 다시 복습해 보세요.'}</p>}</>}
        </section>}
        {page === 'words' && <section className="mobile-word-page">
          <header className="mobile-word-heading"><h1>나의 단어장</h1><span>{visibleWords.length}개 단어</span></header>
          <div className="mobile-word-filters" role="group" aria-label="단어장 분류">{(['all', 'bookmarks', 'completed', 'mistakes'] as const).map(value => <button key={value} aria-pressed={wordFilter === value} onClick={() => setWordFilter(value)}>{({ all: '전체', bookmarks: '즐겨찾기', completed: '학습완료', mistakes: '오답노트' })[value]}</button>)}</div>
          <label className="mobile-word-search"><span className="mobile-sr-only">단어 또는 뜻 검색</span><input type="search" placeholder="단어 또는 뜻 검색" value={query} onChange={event => setQuery(event.target.value)} /></label>
          {wordFilter === 'mistakes' && <p className="mobile-notebook-guide">삭제하면 이 목록에서만 숨겨집니다. 같은 단어에 힌트를 다시 사용하면 돌아옵니다.</p>}
          <ul className="mobile-words">{visibleWords.slice(0, visibleCount).map(word => <li key={word.id}>
            <div className="mobile-word-body"><strong>{word.word}</strong><span className="mobile-word-meta">{levels[word.level]} · {word.partOfSpeech}{progress.completed.includes(word.id) ? ' · 학습 완료' : ''}</span><p>{word.meaning}</p>{word.synonym?.trim() && <p className="mobile-word-synonym">동의어: {word.synonym}</p>}<p className="mobile-word-example" lang="en">{word.example}</p><p className="mobile-word-example">{word.exampleMeaning}</p></div>
            <button aria-label={`${word.word} 즐겨찾기`} aria-pressed={progress.bookmarks.includes(word.id)} onClick={() => save({ ...progress, bookmarks: progress.bookmarks.includes(word.id) ? progress.bookmarks.filter(id => id !== word.id) : [...progress.bookmarks, word.id] })}>{progress.bookmarks.includes(word.id) ? '★' : '☆'}</button>
            {wordFilter === 'mistakes' && <button aria-label={`${word.word} 오답노트에서 삭제`} onClick={() => save(hideHintedWord(progress, word.id))}>삭제</button>}
          </li>)}</ul>
          {visibleCount < visibleWords.length && <IonButton expand="block" onClick={() => setVisibleCount(value => value + 100)}>더 보기</IonButton>}
          {!visibleWords.length && <p>{wordFilter === 'mistakes' && !query.trim() ? '아직 오답노트에 등록된 단어가 없습니다.' : '표시할 단어가 없습니다.'}</p>}
        </section>}
        <div className="mobile-book-host" hidden={page !== 'books'}><PictureBooks ref={bookNavigation} /></div>
        {page === 'settings' && <section><h1>설정</h1><h2>학습 기록</h2><p>학습 완료 {progress.completed.length}개 · 즐겨찾기 {progress.bookmarks.length}개</p><p>기록은 현재 기기에 저장됩니다. 앱 데이터 삭제·재설치 시 사라질 수 있습니다.</p></section>}
      </>}
    </div></IonContent>
    <IonFooter><IonToolbar><nav className="mobile-nav" aria-label="하단 메뉴">{(['home', 'quiz', 'words', 'books', 'settings'] as const).map(value => <button key={value} aria-current={page === value ? 'page' : undefined} onClick={() => { if (value === 'quiz') openQuiz(); else setPage(value); }}><IonIcon aria-hidden="true" icon={({ home: homeOutline, quiz: gameControllerOutline, words: bookOutline, books: imageOutline, settings: settingsOutline })[value]} /><span>{({ home: '홈', quiz: '퀴즈 풀기', words: '단어장', books: '그림책', settings: '설정' })[value]}</span></button>)}</nav><aside className="mobile-ad-preview" aria-label="가상 배너 광고 영역"><span>광고 영역</span></aside></IonToolbar></IonFooter>
    <dialog ref={dialog} className="mobile-answer" onCancel={event => { event.preventDefault(); close(); }}>{selected && puzzle && <AnswerEntry key={selected.id} word={selected} known={Array.from(selected.word, (_, index) => {
      const row = selected.startRow + (selected.orientation === 'down' ? index : 0);
      const col = selected.startCol + (selected.orientation === 'across' ? index : 0);
      const crossingSolved = puzzle.words.some(word => solved.includes(word.id) && (word.orientation === 'across' ? word.startRow === row && col >= word.startCol && col < word.startCol + word.word.length : word.startCol === col && row >= word.startRow && row < word.startRow + word.word.length));
      return hinted[`${row}:${col}`] || (crossingSolved ? selected.word[index] : '');
    })} error={answerError || error} busy={answerBusy} hintBalance={hintBalance} hintUsed={hintUsed[selected.id] ?? 0} onUseHint={gateway && roundId ? requestHint : undefined} onSubmit={submit} onClose={close} />}</dialog>
  </IonPage>;
}
