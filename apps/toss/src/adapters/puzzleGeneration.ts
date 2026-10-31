import { defaultVocabList, generateCrossword, parseCrosswordPuzzle, vocabularyForProgress, type CrosswordPuzzle, type DifficultyLevel, type GridSize } from '@t-crossword/core';

/** The worker owns only scheduling; the engine and learning rules remain in core. */
export async function generateDevicePuzzle(level: DifficultyLevel, size: GridSize, completedWordIds: string[], mistakeWordIds: string[] = [], dismissedMistakeWordIds: string[] = []): Promise<CrosswordPuzzle> {
  if (typeof Worker === 'undefined') {
    return generateCrossword(vocabularyForProgress(defaultVocabList, completedWordIds, mistakeWordIds, dismissedMistakeWordIds), level, size);
  }
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try { worker = new Worker(new URL('../workers/puzzle.worker.ts', import.meta.url), { type: 'module' }); }
    catch { reject(new Error('퍼즐 생성 기능을 시작하지 못했습니다. 앱을 다시 열어 주세요.')); return; }
    const timer = window.setTimeout(() => { worker.terminate(); reject(new Error('퍼즐 생성 시간이 초과되었습니다. 다시 시도해 주세요.')); }, 30_000);
    const finish = () => { window.clearTimeout(timer); worker.terminate(); };
    worker.onmessage = (event: MessageEvent<unknown>) => {
      finish();
      try { resolve(parseCrosswordPuzzle(event.data)); }
      catch { reject(new Error('생성한 퍼즐을 확인하지 못했습니다. 다시 시도해 주세요.')); }
    };
    worker.onerror = (event) => { event.preventDefault(); finish(); reject(new Error('퍼즐을 생성하지 못했습니다. 다시 시도해 주세요.')); };
    worker.onmessageerror = () => { finish(); reject(new Error('생성한 퍼즐을 읽지 못했습니다. 다시 시도해 주세요.')); };
    try { worker.postMessage({ level, size, vocabulary: vocabularyForProgress(defaultVocabList, completedWordIds, mistakeWordIds, dismissedMistakeWordIds) }); }
    catch { finish(); reject(new Error('퍼즐 생성을 시작하지 못했습니다. 다시 시도해 주세요.')); }
  });
}
