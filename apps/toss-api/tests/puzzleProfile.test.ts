import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { expect, it, vi } from 'vitest';
import { defaultVocabList, parseCrosswordPuzzle } from '@t-crossword/core';
import { createHintHandler } from '../src/handler.js';

// Opt in: hardware-dependent measurements are evidence, never CI timing assertions.
it.skipIf(process.env.TOSS_PROFILE !== '1')('profiles local round CPU across levels, sizes and completed vocabulary', async () => {
  const rows: { level: string; size: number; completion: string; sample: number; cpuMs: number; wallMs: number; words: number }[] = [];
  let seed = 1;
  let burst: { requests: number; cpuMs: number; wallMs: number } | undefined;
  const random = vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
  try {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      for (const size of [8, 10, 12] as const) {
        for (const completion of ['none', 'half', 'almost-all', 'all'] as const) {
          const completedWordIds = defaultVocabList.filter((_, index) => completion === 'all' ||
            (completion === 'half' && index % 2 === 0) ||
            (completion === 'almost-all' && index >= 2)).map((word) => word.id);
          const repository = { findRoundCreation: vi.fn(), saveRoundCreation: vi.fn(), balance: async () => 10, startRound: vi.fn().mockResolvedValue(10), openSession: vi.fn(), reveal: vi.fn(), answer: vi.fn() };
          const handler = createHintHandler({ repository, exchangeCode: vi.fn(), allowedOrigins: [] });
          for (let sample = 0; sample < 3; sample += 1) {
            seed = sample + 1;
            const request = new Request('https://local.example/round', { method: 'POST',
              headers: { Authorization: `Bearer ${'t'.repeat(43)}` }, body: JSON.stringify({ level, size, completedWordIds }) });
            const cpu = process.cpuUsage();
            const start = performance.now();
            const response = await handler(request);
            const text = await response.text();
            const wallMs = performance.now() - start;
            const elapsed = process.cpuUsage(cpu);
            expect(response.status).toBe(200);
            const value = JSON.parse(text);
            const puzzle = parseCrosswordPuzzle(value.puzzle);
            expect(puzzle.size).toBe(size);
            expect(puzzle.level).toBe(level);
            expect(puzzle.words.every((word) => !completedWordIds.includes(word.id))).toBe(true);
            if (completion === 'all') expect(value.roundId).toBeNull();
            rows.push({ level, size, completion, sample, cpuMs: (elapsed.user + elapsed.system) / 1000, wallMs, words: puzzle.words.length });
          }
        }
      }
    }
    const repository = { findRoundCreation: vi.fn(), saveRoundCreation: vi.fn(), balance: async () => 10, startRound: vi.fn().mockResolvedValue(10), openSession: vi.fn(), reveal: vi.fn(), answer: vi.fn() };
    const handler = createHintHandler({ repository, exchangeCode: vi.fn(), allowedOrigins: [] });
    seed = 1;
    const cpu = process.cpuUsage();
    const start = performance.now();
    const responses = await Promise.all(Array.from({ length: 6 }, async () => {
      const response = await handler(new Request('https://local.example/round', { method: 'POST',
        headers: { Authorization: `Bearer ${'t'.repeat(43)}` },
        body: JSON.stringify({ level: 'advanced', size: 12, completedWordIds: [] }) }));
      const value = await response.json();
      expect(response.status).toBe(200);
      expect(parseCrosswordPuzzle(value.puzzle).words.length).toBeGreaterThan(0);
      return response;
    }));
    const wallMs = performance.now() - start;
    const elapsed = process.cpuUsage(cpu);
    burst = { requests: responses.length, cpuMs: (elapsed.user + elapsed.system) / 1000, wallMs };
  } finally { random.mockRestore(); }
  const report = { runtime: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model,
    scope: 'Local Node handler; DB mocked; includes body parsing, generation and serialization; excludes startup, mTLS, real DB and Edge runtime. Seeds 1,2,3 per scenario. Burst is a single JS worker, not parallel CPU execution.', rows, burst };
  const directory = new URL('../../../tmp/', import.meta.url);
  mkdirSync(directory, { recursive: true });
  writeFileSync(new URL('toss-puzzle-profile.json', directory), JSON.stringify(report, null, 2) + '\n');
  console.info(`Local round profile: ${rows.length} samples; max CPU ${Math.max(...rows.map((row) => row.cpuMs)).toFixed(1)}ms; max wall ${Math.max(...rows.map((row) => row.wallMs)).toFixed(1)}ms. Report: tmp/toss-puzzle-profile.json`);
}, 120_000);
