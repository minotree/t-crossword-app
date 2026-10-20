import { describe, expect, it, vi } from 'vitest';
import { createHintHandler, hash } from '../src/handler.js';
import { parseTossIdentity } from '../src/tossAuth.js';
import { crosswordPlacements, defaultVocabList, generateCrossword } from '@t-crossword/core';
import { TossHintError } from '@t-crossword/data';

function setup(now?: () => number) {
  const repository = {
    findRoundCreation: vi.fn().mockResolvedValue(null), saveRoundCreation: vi.fn(),
    openSession: vi.fn().mockResolvedValue(10), balance: vi.fn().mockResolvedValue(10),
    startRound: vi.fn().mockResolvedValue(10), reveal: vi.fn().mockResolvedValue({ balance: 9, index: 0, letter: 'S', used: 1 }),
    answer: vi.fn().mockResolvedValue({ correct: true, completed: true, balance: 14 }),
  };
  const exchangeCode = vi.fn().mockResolvedValue('verified-user-key');
  const handler = createHintHandler({ repository, exchangeCode, allowedOrigins: ['http://localhost:5174'], now });
  return { repository, exchangeCode, handler };
}
const token = 't'.repeat(43);
const post = (path: string, body: unknown, origin = 'http://localhost:5174') => new Request(`https://api.example${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Origin: origin }, body: JSON.stringify(body),
});

describe('Toss hint API boundary', () => {
  it('registers device placements with server vocabulary and canonical hint limits', async () => {
    const { handler, repository } = setup();
    const puzzle = generateCrossword(defaultVocabList.slice(0, 20), 'beginner', 8);
    expect(puzzle.words.length).toBeGreaterThan(0);
    repository.saveRoundCreation.mockImplementation(async (_session, _request, _fingerprint, roundId, registered) => ({ roundId, puzzle: registered, balance: 10 }));
    const response = await handler(post('/round/register', { level: 'beginner', size: 8, completedWordIds: [],
      requestId: '00000000-0000-4000-8000-000000000001',
      placements: crosswordPlacements(puzzle).map(placement => ({ ...placement, word: 'FAKE', hintLimit: 99, meaning: 'fake' })) }));
    expect(response.status).toBe(200);
    expect((await response.json()).puzzle).toEqual(puzzle);
    expect(repository.saveRoundCreation).toHaveBeenCalledTimes(1);
    expect(repository.startRound).not.toHaveBeenCalled();
  });

  it('rejects forged, excluded, empty and missing device drafts before saving', async () => {
    const puzzle = generateCrossword(defaultVocabList.slice(0, 20), 'beginner', 8);
    const placements = crosswordPlacements(puzzle);
    const body = { level: 'beginner', size: 8, completedWordIds: [], requestId: '00000000-0000-4000-8000-000000000001', placements };
    for (const invalid of [
      { ...body, requestId: undefined }, { ...body, placements: undefined }, { ...body, placements: [] },
      { ...body, placements: [{ ...placements[0], id: 'forged' }] },
      { ...body, completedWordIds: puzzle.words.map(word => word.id) },
      { ...body, placements: [placements[0], placements[0]] },
    ]) {
      const { handler, repository } = setup();
      expect((await handler(post('/round/register', invalid))).status).toBe(400);
      expect(repository.saveRoundCreation).not.toHaveBeenCalled();
    }
  });

  it('shares the round request limit between device registration and legacy generation', async () => {
    const { handler } = setup();
    for (let index = 0; index < 6; index++) expect((await handler(post(index % 2 ? '/round/register' : '/round', {}))).status).toBe(400);
    expect((await handler(post('/round/register', {}))).status).toBe(429);
  });

  it('binds the request fingerprint to the device source and exact canonical placements', async () => {
    const { handler, repository } = setup();
    const sea = defaultVocabList.find(word => word.word === 'SEA');
    if (!sea) throw new Error('Missing SEA fixture');
    const placements = crosswordPlacements(generateCrossword([sea], 'beginner', 8));
    const expectedFingerprint = hash(JSON.stringify({ level: 'beginner', size: 8, completedWordIds: [], source: 'device-v1', placements }));
    const body = { level: 'beginner', size: 8, completedWordIds: [], requestId: '00000000-0000-4000-8000-000000000001', placements };
    repository.findRoundCreation.mockImplementation(async (_session, _request, fingerprint) => {
      if (fingerprint !== expectedFingerprint) throw new TossHintError('round_request_mismatch', '설정 불일치');
      return null;
    });
    repository.saveRoundCreation.mockImplementation(async (_session, _request, _fingerprint, roundId, puzzle) => ({ roundId, puzzle, balance: 10 }));
    expect((await handler(post('/round/register', body))).status).toBe(200);
    expect(repository.findRoundCreation).toHaveBeenCalledWith(hash(token), body.requestId, expectedFingerprint);
    expect((await handler(post('/round/register', { ...body, placements: [{ ...placements[0], startRow: 0 }] }))).status).toBe(409);
    expect((await handler(post('/round', body))).status).toBe(409);
    expect(repository.saveRoundCreation).toHaveBeenCalledTimes(1);
  });

  it('keeps legacy requests without an ID compatible but non-idempotent', async () => {
    const { handler, repository } = setup();
    const body = { level: 'beginner', size: 8, completedWordIds: [] };
    const lost = await handler(post('/round', body));
    expect(lost.status).toBe(200);
    await lost.body?.cancel();
    const retried = await handler(post('/round', body));
    expect(retried.status).toBe(200);
    expect(repository.startRound).toHaveBeenCalledTimes(2);
    expect(repository.startRound.mock.calls[0][1]).not.toBe(repository.startRound.mock.calls[1][1]);
  });

  it('returns an existing snapshot before generation or registration using canonical settings', async () => {
    const { handler, repository } = setup();
    const saved = { roundId: null, balance: 9, puzzle: { level: 'beginner', size: 8, words: [], grid: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null)) } };
    repository.findRoundCreation.mockResolvedValue(saved);
    const requestId = '00000000-0000-4000-8000-000000000001';
    const response = await handler(post('/round', { level: 'beginner', size: 8, completedWordIds: ['b', 'a', 'a'], requestId }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(saved);
    expect(repository.findRoundCreation).toHaveBeenCalledExactlyOnceWith(hash(token), requestId, hash(JSON.stringify({ level: 'beginner', size: 8, completedWordIds: ['a', 'b'] })));
    expect(repository.balance).not.toHaveBeenCalled();
    expect(repository.saveRoundCreation).not.toHaveBeenCalled();
    expect(repository.startRound).not.toHaveBeenCalled();
  });

  it('rejects invalid creation IDs and malformed stored snapshots', async () => {
    const { handler, repository } = setup();
    const body = { level: 'beginner', size: 8, completedWordIds: [] };
    expect((await handler(post('/round', { ...body, requestId: 'invalid' }))).status).toBe(400);
    expect(repository.findRoundCreation).not.toHaveBeenCalled();
    repository.findRoundCreation.mockResolvedValue({ balance: -1, puzzle: 'private invalid snapshot' });
    const response = await handler(post('/round', { ...body, requestId: '00000000-0000-4000-8000-000000000001' }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
    expect(repository.startRound).not.toHaveBeenCalled();
  });

  it('limits concurrent authentication before external calls and recovers after the window', async () => {
    let time = 0;
    const { handler, exchangeCode, repository } = setup(() => time);
    const responses = await Promise.all(Array.from({ length: 22 }, () => handler(post('/session', { code: 'code' }))));
    expect(responses.filter((response) => response.status === 200)).toHaveLength(20);
    const blocked = responses.find((response) => response.status === 429);
    expect(blocked?.headers.get('Retry-After')).toBe('60');
    expect(blocked?.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5174');
    expect(await blocked?.json()).toMatchObject({ code: 'rate_limited' });
    expect(exchangeCode).toHaveBeenCalledTimes(20);
    expect(repository.openSession).toHaveBeenCalledTimes(20);
    time = 60_000;
    expect((await handler(post('/session', { code: 'code' }))).status).toBe(200);
  });

  it('limits session operations without trusting forwarded IP headers or blocking another session', async () => {
    const { handler, repository } = setup(() => 0);
    const roundId = '00000000-0000-4000-8000-000000000001';
    const requestId = '00000000-0000-4000-8000-000000000002';
    for (let index = 0; index < 30; index += 1) {
      expect((await handler(post('/hint', { roundId, wordId: 'sea', index: 0, requestId }))).status).toBe(200);
    }
    const request = post('/hint', { roundId, wordId: 'sea', index: 0, requestId });
    request.headers.set('X-Forwarded-For', 'different-address');
    expect((await handler(request)).status).toBe(429);
    expect(repository.reveal).toHaveBeenCalledTimes(30);
    const other = post('/hint', { roundId, wordId: 'sea', index: 0, requestId });
    other.headers.set('Authorization', `Bearer ${'u'.repeat(43)}`);
    expect((await handler(other)).status).toBe(200);
  });

  it('enforces a global cap even when a caller rotates tokens', async () => {
    const { handler, repository } = setup(() => 0);
    for (let index = 0; index < 600; index += 1) {
      const request = post('/balance', {});
      request.headers.set('Authorization', `Bearer ${String(index).padStart(43, 'a')}`);
      expect((await handler(request)).status).toBe(200);
    }
    expect((await handler(post('/balance', {}))).status).toBe(429);
    expect(repository.balance).toHaveBeenCalledTimes(600);
  });

  it('counts invalid puzzle attempts and shares the session cap across operations', async () => {
    const { handler, repository } = setup(() => 0);
    for (let index = 0; index < 6; index += 1) expect((await handler(post('/round', {}))).status).toBe(400);
    expect((await handler(post('/round', {}))).status).toBe(429);
    for (let index = 0; index < 90; index += 1) expect((await handler(post('/balance', {}))).status).toBe(200);
    for (let index = 0; index < 23; index += 1) expect((await handler(post('/answer', {}))).status).toBe(400);
    expect((await handler(post('/answer', {}))).status).toBe(429);
    expect(repository.startRound).not.toHaveBeenCalled();
    expect(repository.answer).not.toHaveBeenCalled();
  });

  it('rejects oversized UTF-8 bodies and unknown routes before repository access', async () => {
    const { handler, repository } = setup();
    expect((await handler(post('/balance', { text: '가'.repeat(22_000) }))).status).toBe(413);
    expect((await handler(post('/unknown', {}))).status).toBe(404);
    expect(repository.balance).not.toHaveBeenCalled();
  });

  it('reports process health without authentication or external calls', async () => {
    const { handler, repository, exchangeCode } = setup();
    const response = await handler(new Request('http://localhost/healthz'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(repository.balance).not.toHaveBeenCalled();
    expect(exchangeCode).not.toHaveBeenCalled();
    expect((await handler(new Request('http://localhost/healthz', {
      headers: { Origin: 'https://untrusted.example' },
    }))).status).toBe(403);
  });

  it('uses the exchanged identity instead of client-provided keys and stores only hashes', async () => {
    const { handler, repository, exchangeCode } = setup();
    const response = await handler(post('/session', { code: 'one-time-code', anonKey: 'forged-user' }));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(exchangeCode).toHaveBeenCalledExactlyOnceWith('one-time-code');
    expect(repository.openSession).toHaveBeenCalledWith(hash('t-crossword:verified-user-key'), hash(result.token));
    expect(JSON.stringify(result)).not.toContain('verified-user-key');
  });

  it('does not open a wallet if Toss authentication fails', async () => {
    const { handler, repository, exchangeCode } = setup();
    exchangeCode.mockRejectedValue(new Error('private upstream details'));
    const response = await handler(post('/session', { code: 'bad-code' }));
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain('private upstream');
    expect(repository.openSession).not.toHaveBeenCalled();
  });

  it('forwards idempotency keys and only hashed session tokens', async () => {
    const { handler, repository } = setup();
    const roundId = '00000000-0000-4000-8000-000000000001', requestId = '00000000-0000-4000-8000-000000000002';
    expect((await handler(post('/hint', { roundId, wordId: 'sea', index: 0, requestId }))).status).toBe(200);
    expect(repository.reveal).toHaveBeenCalledExactlyOnceWith(hash(token), roundId, 'sea', 0, requestId);
  });

  it('rejects unknown origins, invalid requests and invalid session headers', async () => {
    const { handler, repository } = setup();
    expect((await handler(post('/balance', {}, 'https://untrusted.example'))).status).toBe(403);
    expect((await handler(post('/hint', { roundId: 'fake' }))).status).toBe(400);
    expect((await handler(new Request('https://api.example/balance', { method: 'POST', body: '{}' }))).status).toBe(401);
    expect(repository.reveal).not.toHaveBeenCalled();
  });

  it('rejects business failures returned with HTTP 200 by Toss', () => {
    expect(parseTossIdentity({ resultType: 'SUCCESS', success: { anonKey: 'verified-key' } })).toBe('verified-key');
    expect(() => parseTossIdentity({ resultType: 'FAIL', success: { anonKey: 'forged-key' } })).toThrow();
    expect(() => parseTossIdentity({ resultType: 'SUCCESS', success: {} })).toThrow();
  });
});
