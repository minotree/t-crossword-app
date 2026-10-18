import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { defaultVocabList, generateCrossword } from '@t-crossword/core';
import { PuzzleBoard } from '../src/components/PuzzleBoard.js';
import { AnswerModal } from '../src/components/AnswerModal.js';
import { ClueButton } from '../src/components/ClueButton.js';

describe('Toss crossword UI', () => {
  it.each(['across', 'down'] as const)('shows synonyms for %s clues and omits empty synonyms', (orientation) => {
    const word = { id: 'sea', word: 'SEA', meaning: '바다', synonym: 'ocean', orientation,
      startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0 };
    const render = (synonym: string) => renderToStaticMarkup(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><ClueButton word={{ ...word, synonym }} solved={false} onSelect={() => {}} /></TDSMobileAITProvider>);
    expect(render('ocean')).toContain('동의어: ocean');
    expect(render('ocean')).toContain('class="clue-synonym"');
    expect(render('  ')).not.toContain('동의어:');
    expect(render('')).not.toContain('clue-synonym');
  });

  it('keeps answers hidden and reveals all cells of a solved word', () => {
    const puzzle = generateCrossword(defaultVocabList, 'beginner', 8);
    const word = puzzle.words[0];
    expect(word).toBeDefined();
    const hidden = renderToStaticMarkup(<PuzzleBoard puzzle={puzzle} solvedIds={[]} />);
    expect(hidden).not.toMatch(/<span>[A-Za-z]<\/span>/);
    const solved = renderToStaticMarkup(<PuzzleBoard puzzle={puzzle} solvedIds={[word.id]} />);
    expect((solved.match(/cell  solved/g) ?? []).length).toBe(word.word.length);
    expect(solved).toContain(`1/${puzzle.words.length}개 완료`);
  });

  it('masks the answer in the input example', () => {
    const word = { id: 'sea', word: 'SEA', meaning: '바다', example: 'The sea is calm.', orientation: 'across' as const,
      startRow: 0, startCol: 0, number: 1, hintLimit: 1, hintUsedCount: 0 };
    const html = renderToStaticMarkup(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><AnswerModal word={word} onClose={() => {}} onSubmit={() => false} /></TDSMobileAITProvider>);
    expect(html).toContain('The ___ is calm.');
    expect(html).not.toContain('The sea is calm.');
    expect(html).toContain('aria-label="3자 중 1번째 글자"');
  });
});
