import { describe, expect, it, vi } from 'vitest';
import { createHintHandler, hash } from '../src/handler.js';
import { parseTossIdentity } from '../src/tossAuth.js';

function setup() {
  const repository = {
    openSession: vi.fn().mockResolvedValue(10), balance: vi.fn().mockResolvedValue(10),
    startRound: vi.fn().mockResolvedValue(10), reveal: vi.fn().mockResolvedValue({ balance: 9, index: 0, letter: 'S', used: 1 }),
    answer: vi.fn().mockResolvedValue({ correct: true, completed: true, balance: 14 }),
  };
  const exchangeCode = vi.fn().mockResolvedValue('verified-user-key');
  const handler = createHintHandler({ repository, exchangeCode, allowedOrigins: ['http://localhost:5174'] });
  return { repository, exchangeCode, handler };
}
const token = 't'.repeat(43);
const post = (path: string, body: unknown, origin = 'http://localhost:5174') => new Request(`https://api.example${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Origin: origin }, body: JSON.stringify(body),
});

describe('Toss hint API boundary', () => {
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
