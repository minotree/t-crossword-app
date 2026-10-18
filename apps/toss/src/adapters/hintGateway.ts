import { User } from '@apps-in-toss/web-framework';
import { isRecord, isHintBalance, parseHintReveal, parseHintAnswer, type HintReveal, type HintAnswerResult } from '@t-crossword/contracts';
import { parseCrosswordPuzzle, type CrosswordPuzzle, type DifficultyLevel, type GridSize } from '@t-crossword/core';

export interface HintRound { roundId: string | null; puzzle: CrosswordPuzzle; balance: number }
export interface HintGateway {
  balance(): Promise<number>;
  startRound(level: DifficultyLevel, size: GridSize, completedWordIds: string[]): Promise<HintRound>;
  reveal(roundId: string, wordId: string, index: number, requestId: string): Promise<HintReveal>;
  answer(roundId: string, wordId: string, answer: string): Promise<HintAnswerResult>;
}

export class HintGatewayError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'HintGatewayError'; }
}

/** Tokens stay in memory and are never used as Supabase user sessions. */
export function createRemoteHintGateway(baseUrl: string, createCode = async () => (await User.createAnonymousKeyAuthCode()).code, fetcher = fetch): HintGateway {
  const base = baseUrl.replace(/\/$/, '');
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(import.meta.env.DEV && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('힌트 서버는 HTTPS 주소가 필요합니다.');
  }
  let token: string | null = null;
  let authenticating: Promise<void> | null = null;
  let pendingRound: { settings: string; requestId: string } | null = null;

  async function authenticate(): Promise<void> {
    if (authenticating) return authenticating;
    authenticating = (async () => {
      const code = await createCode();
      const response = await fetcher(`${base}/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }), signal: AbortSignal.timeout(15_000) });
      const value: unknown = await response.json();
      if (!response.ok || !isRecord(value) || typeof value.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value.token) || !isHintBalance(value.balance)) {
        throw new Error('토스 사용자 확인에 실패했습니다. 다시 시도해 주세요.');
      }
      token = value.token;
    })();
    try { await authenticating; } finally { authenticating = null; }
  }
  async function post(action: string, body: Record<string, unknown>, retry = true): Promise<unknown> {
    if (!token) await authenticate();
    const response = await fetcher(`${base}/${action}`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
    if (response.status === 401 && retry) { token = null; await authenticate(); return post(action, body, false); }
    const value: unknown = await response.json();
    if (!response.ok) throw new HintGatewayError(isRecord(value) && typeof value.code === 'string' ? value.code : 'hint_failed',
      isRecord(value) && typeof value.error === 'string' ? value.error : '힌트 요청을 처리하지 못했습니다.');
    return value;
  }
  return {
    async balance() {
      const value = await post('balance', {});
      if (!isRecord(value) || !isHintBalance(value.balance)) throw new Error('힌트 잔액을 확인하지 못했습니다.');
      return value.balance;
    },
    async startRound(level, size, completedWordIds) {
      const completed = [...new Set(completedWordIds)].sort();
      const settings = JSON.stringify({ level, size, completedWordIds: completed });
      if (pendingRound?.settings !== settings) pendingRound = { settings, requestId: crypto.randomUUID() };
      const pending = pendingRound;
      let value: unknown;
      try { value = await post('round', { level, size, completedWordIds: completed, requestId: pending.requestId }); }
      catch (error) {
        if (error instanceof HintGatewayError && ['round_request_expired', 'round_request_mismatch'].includes(error.code) && pendingRound === pending) pendingRound = null;
        throw error;
      }
      if (!isRecord(value) || !isHintBalance(value.balance) || (value.roundId !== null && typeof value.roundId !== 'string')) throw new Error('퍼즐 정보를 확인하지 못했습니다.');
      const puzzle = parseCrosswordPuzzle(value.puzzle);
      if ((puzzle.words.length > 0 && !value.roundId) || puzzle.size !== size || puzzle.level !== level) throw new Error('퍼즐 설정이 일치하지 않습니다.');
      if (pendingRound === pending) pendingRound = null;
      return { roundId: value.roundId, puzzle, balance: value.balance };
    },
    async reveal(roundId, wordId, index, requestId) { return parseHintReveal(await post('hint', { roundId, wordId, index, requestId })); },
    async answer(roundId, wordId, answer) { return parseHintAnswer(await post('answer', { roundId, wordId, answer })); },
  };
}
