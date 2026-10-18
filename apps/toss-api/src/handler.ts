import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { defaultVocabList, generateCrossword, type DifficultyLevel, type GridSize } from '@t-crossword/core';
import { isRecord } from '@t-crossword/contracts';
import { TossHintError, type createTossHintRepository } from '@t-crossword/data';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
type Repository = ReturnType<typeof createTossHintRepository>;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function createHintHandler({ repository, exchangeCode, allowedOrigins }: {
  repository: Repository;
  exchangeCode: (code: string) => Promise<string>;
  allowedOrigins: string[];
}) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin');
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    if (origin && !allowedOrigins.includes(origin)) return new Response(JSON.stringify({ error: '허용되지 않은 요청입니다.' }), { status: 403, headers });
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'POST 요청만 지원합니다.' }, 405);
    try {
      const raw = await request.text();
      if (raw.length > 65_536) return json({ error: '요청이 너무 큽니다.' }, 413);
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return json({ error: '잘못된 요청입니다.' }, 400); }
      if (!isRecord(body)) return json({ error: '잘못된 요청입니다.' }, 400);
      const action = new URL(request.url).pathname.replace(/\/$/, '');
      if (action === '/session') {
        if (typeof body.code !== 'string' || !body.code || body.code.length > 1024) return json({ error: '인증 코드가 필요합니다.' }, 400);
        let identity: string;
        try { identity = await exchangeCode(body.code); }
        catch { return json({ error: '토스 사용자 확인에 실패했습니다. 다시 시도해 주세요.', code: 'auth_failed' }, 401); }
        const token = randomBytes(32).toString('base64url');
        const balance = await repository.openSession(hash(`t-crossword:${identity}`), hash(token));
        return json({ token, balance });
      }
      const authorization = request.headers.get('Authorization');
      if (!authorization || !/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization)) return json({ error: '사용자 확인이 필요합니다.', code: 'unauthorized' }, 401);
      const sessionHash = hash(authorization.slice(7));
      if (action === '/balance') return json({ balance: await repository.balance(sessionHash) });
      if (action === '/round') {
        const level: DifficultyLevel | null = body.level === 'beginner' || body.level === 'intermediate' || body.level === 'advanced' ? body.level : null;
        const size: GridSize | null = body.size === 8 || body.size === 10 || body.size === 12 ? body.size : null;
        if (!level || !size || !Array.isArray(body.completedWordIds) || body.completedWordIds.length > 5000 ||
            !body.completedWordIds.every((id) => typeof id === 'string' && id.length <= 100)) return json({ error: '퍼즐 설정이 올바르지 않습니다.' }, 400);
        await repository.balance(sessionHash);
        const completed = new Set(body.completedWordIds);
        const puzzle = generateCrossword(defaultVocabList.map((word) => ({ ...word, isQuizUsed: word.isQuizUsed || completed.has(word.id) })), level, size);
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
