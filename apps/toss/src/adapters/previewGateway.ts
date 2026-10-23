import type { HintGateway } from './hintGateway.js';
import { generateDevicePuzzle } from './puzzleGeneration.js';

/** Layout preview only: no authentication, wallet mutations, or network requests. */
export function createPreviewGateway(): HintGateway {
  const unsupported = async (): Promise<never> => { throw new Error('로컬 화면 미리보기에서는 서버 힌트·보상을 검증하지 않습니다.'); };
  return {
    async balance() { return 10; },
    async startRound(level, size, completed) {
      return { roundId: null, puzzle: await generateDevicePuzzle(level, size, completed), balance: 10 };
    },
    reveal: unsupported,
    answer: unsupported,
  };
}
