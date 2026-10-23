import { isRecord, isHintBalance, parseHintReveal, parseHintAnswer } from '@t-crossword/contracts';
import { crosswordPlacements, parseCrosswordPuzzle, type CrosswordPuzzle } from '@t-crossword/core';
import { createAnonymousAuth } from './anonymousAuth.js';

export function createMobileHintGateway(baseUrl: string, auth: ReturnType<typeof createAnonymousAuth>, fetcher = fetch) {
  if (new URL(baseUrl).protocol !== 'https:') throw new Error('힌트 서버는 HTTPS 주소가 필요합니다.');
  let session: string | null = null;
  let pending: Promise<void> | null = null;
  async function authenticate(force = false) {
    if (!pending) pending = (async () => {
      const response = await fetcher(`${baseUrl}/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: await auth.token(force) }), signal: AbortSignal.timeout(15_000) });
      const value: unknown = await response.json();
      if (!response.ok || !isRecord(value) || typeof value.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value.token)) throw new Error('힌트 사용자 확인에 실패했습니다. 다시 시도해 주세요.');
      session = value.token;
    })().finally(() => { pending = null; });
    return pending;
  }
  async function post(path: string, body: Record<string, unknown>, retry = true): Promise<unknown> {
    if (!session) await authenticate();
    const response = await fetcher(`${baseUrl}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
    if (response.status === 401 && retry) { session = null; await authenticate(true); return post(path, body, false); }
    const value: unknown = await response.json();
    if (!response.ok) throw new Error(isRecord(value) && typeof value.error === 'string' ? value.error : '힌트 요청을 처리하지 못했습니다.');
    return value;
  }
  return {
    async balance() { const value = await post('balance', {}); if (!isRecord(value) || !isHintBalance(value.balance)) throw new Error('잔액 응답이 올바르지 않습니다.'); return value.balance; },
    async register(puzzle: CrosswordPuzzle, completed: string[], requestId: string) {
      const placements = crosswordPlacements(puzzle);
      const value = await post('round/register', { level: puzzle.level, size: puzzle.size, completedWordIds: [...new Set(completed)].sort(), placements, requestId });
      if (!isRecord(value) || typeof value.roundId !== 'string' || !/^[a-f0-9-]{36}$/i.test(value.roundId) || !isHintBalance(value.balance) || JSON.stringify(crosswordPlacements(parseCrosswordPuzzle(value.puzzle))) !== JSON.stringify(placements)) throw new Error('판 등록 응답을 확인하지 못했습니다.');
      return { roundId: value.roundId, balance: value.balance };
    },
    async reveal(roundId: string, wordId: string, index: number, requestId: string) { return parseHintReveal(await post('hint', { roundId, wordId, index, requestId })); },
    async answer(roundId: string, wordId: string, answer: string) { return parseHintAnswer(await post('answer', { roundId, wordId, answer })); },
  };
}

export function configuredHintGateway() {
  const url = import.meta.env.VITE_MOBILE_HINT_API_URL?.replace(/\/$/, '');
  const supabaseUrl = import.meta.env.VITE_MOBILE_SUPABASE_URL;
  const publicKey = import.meta.env.VITE_MOBILE_SUPABASE_ANON_KEY;
  return url && supabaseUrl && publicKey ? createMobileHintGateway(url, createAnonymousAuth(supabaseUrl, publicKey)) : null;
}
