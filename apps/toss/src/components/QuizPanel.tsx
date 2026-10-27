import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { PuzzleBoard } from './PuzzleBoard.js';
import { ClueButton } from './ClueButton.js';
import { Modal } from './Modal.js';

export interface QuizPanelHandle { closeOverlay(): boolean }
export const QuizPanel = forwardRef<QuizPanelHandle, {
  puzzle: CrosswordPuzzle; solvedIds: string[]; hintedCells?: Record<string, string>; onSelectWord(word: CrosswordWord): void;
}>(function QuizPanel({ puzzle, solvedIds, hintedCells = {}, onSelectWord }, ref) {
  const [showHints, setShowHints] = useState(false);
  const [choices, setChoices] = useState<CrosswordWord[]>([]);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeHints = () => { setShowHints(false); openButton.current?.focus(); };
  useEffect(() => { if (showHints) closeButton.current?.focus(); }, [showHints]);
  useImperativeHandle(ref, () => ({ closeOverlay() {
    if (choices.length) { setChoices([]); return true; }
    if (showHints) { closeHints(); return true; }
    return false;
  } }));
  const choose = (word: CrosswordWord) => {
    if (solvedIds.includes(word.id)) return;
    setChoices([]); closeHints(); onSelectWord(word);
  };
  return <div className="puzzle-layout">
    <div className="board-area">
      <PuzzleBoard puzzle={puzzle} solvedIds={solvedIds} hintedCells={hintedCells} onSelectNumber={words => {
        if (words.length === 1) choose(words[0]);
        else if (words.length > 1) setChoices(words);
      }} />
      {showHints && <section id="toss-puzzle-hints" className="clues" aria-label="퍼즐 문제" onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); closeHints(); }
      }}>
        <div className="hint-overlay-heading"><h2>문제 전체 보기</h2><button ref={closeButton} type="button" onClick={closeHints}>닫기</button></div>
        <div className="clue-headings">{(['across', 'down'] as const).map(direction => {
          const words = puzzle.words.filter(word => word.orientation === direction);
          return <h2 key={direction}><span>{direction === 'across' ? '가로 문제' : '세로 문제'}</span><span className="clue-progress">{words.filter(word => solvedIds.includes(word.id)).length} / {words.length}</span></h2>;
        })}</div>
        <div className="clue-lists" role="region" aria-label="문제 목록" tabIndex={0}>
          {(['across', 'down'] as const).map(direction => <div className="clue-group" key={direction}>
            {puzzle.words.filter(word => word.orientation === direction).sort((a, b) => a.number - b.number).map(word =>
              <ClueButton key={word.id} word={word} solved={solvedIds.includes(word.id)} onSelect={() => choose(word)} />)}
          </div>)}
        </div>
      </section>}
    </div>
    <button ref={openButton} type="button" className="all-hints-button" aria-expanded={showHints} aria-controls={showHints ? 'toss-puzzle-hints' : undefined} onClick={() => showHints ? closeHints() : setShowHints(true)}>문제 전체 보기</button>
    {choices.length > 1 && <Modal title={`${choices[0].number}번 문제 선택`} onClose={() => setChoices([])}>
      <div className="direction-choices">{[...choices].sort((a, b) => Number(a.orientation === 'down') - Number(b.orientation === 'down')).map(word => <div key={word.id}>
        <p>{word.orientation === 'across' ? '가로 문제' : '세로 문제'}</p>
        <ClueButton word={word} solved={solvedIds.includes(word.id)} onSelect={() => choose(word)} />
      </div>)}</div>
    </Modal>}
  </div>;
});
