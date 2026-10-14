import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCrossword } from './crosswordGenerator.js';
import { WordBankService } from '../services/wordBankService.js';
import vocab from '../assets/vocab.json';
import type { CrosswordPuzzle, DifficultyLevel, GridSize, WordItem } from '../types/index.js';

function item(word: string, id = word): WordItem {
  return { id, word, level: 'beginner', meaning: word, partOfSpeech: 'noun', example: '', exampleMeaning: '', isQuizUsed: false };
}

function verifyPuzzle(puzzle: CrosswordPuzzle): void {
  const starts = puzzle.grid.flat().filter((cell) => cell?.isStartOfAcross || cell?.isStartOfDown);
  expect(starts.map((cell) => cell?.acrossNumber ?? cell?.downNumber)).toEqual(
    Array.from({ length: starts.length }, (_, i) => i + 1)
  );
  const owners = new Map<string, typeof puzzle.words>();
  for (const word of puzzle.words) {
    const start = puzzle.grid[word.startRow][word.startCol];
    expect(word.number).toBe(word.orientation === 'across' ? start?.acrossNumber : start?.downNumber);
    const dr = word.orientation === 'down' ? 1 : 0;
    const dc = word.orientation === 'across' ? 1 : 0;
    expect(puzzle.grid[word.startRow - dr]?.[word.startCol - dc] ?? null).toBeNull();
    expect(puzzle.grid[word.startRow + dr * word.word.length]?.[word.startCol + dc * word.word.length] ?? null).toBeNull();
    for (let i = 0; i < word.word.length; i++) {
      const row = word.startRow + dr * i;
      const col = word.startCol + dc * i;
      expect(puzzle.grid[row][col]?.letter).toBe(word.word[i]);
      const key = `${row},${col}`;
      owners.set(key, [...(owners.get(key) ?? []), word]);
    }
  }
  for (const row of puzzle.grid) {
    for (const cell of row) {
      if (!cell) continue;
      const atCell = owners.get(`${cell.row},${cell.col}`) ?? [];
      expect(atCell.length).toBeGreaterThan(0);
      expect(new Set(atCell.map((word) => word.orientation)).size).toBe(atCell.length);
      expect(cell.acrossNumber !== undefined).toBe(atCell.some((word) => word.orientation === 'across' && word.startRow === cell.row && word.startCol === cell.col));
      expect(cell.downNumber !== undefined).toBe(atCell.some((word) => word.orientation === 'down' && word.startRow === cell.row && word.startCol === cell.col));
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const neighbor = puzzle.grid[cell.row + dr]?.[cell.col + dc];
        if (neighbor) {
          const neighborOwners = owners.get(`${neighbor.row},${neighbor.col}`) ?? [];
          expect(atCell.some((word) => neighborOwners.includes(word))).toBe(true);
        }
      }
    }
  }
  // Every word must be reachable through actual crossings from the first word.
  const connected = new Set(puzzle.words.slice(0, 1));
  for (let i = 0; i < puzzle.words.length; i++) {
    for (const group of owners.values()) {
      if (group.some((word) => connected.has(word))) group.forEach((word) => connected.add(word));
    }
  }
  expect(connected.size).toBe(puzzle.words.length);
}

describe('generateCrossword', () => {
  afterEach(() => vi.restoreAllMocks());
  it('excludes a solved word from subsequent puzzles', () => {
    const input = [item('cat'), item('cow')];
    const bank = new WordBankService(input.map((word) => ({ ...word })));
    expect(generateCrossword(bank.getAllWords(), 'beginner', 8).words).toHaveLength(2);
    bank.markWordAsUsed('cat');
    expect(bank.getAllWords().find((word) => word.id === 'cat')?.isQuizUsed).toBe(true);
    expect(generateCrossword(bank.getAllWords(), 'advanced', 10).words.map((word) => word.id)).toEqual(['cow']);
    expect(input.every((word) => word.isQuizUsed === false)).toBe(true);
  });
  it('only includes explicit false quiz flags and never changes usage state', () => {
    const entries = [
      { ...item('cat', 'used'), isQuizUsed: true },
      { ...item('cat', 'missing'), isQuizUsed: undefined },
      item('cat', 'unused'), item('cow'),
    ];
    const before = structuredClone(entries);
    const puzzle = generateCrossword(entries, 'advanced', 10);
    expect(puzzle.words.map((word) => word.id).sort()).toEqual(['cow', 'unused']);
    expect(entries).toEqual(before);
  });
  it('keeps crossing starts and only numbers start squares', () => {
    const puzzle = generateCrossword([item('cat'), item('cow')], 'beginner', 8);
    expect(puzzle.words.length).toBe(2);
    expect(puzzle.words.some((word) => word.orientation === 'down')).toBe(true);
    expect(puzzle.grid.flat().some((cell) => cell?.isStartOfAcross && cell.isStartOfDown)).toBe(true);
    verifyPuzzle(puzzle);
  });

  it('rejects disconnected, duplicate and invalid entries without changing input', () => {
    const input = [item('cat'), item('xyz'), item('cat', 'duplicate'), item('ice cream'), item('ab'), item('dog', 'cat')];
    const before = structuredClone(input);
    const puzzle = generateCrossword(input, 'beginner', 8);
    expect(puzzle.words.map((word) => word.word)).toEqual(['CAT']);
    expect(input).toEqual(before);
    verifyPuzzle(puzzle);
  });

  it('returns an empty grid when there are no eligible words', () => {
    const puzzle = generateCrossword([{ ...item('cat'), level: 'advanced' }], 'beginner', 10);
    expect(puzzle.words).toEqual([]);
    expect(puzzle.grid.flat().every((cell) => cell === null)).toBe(true);
  });

  for (const level of ['beginner', 'intermediate', 'advanced'] satisfies DifficultyLevel[]) {
    it(`includes lower levels when selecting ${level}`, () => {
      const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
      // Run each source level separately to prove eligibility independently of placement.
      for (const entryLevel of levels) {
        const entries = ['cat', 'cow'].map((word) => ({ ...item(word), level: entryLevel }));
        const puzzle = generateCrossword(entries, level, 10);
        expect(puzzle.words.length).toBe(levels.indexOf(entryLevel) <= levels.indexOf(level) ? 2 : 0);
      }
      const mixed = (['beginner', 'intermediate', 'advanced'] satisfies DifficultyLevel[])
        .flatMap((entryLevel) => ['cat', 'cow'].map((word) => ({
          ...item(word, `${entryLevel}-${word}`), level: entryLevel,
        })));
      const puzzle = generateCrossword(mixed, level, 10);
      expect(puzzle.level).toBe(level);
      expect(puzzle.words.map((word) => word.id).sort()).toEqual([
        'beginner-cat', 'beginner-cow',
      ]);
    });

    for (const size of [8, 10, 12] satisfies GridSize[]) {
      it(`builds a valid ${level} ${size}x${size} puzzle from bundled vocabulary`, () => {
        for (const seed of [1, 42, 2026]) {
          let state = seed;
          vi.spyOn(Math, 'random').mockImplementation(() => {
            state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
            return state / 4294967296;
          });
          const puzzle = generateCrossword(vocab as WordItem[], level, size);
          expect(puzzle.level).toBe(level);
          for (const word of puzzle.words) {
            const source = vocab.find((entry) => entry.id === word.id);
            expect(['beginner', 'intermediate', 'advanced'].indexOf(source?.level ?? '')).toBeLessThanOrEqual(
              ['beginner', 'intermediate', 'advanced'].indexOf(level)
            );
            expect(source?.isQuizUsed).toBe(false);
            expect(source?.word.trim().toUpperCase()).toBe(word.word);
          }
          expect(puzzle.words.length).toBeGreaterThanOrEqual(size);
          expect(puzzle.words.filter((word) => word.orientation === 'down').length).toBeGreaterThanOrEqual(3);
          expect(puzzle.words.filter((word) => word.orientation === 'across').length).toBeGreaterThanOrEqual(3);
          expect(puzzle.grid.flat().some((cell) => cell === null)).toBe(true);
          verifyPuzzle(puzzle);
          vi.restoreAllMocks();
        }
      });
    }
  }
});
