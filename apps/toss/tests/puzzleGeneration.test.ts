import { afterEach, expect, it, vi } from 'vitest';
import { defaultVocabList, generateCrossword, vocabularyForProgress } from '@t-crossword/core';
import { generateDevicePuzzle } from '../src/adapters/puzzleGeneration.js';

it('passes visible notebook exceptions through the main-thread generation path', async () => {
  vi.stubGlobal('Worker', undefined);
  const word = defaultVocabList.find(word => word.level === 'beginner' && word.word.length <= 8);
  if (!word) throw new Error('Missing fixture');
  const completed = defaultVocabList.map(word => word.id);
  expect((await generateDevicePuzzle('beginner', 8, completed, [word.id])).words.map(word => word.id)).toEqual([word.id]);
  expect((await generateDevicePuzzle('beginner', 8, completed, [word.id], [word.id])).words).toEqual([]);
});

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it('generates in the Worker from supplied vocabulary while preserving notebook eligibility', async () => {
  const workerScope = { onmessage: undefined as undefined | ((event: { data: unknown }) => void), postMessage: vi.fn() };
  vi.stubGlobal('self', workerScope);
  await import('../src/workers/puzzle.worker.js');
  const word = defaultVocabList.find(word => word.level === 'beginner' && word.word.length <= 8);
  if (!word) throw new Error('Missing fixture');
  const completed = defaultVocabList.map(word => word.id);
  const vocabulary = vocabularyForProgress(defaultVocabList, completed, [word.id]);
  workerScope.onmessage?.({ data: { level: 'beginner', size: 8, vocabulary } });
  expect(workerScope.postMessage).toHaveBeenLastCalledWith(generateCrossword(vocabulary, 'beginner', 8));
  expect(workerScope.postMessage.mock.calls[0][0].words.map((entry: { id: string }) => entry.id)).toEqual([word.id]);
  workerScope.onmessage?.({ data: { level: 'beginner', size: 8, vocabulary: vocabularyForProgress(defaultVocabList, completed, [word.id], [word.id]) } });
  expect(workerScope.postMessage.mock.calls[1][0].words).toEqual([]);
});

function workerFixture() {
  vi.useFakeTimers();
  vi.stubGlobal('window', globalThis);
  const worker = { postMessage: vi.fn(), terminate: vi.fn(), onmessage: undefined as undefined | ((event: { data: unknown }) => void),
    onerror: undefined as undefined | ((event: { preventDefault(): void }) => void), onmessageerror: undefined as undefined | (() => void) };
  const constructor = vi.fn(function (_url: URL, _options: WorkerOptions) { return worker; });
  vi.stubGlobal('Worker', constructor);
  return { worker, constructor };
}

it('runs the common engine locally without Worker and honors completed words', async () => {
  vi.stubGlobal('Worker', undefined);
  const puzzle = await generateDevicePuzzle('beginner', 8, defaultVocabList.map(word => word.id));
  expect(puzzle.words).toEqual([]);
});

it('sends generation preferences to a module Worker and releases it after a valid result', async () => {
  const { worker, constructor } = workerFixture();
  const pending = generateDevicePuzzle('beginner', 8, ['completed'], ['mistake'], ['hidden']);
  expect(constructor.mock.calls[0][1]).toEqual({ type: 'module' });
  expect(worker.postMessage).toHaveBeenCalledWith({ level: 'beginner', size: 8, vocabulary: vocabularyForProgress(defaultVocabList, ['completed'], ['mistake'], ['hidden']) });
  const puzzle = generateCrossword([], 'beginner', 8);
  worker.onmessage?.({ data: puzzle });
  expect(await pending).toEqual(puzzle);
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it('reports a readable error if the runtime refuses to create a Worker', async () => {
  const { constructor } = workerFixture();
  constructor.mockImplementation(() => { throw new Error('runtime refusal'); });
  await expect(generateDevicePuzzle('beginner', 8, [])).rejects.toThrow('퍼즐 생성 기능을 시작하지 못했습니다.');
  expect(vi.getTimerCount()).toBe(0);
});

it.each(['invalid', 'error', 'messageerror', 'timeout', 'senderror'])('rejects Worker %s instead of silently starting another puzzle', async (failure) => {
  const { worker } = workerFixture();
  if (failure === 'senderror') worker.postMessage.mockImplementation(() => { throw new Error('send failed'); });
  const pending = generateDevicePuzzle('beginner', 8, []);
  const rejected = expect(pending).rejects.toThrow();
  if (failure === 'invalid') worker.onmessage?.({ data: {} });
  if (failure === 'error') worker.onerror?.({ preventDefault() {} });
  if (failure === 'messageerror') worker.onmessageerror?.();
  if (failure === 'timeout') await vi.advanceTimersByTimeAsync(30_000);
  await rejected;
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
