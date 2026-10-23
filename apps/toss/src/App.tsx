import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button, TextField } from '@toss/tds-mobile';
import {
  defaultVocabList,
  type CrosswordPuzzle, type CrosswordWord, type DifficultyLevel, type GridSize,
} from '@t-crossword/core';
import { createPlatformStorage, subscribeBack } from './adapters/platform.js';
import { createProgressRepository, dismissMistake, recordHintUsed, type Progress } from './adapters/progress.js';
import { AnswerModal } from './components/AnswerModal.js';
import { Modal } from './components/Modal.js';
import { PuzzleBoard } from './components/PuzzleBoard.js';
import { ClueButton } from './components/ClueButton.js';
import { NavigationIcon } from './components/NavigationIcon.js';
import { PictureBooks } from './components/PictureBooks.js';
import { AdBanner } from './components/Ads.js';
import { WordList } from './components/WordList.js';
import { generateDevicePuzzle } from './adapters/puzzleGeneration.js';
import { version } from '../package.json';
import { getCurrentLetters } from './puzzlePresentation.js';
import { runAuthProbe } from './adapters/authProbe.js';
import { createRemoteHintGateway, HintGatewayError, type HintGateway } from './adapters/hintGateway.js';

const levelNames = { beginner: '초급', intermediate: '중급', advanced: '고급' };
type Page = 'home' | 'quiz' | 'words' | 'books' | 'settings';
type WordFilter = 'all' | 'bookmarked' | 'completed' | 'mistakes';

export function App({ hintGateway }: { hintGateway?: HintGateway } = {}) {
  const [gatewayConfig] = useState(() => {
    try {
      const url: string | undefined = import.meta.env.VITE_TOSS_HINT_API_URL;
      return { gateway: hintGateway ?? (url ? createRemoteHintGateway(url) : null), error: '' };
    } catch { return { gateway: null, error: '힌트 서버 주소를 확인해 주세요.' }; }
  });
  const gateway = gatewayConfig.gateway;
  const repository = useMemo(() => createProgressRepository(createPlatformStorage()), []);
  const [progress, setProgress] = useState<Progress | null>(null);
  const progressRef = useRef<Progress | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [page, setPage] = useState<Page>('home');
  const [bookLevel, setBookLevel] = useState<DifficultyLevel>('beginner');
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookPage, setBookPage] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [probePending, setProbePending] = useState(false);
  const [probeMessage, setProbeMessage] = useState('');
  const probeBusy = useRef(false);
  const [level, setLevel] = useState<DifficultyLevel>('beginner');
  const [size, setSize] = useState<GridSize>(10);
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<CrosswordWord | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [filter, setFilter] = useState<WordFilter>('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [hintBalance, setHintBalance] = useState<number | null>(null);
  const [hintError, setHintError] = useState(gatewayConfig.error);
  const [isGameBusy, setIsGameBusy] = useState(false);
  const busy = useRef(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [hintedCells, setHintedCells] = useState<Record<string, string>>({});
  const [hintUsage, setHintUsage] = useState<Record<string, number>>({});
  const [rewardGranted, setRewardGranted] = useState(false);
  const requestIds = useRef(new Map<string, string>());
  const balanceVersion = useRef(0);

  const refreshBalance = useCallback(async () => {
    if (!gateway || busy.current) return;
    const version = balanceVersion.current;
    setHintError('');
    try {
      const balance = await gateway.balance();
      if (balanceVersion.current === version) setHintBalance(balance);
    } catch (error) { setHintError(error instanceof Error ? error.message : '힌트 잔액을 불러오지 못했습니다.'); }
  }, [gateway]);
  useEffect(() => { void refreshBalance(); }, [refreshBalance]);

  useEffect(() => {
    let active = true;
    setLoadError('');
    void repository.load().then((value) => {
      if (active) { progressRef.current = value; setProgress(value); }
    }).catch(() => {
      if (active) setLoadError('학습 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    });
    return () => { active = false; };
  }, [repository, loadAttempt]);

  const back = useCallback(() => {
    if (resetPending || busy.current) return;
    if (confirmReset) setConfirmReset(false);
    else if (page === 'books' && bookId) { setBookId(null); setBookPage(0); }
    else if (selected) setSelected(null);
    else if (showCompletion) setShowCompletion(false);
    else setPage('home');
  }, [selected, showCompletion, resetPending, confirmReset, page, bookId]);

  useEffect(() => {
    if (page === 'home' && !selected && !showCompletion) return;
    return subscribeBack(back, () => { setSaveError('뒤로 가기를 처리하지 못했습니다. 화면의 닫기 버튼을 이용해 주세요.'); });
  }, [page, back, selected, showCompletion]);

  const saveProgress = useCallback((value: Progress) => {
    progressRef.current = value;
    setProgress(value);
    setSaveError('');
    void repository.save(value).catch(() => {
      setSaveError('학습 기록을 저장하지 못했습니다. 앱을 종료하기 전에 다시 저장해 주세요.');
    });
  }, [repository]);

  const toggleBookmark = useCallback((id: string) => {
    const current = progressRef.current;
    if (!current) return;
    const ids = current.bookmarkedWordIds;
    saveProgress({ ...current, bookmarkedWordIds: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id] });
  }, [saveProgress]);
  const dismissWord = useCallback((id: string) => {
    if (progressRef.current) saveProgress(dismissMistake(progressRef.current, id));
  }, [saveProgress]);

  const completedWords = useMemo(() => new Set(progress?.completedWordIds), [progress?.completedWordIds]);
  const bookmarkedWords = useMemo(() => new Set(progress?.bookmarkedWordIds), [progress?.bookmarkedWordIds]);
  const mistakeWords = useMemo(() => {
    const dismissed = new Set(progress?.dismissedMistakeWordIds);
    return new Set(progress?.hintUsedWordIds.filter((id) => !dismissed.has(id)));
  }, [progress?.hintUsedWordIds, progress?.dismissedMistakeWordIds]);
  const search = useDeferredValue(query.trim().toLowerCase());
  const words = useMemo(() => page !== 'words' ? [] : defaultVocabList.filter((word) => {
    if (filter === 'bookmarked' && !bookmarkedWords.has(word.id)) return false;
    if (filter === 'completed' && !completedWords.has(word.id) && !word.isQuizUsed) return false;
    if (filter === 'mistakes' && !mistakeWords.has(word.id)) return false;
    return word.word.toLowerCase().includes(search) || word.meaning.toLowerCase().includes(search);
  }), [page, filter, search, completedWords, bookmarkedWords, mistakeWords]);

  const startPuzzle = async (nextLevel = level, nextSize = size) => {
    if (!progressRef.current || busy.current) return;
    busy.current = true; setIsGameBusy(true); setHintError('');
    try {
    const completed = new Set(progressRef.current.completedWordIds);
    if (gateway) {
      const result = await gateway.startRound(nextLevel, nextSize, [...completed]);
      setPuzzle(result.puzzle); setRoundId(result.roundId); setHintBalance(result.balance); balanceVersion.current++;
    } else {
      setPuzzle(await generateDevicePuzzle(nextLevel, nextSize, [...completed])); setRoundId(null);
    }
    setHintedCells({}); setHintUsage({}); setRewardGranted(false); requestIds.current.clear();
    setSolvedIds([]);
    setLevel(nextLevel); setSize(nextSize);
    setSelected(null);
    setShowCompletion(false);
    setPage('quiz');
    } catch (error) { setHintError(error instanceof Error ? error.message : '퍼즐을 시작하지 못했습니다.'); }
    finally { busy.current = false; setIsGameBusy(false); }
  };

  const openQuiz = () => { if (puzzle) setPage('quiz'); else void startPuzzle(); };

  const resetCompleted = async () => {
    if (!progressRef.current || busy.current) return;
    busy.current = true; setResetPending(true); setSettingsMessage('');
    const next = { ...progressRef.current, completedWordIds: [] };
    try {
      await repository.save(next);
      progressRef.current = next; setProgress(next);
      setPuzzle(null); setRoundId(null); setSolvedIds([]); setSelected(null); setShowCompletion(false);
      setHintedCells({}); setHintUsage({}); setRewardGranted(false); requestIds.current.clear();
      setConfirmReset(false); setSaveError(''); setSettingsMessage('학습 기록을 초기화했습니다.');
    } catch { setSettingsMessage('학습 기록을 저장하지 못했습니다. 기존 기록은 유지됩니다. 다시 시도해 주세요.'); }
    finally { busy.current = false; setResetPending(false); }
  };

  const submitAnswer = async (word: CrosswordWord, answer: string): Promise<boolean> => {
    const current = progressRef.current;
    if (!current || !puzzle || !puzzle.words.some((item) => item.id === word.id) || answer.trim().toUpperCase() !== word.word.toUpperCase()) return false;
    if (busy.current) throw new Error('이전 요청을 처리하고 있습니다. 잠시 후 다시 시도해 주세요.');
    busy.current = true; setIsGameBusy(true);
    try {
    if (gateway && roundId) {
      const result = await gateway.answer(roundId, word.id, answer);
      if (!result.correct) return false;
      setHintBalance(result.balance); balanceVersion.current++;
      if (result.completed) setRewardGranted(true);
    }
    const nextIds = [...new Set([...solvedIds, word.id])];
    setSolvedIds(nextIds);
    const latest = progressRef.current ?? current;
    saveProgress({ ...latest, completedWordIds: [...new Set([...latest.completedWordIds, word.id])] });
    setSelected(null);
    if (nextIds.length === puzzle.words.length) setShowCompletion(true);
    return true;
    } finally { busy.current = false; setIsGameBusy(false); }
  };

  const requestWordHint = async (word: CrosswordWord, index: number) => {
    if (!gateway || !roundId || !puzzle) throw new Error('이 퍼즐은 힌트를 사용할 수 없습니다.');
    if (busy.current) throw new Error('이전 요청을 처리하고 있습니다.');
    if (!navigator.onLine) throw new Error('힌트 사용은 인터넷 연결이 필요합니다.');
    if (getCurrentLetters(puzzle, solvedIds, word, hintedCells)[index]) throw new Error('이미 공개된 칸입니다.');
    busy.current = true; setIsGameBusy(true);
    const key = `${roundId}:${word.id}:${index}`;
    const requestId = requestIds.current.get(key) ?? crypto.randomUUID();
    requestIds.current.set(key, requestId);
    try {
      const result = await gateway.reveal(roundId, word.id, index, requestId);
      if (result.index !== index || result.letter !== word.word[index]?.toUpperCase()) throw new Error('힌트 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
      setHintBalance(result.balance); balanceVersion.current++;
      setHintUsage((previous) => ({ ...previous, [word.id]: result.used }));
      const row = word.startRow + (word.orientation === 'down' ? index : 0);
      const col = word.startCol + (word.orientation === 'across' ? index : 0);
      setHintedCells((previous) => ({ ...previous, [`${row}-${col}`]: result.letter }));
      if (progressRef.current) saveProgress(recordHintUsed(progressRef.current, word.id));
      return result;
    } catch (error) {
      if (error instanceof HintGatewayError && error.code === 'insufficient_hint_balance') { setHintBalance(0); balanceVersion.current++; }
      throw error;
    } finally { busy.current = false; setIsGameBusy(false); }
  };

  if (!progress) return <main className="startup" aria-busy={!loadError}>
    <h1>영어 낱말</h1>
    {loadError ? <><p role="alert" className="error">{loadError}</p><Button onClick={() => setLoadAttempt((value) => value + 1)}>다시 불러오기</Button></> : <p role="status">학습 기록을 불러오고 있어요.</p>}
  </main>;

  return <div className="app-shell">
    <header className="app-heading"><h1>영어 낱말</h1><div className="wallet-heading"><span>{progress.completedWordIds.length}개 학습</span><span className="hint-wallet" aria-label="힌트 잔액"><strong aria-live="polite">💡 {hintBalance === null ? (gateway ? '확인 중' : '연결 필요') : `${hintBalance}개`}</strong></span></div></header>
    {hintError && <div role="alert" className="save-error"><p>{hintError}</p>{gateway && <Button size="small" variant="weak" disabled={isGameBusy} onClick={() => { void refreshBalance(); }}>잔액 다시 확인</Button>}</div>}
    {saveError && <div role="alert" className="save-error"><p>{saveError}</p><Button size="small" variant="weak" onClick={() => { if (progressRef.current) saveProgress(progressRef.current); }}>다시 저장</Button></div>}
    <main className={page === 'home' ? 'scroll-page home-page' : page === 'quiz' ? 'quiz-page' : page === 'words' ? 'words-page' : page === 'books' && !bookId ? 'books-list-page' : 'scroll-page'}>
      {page === 'home' && <>
        <section className="home-welcome" aria-labelledby="welcome-title">
          <p className="home-title">영어 단어 십자낱말 풀이</p>
          <div className="home-body">
          <div className="home-puzzle" aria-hidden="true"><div>{['W', 'O', 'R', '', 'D', '', '', 'S', ''].map((letter, index) => <span key={index} className={letter ? 'letter' : ''}>{letter}</span>)}</div></div>
          <h2 id="welcome-title">영어 단어 십자낱말 풀이에<br />오신 것을 환영합니다!</h2>
          <p className="home-description">단어장에 저장된 단어들로 맞춤형 십자낱말 퍼즐을 즐기고 영어 실력을 키워보세요.</p>
          <div className="home-actions">
            <Button display="block" disabled={isGameBusy} loading={isGameBusy} onClick={openQuiz}><span className="home-action-label"><NavigationIcon name="quiz" /><span>퀴즈 시작</span></span></Button>
            <Button display="block" variant="weak" onClick={() => setPage('words')}><span className="home-action-label"><NavigationIcon name="words" /><span>단어장 보기</span></span></Button>
          </div>
          </div>
        </section>
      </>}

      {page === 'quiz' && puzzle && <>
        <section className="quiz-controls" aria-label="퍼즐 설정">
          <div role="group" aria-label="난이도">{(['beginner', 'intermediate', 'advanced'] as const).map((value) => <Button key={value} size="small" variant={level === value ? 'fill' : 'weak'} aria-pressed={level === value} disabled={isGameBusy} onClick={() => { if (level !== value) void startPuzzle(value, size); }}>{levelNames[value]}</Button>)}</div>
          <div role="group" aria-label="퍼즐 크기">{([8, 10, 12] as const).map((value) => <Button key={value} size="small" variant={size === value ? 'fill' : 'weak'} aria-pressed={size === value} disabled={isGameBusy} onClick={() => { if (size !== value) void startPuzzle(level, value); }}>{value}×{value}</Button>)}</div>
        </section>
        <div className="quiz-summary">
          <p className="completion-reward-guide">🎁 완성하면 힌트 5개를 드려요. {!roundId && <span>(힌트 서버 연결 필요)</span>}</p>
          <div className="quiz-summary-actions">
            <strong aria-label="전체 단어 진행률" aria-live="polite">{solvedIds.length} / {puzzle.words.length}</strong>
            <Button size="small" variant="weak" disabled={isGameBusy} onClick={() => { void startPuzzle(); }}>새 퍼즐</Button>
          </div>
        </div>
        {puzzle.words.length === 0 ? <section className="empty"><h2>학습할 단어를 모두 풀었어요</h2><p>다른 난이도를 선택해 보세요.</p><Button onClick={() => setPage('home')}>난이도 선택</Button></section> : <div className="puzzle-layout">
          <div className="board-area"><PuzzleBoard puzzle={puzzle} solvedIds={solvedIds} hintedCells={hintedCells} /></div>
          <section className="clues" aria-label="퍼즐 힌트">
            <div className="clue-headings">{(['across', 'down'] as const).map((direction) => <h2 key={direction}>
              <span>{direction === 'across' ? '가로 힌트' : '세로 힌트'}</span>
              <span className="clue-progress" aria-live="polite" aria-label={`${direction === 'across' ? '가로' : '세로'} 단어 진행률`}>
                {puzzle.words.filter((word) => word.orientation === direction && solvedIds.includes(word.id)).length} / {puzzle.words.filter((word) => word.orientation === direction).length}
              </span>
            </h2>)}</div>
            <div className="clue-lists" role="region" aria-label="힌트 문제 목록" tabIndex={0}>
            {(['across', 'down'] as const).map((direction) => <div key={direction} className="clue-group">
              {puzzle.words.filter((word) => word.orientation === direction).sort((a, b) => a.number - b.number).map((word) => {
                const solved = solvedIds.includes(word.id);
                return <ClueButton key={word.id} word={word} solved={solved} onSelect={() => setSelected(word)} />;
              })}
            </div>)}
            </div>
          </section>
        </div>}
      </>}

      {page === 'words' && <section className="word-bank">
        <div className="word-bank-heading"><h2>나의 단어장</h2><span className="secondary" aria-live="polite">{words.length}개 단어</span></div>
        <div className="choices word-filters" aria-label="단어장 분류">{([{ key: 'all', label: '전체' }, { key: 'bookmarked', label: '즐겨찾기' }, { key: 'completed', label: '학습완료' }, { key: 'mistakes', label: '오답노트' }] as const).map((item) =>
          <Button key={item.key} size="small" variant={filter === item.key ? 'fill' : 'weak'} aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); setVisibleCount(50); }}>{item.label}</Button>)}</div>
        <TextField variant="box" aria-label="단어 또는 뜻 검색" placeholder="단어 또는 뜻 검색" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(50); }} />
        {filter === 'mistakes' && <p className="secondary">힌트를 사용한 단어를 모아 보는 곳입니다. 삭제해도 단어와 학습 기록은 유지됩니다.</p>}
        <div className="word-list-scroll" role="region" aria-label="단어 목록" tabIndex={0}>
        {words.length === 0 && <p className="empty">{filter === 'mistakes' && !query.trim() ? '아직 오답노트에 등록된 단어가 없습니다.' : '표시할 단어가 없습니다.'}</p>}
        <WordList words={words} visibleCount={visibleCount} completed={completedWords} bookmarked={bookmarkedWords}
          mistakes={filter === 'mistakes'} onBookmark={toggleBookmark} onDismiss={dismissWord} />
        {visibleCount < words.length && <Button display="block" variant="weak" onClick={() => setVisibleCount((value) => value + 50)}>단어 더 보기</Button>}
        </div>
      </section>}
      {page === 'books' && <PictureBooks level={bookLevel} selectedId={bookId} pageIndex={bookPage}
        onLevelChange={(value) => { setBookLevel(value); setBookId(null); setBookPage(0); }}
        onSelect={(id) => { setBookId(id); setBookPage(0); }} onPageChange={setBookPage} />}
      {page === 'settings' && <section className="settings-page">
        <h2>설정</h2>
        <aside className="home-shortcut-guide" aria-label="홈 화면에 추가 안내">
          <p>영어 낱말을 더 가까이 두세요.</p>
          <p>오른쪽 위 <span className="shortcut-more" aria-label="더보기">···</span> 를 누르고<br /><strong>‘휴대폰 홈 화면에 추가’</strong>를 선택해 보세요.</p>
        </aside>
        <h3>데이터 관리</h3>
        {settingsMessage && <p role="status" className="secondary">{settingsMessage}</p>}
        <p>학습 완료 상태만 초기화합니다 (완료: {progress.completedWordIds.length}개)</p>
        <Button display="block" variant="weak" disabled={!progress.completedWordIds.length || isGameBusy} onClick={() => { setSettingsMessage(''); setConfirmReset(true); }}>학습 기록 초기화</Button>
        <h3>앱 정보</h3><p>영어 단어 십자낱말 풀이 v{version}</p>
        {import.meta.env.VITE_TOSS_AUTH_PROBE === 'true' && <>
          <Button display="block" variant="weak" disabled={probePending} loading={probePending} onClick={() => {
            if (probeBusy.current) return;
            probeBusy.current = true;
            setProbePending(true); setProbeMessage('인증 연결을 확인하고 있어요.');
            void runAuthProbe(import.meta.env.VITE_TOSS_HINT_API_URL ?? '').then(() => {
              setProbeMessage('Supabase 무료 인증 연결 성공');
            }).catch(() => {
              setProbeMessage('인증 연결을 확인하지 못했어요. 실제 토스에서 다시 시도해 주세요.');
            }).finally(() => { probeBusy.current = false; setProbePending(false); });
          }}>무료 인증 연결 확인</Button>
          <p role="status">{probeMessage}</p>
        </>}
        <p className="secondary">이 기기에 학습 기록을 저장합니다. 힌트 잔액은 서버에 보관합니다.</p>
      </section>}
    </main>
    <nav className="bottom-navigation" aria-label="하단 메뉴">
      <Button size="medium" variant="weak" aria-current={page === 'home' ? 'page' : undefined} onClick={() => setPage('home')}><span className="navigation-item"><NavigationIcon name="home" />홈</span></Button>
      <Button size="medium" variant="weak" aria-current={page === 'quiz' ? 'page' : undefined} disabled={isGameBusy} onClick={openQuiz}><span className="navigation-item"><NavigationIcon name="quiz" />퀴즈 풀기</span></Button>
      <Button size="medium" variant="weak" aria-current={page === 'words' ? 'page' : undefined} onClick={() => setPage('words')}><span className="navigation-item"><NavigationIcon name="words" />단어장</span></Button>
      <Button size="medium" variant="weak" aria-current={page === 'books' ? 'page' : undefined} onClick={() => setPage('books')}><span className="navigation-item"><NavigationIcon name="books" />그림책</span></Button>
      <Button size="medium" variant="weak" aria-current={page === 'settings' ? 'page' : undefined} onClick={() => setPage('settings')}><span className="navigation-item"><NavigationIcon name="settings" />설정</span></Button>
    </nav>
    <AdBanner enabled />
    <div className="bottom-safe-area" aria-hidden="true" />
    {selected && puzzle && <AnswerModal key={selected.id} word={selected} currentLetters={getCurrentLetters(puzzle, solvedIds, selected, hintedCells)} hintBalance={hintBalance} hintUsedCount={hintUsage[selected.id] ?? 0} onUseHint={gateway && roundId ? (index) => requestWordHint(selected, index) : undefined} onClose={() => setSelected(null)} onSubmit={submitAnswer} />}
    {showCompletion && puzzle && <Modal title="퍼즐 완성! 축하해요" onClose={() => setShowCompletion(false)}>
      <p>{puzzle.words.length}개 단어를 모두 맞혔어요. 단어장에서 다시 복습할 수 있어요.</p>
      {rewardGranted && <p role="status" className="answer-synonym">🎁 완성 보상으로 힌트 5개가 추가되었습니다.</p>}
      <ul className="review">{puzzle.words.map((word) => <li key={word.id}><strong lang="en">{word.word}</strong><span>{word.meaning}</span></li>)}</ul>
      <Button display="block" disabled={isGameBusy} onClick={() => { void startPuzzle(); }}>다음 퍼즐 풀기</Button>
    </Modal>}
    {confirmReset && <Modal title="학습 기록을 초기화할까요?" onClose={() => { if (!resetPending) setConfirmReset(false); }}>
      <p>학습완료 기록 {progress.completedWordIds.length}개를 초기화하고 진행 중 퍼즐을 종료합니다. 초기화한 단어는 다시 출제됩니다.</p>
      <p>즐겨찾기·오답노트·힌트 잔액은 유지됩니다.</p>
      {settingsMessage && <p role="alert" className="error">{settingsMessage}</p>}
      <div className="reading-actions"><Button variant="weak" disabled={resetPending} onClick={() => setConfirmReset(false)}>취소</Button><Button disabled={resetPending} loading={resetPending} onClick={() => { void resetCompleted(); }}>초기화하기</Button></div>
    </Modal>}
  </div>;
}
