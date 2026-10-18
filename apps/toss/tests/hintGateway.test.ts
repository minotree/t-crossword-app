import { describe, expect, it, vi } from 'vitest';
import { createRemoteHintGateway } from '../src/adapters/hintGateway.js';

const token = 's'.repeat(43);
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
describe('Toss authenticated hint transport', () => {
  it('exchanges one fresh code for concurrent requests without exposing a user key', async () => {
    const createCode = vi.fn().mockResolvedValue('one-time-code');
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockResolvedValueOnce(response({ balance: 9 })).mockResolvedValueOnce(response({ balance: 9 }));
    const gateway = createRemoteHintGateway('https://api.example', createCode, fetcher);
    expect(await Promise.all([gateway.balance(), gateway.balance()])).toEqual([9, 9]);
    expect(createCode).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].body).toBe(JSON.stringify({ code: 'one-time-code' }));
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('renews an expired session with a new code at most once', async () => {
    const createCode = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockResolvedValueOnce(response({ error: 'expired' }, 401))
      .mockResolvedValueOnce(response({ token: 't'.repeat(43), balance: 8 }))
      .mockResolvedValueOnce(response({ balance: 8 }));
    expect(await createRemoteHintGateway('https://api.example', createCode, fetcher).balance()).toBe(8);
    expect(createCode).toHaveBeenCalledTimes(2);
  });

  it('preserves the same hint idempotency key on retry after an unknown network outcome', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce(response({ balance: 9, index: 0, letter: 'S', used: 1 }));
    const gateway = createRemoteHintGateway('https://api.example', async () => 'code', fetcher);
    await expect(gateway.reveal('round', 'sea', 0, 'same-request')).rejects.toThrow('network timeout');
    expect((await gateway.reveal('round', 'sea', 0, 'same-request')).balance).toBe(9);
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[2][1].body);
  });

  it('does not fall back to ten hints when authentication fails or responses are malformed', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ error: 'auth failed' }, 401));
    await expect(createRemoteHintGateway('https://api.example', async () => 'code', fetcher).balance()).rejects.toThrow('사용자 확인');
    const malformed = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 })).mockResolvedValueOnce(response({ balance: -1 }));
    await expect(createRemoteHintGateway('https://api.example', async () => 'code', malformed).balance()).rejects.toThrow('잔액');
  });
});
