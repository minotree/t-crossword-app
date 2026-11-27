// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { LearningEncouragement } from '@t-crossword/ui';
import { selectLearningEncouragement } from '@t-crossword/core/encouragement';
import { useCrosswordGame } from '../src/hooks/useCrosswordGame.js';
import { QuizPage } from '../src/pages/QuizPage.js';

const generate = vi.hoisted(() => vi.fn());
vi.mock('@t-crossword/core', async original => ({ ...await original<typeof import('@t-crossword/core')>(), generateCrossword: generate }));
vi.mock('../src/components/CrosswordBoard.js', () => ({ CrosswordBoard: () => <div data-test-board /> }));

const puzzle = { size: 8, level: 'beginner', words: [{ id: 'bear', word: 'BEAR', meaning: '곰', orientation: 'across', startRow: 0, startCol: 0, number: 1 }], grid: [] };
afterEach(() => { vi.restoreAllMocks(); generate.mockReset(); });

it('advances only after a nonempty successful generation, resets translation and preserves state on rerenders/failures', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  generate.mockReturnValue(puzzle);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  let game: ReturnType<typeof useCrosswordGame> | undefined;
  function Harness() {
    game = useCrosswordGame({});
    const phrase = selectLearningEncouragement(game.puzzleVersion);
    return phrase && <LearningEncouragement key={game.puzzleVersion} phrase={phrase} audioControl={null} />;
  }
  const current = () => { if (!game) throw new Error('Game not mounted'); return game; };
  try {
    await act(async () => root.render(<Harness />));
    expect(current().puzzleVersion).toBe(1);
    const firstColor = host.querySelector('aside')?.style.color;
    expect(host.querySelector('[lang="en"]')?.textContent).toBe(selectLearningEncouragement(1)?.english);
    await act(async () => host.querySelector('button')?.click());
    expect(host.querySelector('[lang="ko"]')?.hasAttribute('hidden')).toBe(false);
    await act(async () => root.render(<Harness />));
    expect(current().puzzleVersion).toBe(1);
    expect(host.querySelector('aside')?.style.color).toBe(firstColor);
    expect(host.querySelector('[lang="ko"]')?.hasAttribute('hidden')).toBe(false);
    generate.mockImplementationOnce(() => { throw new Error('generation failed'); });
    await act(async () => { expect(() => current().startNewGame()).toThrow('generation failed'); });
    expect(current().puzzleVersion).toBe(1);
    expect(host.querySelector('[lang="ko"]')?.hasAttribute('hidden')).toBe(false);
    await act(async () => current().startNewGame());
    expect(current().puzzleVersion).toBe(2);
    expect(host.querySelector('[lang="en"]')?.textContent).toBe(selectLearningEncouragement(2)?.english);
    expect(host.querySelector('[lang="ko"]')?.hasAttribute('hidden')).toBe(true);
    generate.mockReturnValueOnce({ ...puzzle, words: [] });
    await act(async () => current().startNewGame());
    expect(current().puzzleVersion).toBe(2);
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it('places the phrase immediately below the all-clues button inside the existing scrolling main', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  generate.mockReturnValue(puzzle);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<QuizPage />));
    const hints = [...host.querySelectorAll('button')].find(button => button.textContent?.trim() === '문제 전체 보기');
    expect(hints?.nextElementSibling?.querySelector('[aria-label="학습 응원 문구"]')).not.toBeNull();
    expect(hints?.closest('main')?.className).toContain('overflow-y-auto');
    expect(host.querySelector('button[aria-label="응원 문구 영어 듣기"]')).not.toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); }
});
