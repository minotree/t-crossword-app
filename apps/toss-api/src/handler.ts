import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { defaultVocabList, generateCrossword, parseCrosswordPuzzle, registerCrosswordDraft, vocabularyForProgress, crosswordPlacements, type DifficultyLevel, type GridSize, type CrosswordPuzzle } from '@t-crossword/core';
import { isRecord, isHintBalance } from '@t-crossword/contracts';
import { TossHintError, type createTossHintRepository } from '@t-crossword/data';
import { createRequestLimiter, readLimitedBody } from './requestLimit.js';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
type Repository = ReturnType<typeof createTossHintRepository>;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function createHintHandler({ repository, exchangeCode, allowedOrigins, probeCode, now, testAdsEnabled = false, maxCodeLength = 1024, sessionNamespace = '', authenticationError = '토스 사용자 확인에 실패했습니다. 다시 시도해 주세요.' }: {
  repository: Omit<Repository, 'testAdReward'> & Partial<Pick<Repository, 'testAdReward'>>;
  testAdsEnabled?: boolean;
  maxCodeLength?: number;
  sessionNamespace?: string;
  authenticationError?: string;
  exchangeCode: (code: string, origin: string | null) => Promise<string>;
  allowedOrigins: string[];
  probeCode?: (code: string) => Promise<boolean>;
  now?: () => number;
}) {
  const limit = createRequestLimiter(now);
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin');
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    if (origin && !allowedOrigins.includes(origin)) return new Response(JSON.stringify({ error: '허용되지 않은 요청입니다.' }), { status: 403, headers });
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    if (request.method === 'GET' && new URL(request.url).pathname === '/healthz') {
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers });
    }
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'POST 요청만 지원합니다.' }, 405);
    const rejectLimit = (seconds: number) => {
      headers.set('Retry-After', String(seconds));
      headers.set('Access-Control-Expose-Headers', 'Retry-After');
      return json({ error: `요청이 많습니다. ${seconds}초 후 다시 시도해 주세요.`, code: 'rate_limited' }, 429);
    };
    const globalWait = limit('global', 600);
    if (globalWait) return rejectLimit(globalWait);
    try {
      const action = new URL(request.url).pathname.replace(/\/$/, '');
      if (!['/session', '/auth-probe', '/balance', '/round', '/round/register', '/hint', '/answer', '/ads/test/prepare', '/ads/test/claim'].includes(action)) return json({ error: '경로를 찾지 못했습니다.' }, 404);
      if (action === '/session' || action === '/auth-probe') {
        const wait = limit('authentication', 20);
        if (wait) return rejectLimit(wait);
      }
      const raw = await readLimitedBody(request);
      if (raw === null) return json({ error: '요청이 너무 큽니다.' }, 413);
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return json({ error: '잘못된 요청입니다.' }, 400); }
      if (!isRecord(body)) return json({ error: '잘못된 요청입니다.' }, 400);
      if (action === '/auth-probe') {
        if (!probeCode) return json({ error: '인증 시험이 비활성 상태입니다.' }, 404);
        // The temporary relay accepts only explicitly configured app origins.
        if (!origin) return json({ error: '허용되지 않은 요청입니다.' }, 403);
        if (typeof body.code !== 'string' || !body.code || body.code.length > maxCodeLength) return json({ error: '인증 코드가 필요합니다.' }, 400);
        try { return json({ authenticated: await probeCode(body.code) }); }
        catch { return json({ authenticated: false, error: '무료 인증 연결을 확인하지 못했습니다. 실제 토스에서 다시 시도해 주세요.' }); }
      }
      if (action === '/session') {
        if (typeof body.code !== 'string' || !body.code || body.code.length > maxCodeLength) return json({ error: '인증 코드가 필요합니다.' }, 400);
        let identity: string;
        try { identity = await exchangeCode(body.code, origin); }
        catch { return json({ error: authenticationError, code: 'auth_failed' }, 401); }
        const token = randomBytes(32).toString('base64url');
        const balance = await repository.openSession(hash(`t-crossword:${identity}`), hash(sessionNamespace + token));
        return json({ token, balance });
      }
      const authorization = request.headers.get('Authorization');
      if (!authorization || !/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization)) return json({ error: '사용자 확인이 필요합니다.', code: 'unauthorized' }, 401);
      const sessionHash = hash(sessionNamespace + authorization.slice(7));
      const sessionWait = limit(`session:${sessionHash}`, 120);
      if (sessionWait) return rejectLimit(sessionWait);
      const roundAction = action === '/round' || action === '/round/register';
      const actionWait = limit(`${roundAction ? '/round' : action}:${sessionHash}`, roundAction ? 6 : action === '/hint' ? 30 : 90);
      if (actionWait) return rejectLimit(actionWait);
      if (action === '/balance') return json({ balance: await repository.balance(sessionHash) });
      if (action === '/ads/test/prepare' || action === '/ads/test/claim') {
        if (!testAdsEnabled || !repository.testAdReward) return json({ error: '광고 보상 테스트가 아직 준비되지 않았습니다.', code: 'ads_disabled' }, 503);
        if (body.adGroupId !== 'ait-ad-test-rewarded-id' || typeof body.requestId !== 'string' || !UUID.test(body.requestId)) return json({ error: '광고 요청 정보가 올바르지 않습니다.' }, 400);
        return json({ balance: await repository.testAdReward(sessionHash, body.requestId, action === '/ads/test/claim') });
      }
      if (roundAction) {
        const level: DifficultyLevel | null = body.level === 'beginner' || body.level === 'intermediate' || body.level === 'advanced' ? body.level : null;
        const size: GridSize | null = body.size === 8 || body.size === 10 || body.size === 12 ? body.size : null;
        if (!level || !size || !Array.isArray(body.completedWordIds) || body.completedWordIds.length > 5000 ||
            !body.completedWordIds.every((id) => typeof id === 'string' && id.length <= 100)) return json({ error: '퍼즐 설정이 올바르지 않습니다.' }, 400);
        if (body.requestId !== undefined && (typeof body.requestId !== 'string' || !UUID.test(body.requestId))) return json({ error: '퍼즐 요청 정보가 올바르지 않습니다.' }, 400);
        const vocabulary = vocabularyForProgress(defaultVocabList, body.completedWordIds);
        let devicePuzzle: CrosswordPuzzle | undefined;
        if (action === '/round/register') {
          if (typeof body.requestId !== 'string') return json({ error: '퍼즐 요청 ID가 필요합니다.' }, 400);
          try { devicePuzzle = registerCrosswordDraft(vocabulary, level, size, body.placements); }
          catch { return json({ error: '퍼즐 배치를 확인하지 못했습니다.', code: 'invalid_round_draft' }, 400); }
        }
        const fingerprint = hash(JSON.stringify({ level, size, completedWordIds: [...new Set(body.completedWordIds)].sort(),
          ...(devicePuzzle ? { source: 'device-v1', placements: crosswordPlacements(devicePuzzle) } : {}) }));
        const roundResponse = (value: unknown) => {
          if (!isRecord(value) || !isHintBalance(value.balance) ||
              (value.roundId !== null && (typeof value.roundId !== 'string' || !UUID.test(value.roundId)))) throw new Error('Invalid round snapshot');
          const puzzle = parseCrosswordPuzzle(value.puzzle);
          if (puzzle.level !== level || puzzle.size !== size || Boolean(puzzle.words.length) !== Boolean(value.roundId)) throw new Error('Invalid round snapshot');
          return json({ roundId: value.roundId, puzzle, balance: value.balance });
        };
        if (typeof body.requestId === 'string') {
          const saved = await repository.findRoundCreation(sessionHash, body.requestId, fingerprint);
          if (saved !== null) return roundResponse(saved);
        }
        await repository.balance(sessionHash);
        const puzzle = devicePuzzle ?? generateCrossword(vocabulary, level, size);
        if (typeof body.requestId === 'string') {
          return roundResponse(await repository.saveRoundCreation(sessionHash, body.requestId, fingerprint, puzzle.words.length ? randomUUID() : null, puzzle));
        }
        if (!puzzle.words.length) return json({ roundId: null, puzzle, balance: await repository.balance(sessionHash) });
        const roundId = randomUUID();
        const balance = await repository.startRound(sessionHash, roundId, puzzle.words.map((word) => ({ id: word.id, answer: word.word.toUpperCase(), hintLimit: word.hintLimit })));
        return json({ roundId, puzzle, balance });
      }
      if (typeof body.roundId !== 'string' || !UUID.test(body.roundId) || typeof body.wordId !== 'string' || body.wordId.length > 100) return json({ error: '문제 정보가 올바르지 않습니다.' }, 400);
      if (action === '/hint') {
        if (typeof body.index !== 'number' || !Number.isInteger(body.index) || body.index < 0 || body.index > 11 ||
            typeof body.requestId !== 'string' || !UUID.test(body.requestId)) return json({ error: '힌트 요청이 올바르지 않습니다.' }, 400);
        return json(await repository.reveal(sessionHash, body.roundId, body.wordId, body.index, body.requestId));
      }
      if (action === '/answer') {
        if (typeof body.answer !== 'string' || !/^[A-Za-z]{3,12}$/.test(body.answer)) return json({ error: '영어 정답을 입력해 주세요.' }, 400);
        return json(await repository.answer(sessionHash, body.roundId, body.wordId, body.answer));
      }
      return json({ error: '경로를 찾지 못했습니다.' }, 404);
    } catch (error: unknown) {
      if (error instanceof TossHintError) return json({ error: error.message, code: error.code }, error.code === 'unauthorized' ? 401 : 409);
      // Never expose certificate, token, database error or upstream response details.
      return json({ error: '힌트 서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', code: 'server_error' }, 503);
    }
  };
}
