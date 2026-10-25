import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PuzzleCompletionModal } from '../src/components/PuzzleCompletionModal.js';
import { WordInputModal } from '../src/components/WordInputModal.js';

describe('completion without server rewards', () => {
  const render = (isOpen = true) => renderToStaticMarkup(
    <PuzzleCompletionModal isOpen={isOpen} words={[]} onClose={() => {}} onNewGame={() => {}} />,
  );

  it('celebrates and enables the next puzzle without a server reward', () => {
    const markup = render();
    expect(markup).toContain('completion-confetti');
    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain('role="alert"');
    expect(markup).not.toContain('힌트');
    expect(markup).not.toContain('보상');
    expect((markup.match(/<button/g) ?? []).length).toBe(2);
  });

  it('hides the celebration when closed', () => {
    expect(render(false)).toBe('');
  });

  it('keeps the word meaning and answer entry without a letter-reveal button', () => {
    const markup = renderToStaticMarkup(<WordInputModal isOpen word={{
      id: 'sea', word: 'SEA', meaning: '바다', orientation: 'across',
      startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0,
    }} currentLetters={['', 'E', '']} onClose={() => {}} onSubmit={() => true} />);
    expect(markup).toContain('바다');
    expect(markup).toContain('정답입력');
    expect(markup).toContain('readOnly=""');
    expect(markup).not.toContain('힌트');
  });
});
