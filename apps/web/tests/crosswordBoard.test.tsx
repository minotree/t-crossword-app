import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CrosswordPuzzle, CrosswordWord } from '@t-crossword/core';
import { CrosswordBoard } from '../src/components/CrosswordBoard.js';

const across: CrosswordWord = {
  id: 'across', word: 'SAD', meaning: '슬픈', orientation: 'across',
  startRow: 0, startCol: 0, number: 16, hintLimit: 3, hintUsedCount: 0,
};
const down: CrosswordWord = { ...across, id: 'down', word: 'SUN', meaning: '해', orientation: 'down' };

function renderNumber(solvedWordIds: string[], words = [across, down]) {
  const puzzle: CrosswordPuzzle = {
    size: 8, level: 'beginner', words,
    grid: [[{ row: 0, col: 0, letter: 'S', acrossNumber: 16, downNumber: 16 }]],
  };
  return renderToStaticMarkup(<CrosswordBoard puzzle={puzzle} userGrid={[]}
    selectedWord={null} solvedWordIds={solvedWordIds} onSelectWord={() => {}} />);
}

describe('grid number availability', () => {
  it('offers both directions only while both starting words are unsolved', () => {
    expect(renderNumber([])).toContain('aria-label="16번 가로·세로 문제 선택"');
  });

  it.each([
    [['across'], '세로'],
    [['down'], '가로'],
  ] as const)('offers the remaining direction after solving %s', (solved, direction) => {
    const markup = renderNumber([...solved]);
    expect(markup).toContain(`aria-label="16번 ${direction} 정답 입력"`);
    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain('가로·세로 문제 선택');
  });

  it('disables the number when both directions are solved', () => {
    expect(renderNumber(['across', 'down'])).toContain('disabled="" aria-label="16번 정답 입력 완료"');
  });

  it('disables a solved single-direction number', () => {
    expect(renderNumber(['across'], [across])).toContain('disabled="" aria-label="16번 정답 입력 완료"');
  });
});
