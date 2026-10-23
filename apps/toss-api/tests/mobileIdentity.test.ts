import { describe, it, expect, vi } from 'vitest';
import { mobileIdentity } from '../src/mobileIdentity.js';
import { createHintHandler, hash } from '../src/handler.js';

const id = '12345678-1234-4234-8234-123456789abc';
describe('mobile anonymous authentication', () => {
  it('uses server-verified anonymous identity with a separate namespace', async () => {
    const verify = vi.fn().mockResolvedValue({ id, anonymous: true });
    expect(await mobileIdentity('jwt', verify)).toBe(`mobile-anonymous:${id}`);
    expect(verify).toHaveBeenCalledWith('jwt');
  });
  it.each([null, { id, anonymous: false }, { id: 'forged', anonymous: true }])('rejects invalid identity %j', async user => {
    await expect(mobileIdentity('jwt', async () => user)).rejects.toThrow();
  });
  it('isolates issued and authenticated session hashes from Toss sessions', async () => {
    const repository = { openSession: vi.fn().mockResolvedValue(10), balance: vi.fn().mockResolvedValue(10),
      startRound: vi.fn(), reveal: vi.fn(), answer: vi.fn(), findRoundCreation: vi.fn(), saveRoundCreation: vi.fn() };
    const handler = createHintHandler({ repository, exchangeCode: async () => `mobile-anonymous:${id}`, allowedOrigins: ['https://localhost'], sessionNamespace: 'mobile-v1:', maxCodeLength: 8192 });
    const response = await handler(new Request('https://api.example/session', { method: 'POST', headers: { Origin: 'https://localhost', 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'a'.repeat(1500) }) }));
    const { token } = await response.json();
    expect(response.status).toBe(200);
    expect(repository.openSession).toHaveBeenCalledWith(hash(`t-crossword:mobile-anonymous:${id}`), hash(`mobile-v1:${token}`));
    await handler(new Request('https://api.example/balance', { method: 'POST', headers: { Origin: 'https://localhost', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }));
    expect(repository.balance).toHaveBeenCalledWith(hash(`mobile-v1:${token}`));
    expect(repository.balance).not.toHaveBeenCalledWith(hash(token));
  });
});
