import { describe, expect, it, vi } from 'vitest';
import { createRemoteHintGateway } from '../src/adapters/hintGateway.js';

const token = 's'.repeat(43);
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const emptyRound = (size = 8) => ({ roundId: null, balance: 10, puzzle: {
  level: 'beginner', size, words: [], grid: Array.from({ length: size }, () => Array.from({ length: size }, () => null)),
} });
describe('Toss authenticated hint transport', () => {
  it('reuses a failed creation ID with canonical settings and starts a new ID after success', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockRejectedValueOnce(new Error('lost round response'))
      .mockResolvedValueOnce(response(emptyRound()))
      .mockResolvedValueOnce(response(emptyRound()));
    const gateway = createRemoteHintGateway('https://api.example', async () => 'code', fetcher);
    await expect(gateway.startRound('beginner', 8, ['b', 'a', 'a'])).rejects.toThrow('lost round');
    await gateway.startRound('beginner', 8, ['a', 'b']);
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[2][1].body);
    const first = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(first.requestId).toMatch(/^[a-f0-9-]{36}$/);
    expect(first.completedWordIds).toEqual(['a', 'b']);
    await gateway.startRound('beginner', 8, ['a', 'b']);
    expect(JSON.parse(fetcher.mock.calls[3][1].body).requestId).not.toBe(first.requestId);
  });

  it('changes the request ID when settings change after a failed creation', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockRejectedValueOnce(new Error('network lost'))
      .mockResolvedValueOnce(response(emptyRound(10)));
    const gateway = createRemoteHintGateway('https://api.example', async () => 'code', fetcher);
    await expect(gateway.startRound('beginner', 8, [])).rejects.toThrow('network lost');
    await gateway.startRound('beginner', 10, []);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).requestId).not.toBe(JSON.parse(fetcher.mock.calls[2][1].body).requestId);
  });

  it('keeps the round request ID across authentication renewal', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401))
      .mockResolvedValueOnce(response({ token: 't'.repeat(43), balance: 10 }))
      .mockResolvedValueOnce(response(emptyRound()));
    await createRemoteHintGateway('https://api.example', async () => 'code', fetcher).startRound('beginner', 8, []);
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[3][1].body);
  });

  it('retains a creation ID on 429 without automatically retrying', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockResolvedValueOnce(response({ code: 'rate_limited', error: '잠시 후 다시 시도해 주세요.' }, 429))
      .mockResolvedValueOnce(response(emptyRound()));
    const gateway = createRemoteHintGateway('https://api.example', async () => 'code', fetcher);
    await expect(gateway.startRound('beginner', 8, [])).rejects.toMatchObject({ code: 'rate_limited' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await gateway.startRound('beginner', 8, []);
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[2][1].body);
  });

  it('allows a new creation attempt after an expired request is explicitly rejected', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockResolvedValueOnce(response({ code: 'round_request_expired', error: '요청이 만료되었습니다.' }, 409))
      .mockResolvedValueOnce(response(emptyRound()));
    const gateway = createRemoteHintGateway('https://api.example', async () => 'code', fetcher);
    await expect(gateway.startRound('beginner', 8, [])).rejects.toMatchObject({ code: 'round_request_expired' });
    await gateway.startRound('beginner', 8, []);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).requestId).not.toBe(JSON.parse(fetcher.mock.calls[2][1].body).requestId);
  });

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

  it('retries a lost final-answer response with the same round, word and answer', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 9 }))
      .mockRejectedValueOnce(new Error('response lost after commit'))
      .mockResolvedValueOnce(response({ correct: true, completed: true, balance: 14 }));
    const createCode = vi.fn().mockResolvedValue('code');
    const gateway = createRemoteHintGateway('https://api.example', createCode, fetcher);
    await expect(gateway.answer('same-round', 'book', 'BOOK')).rejects.toThrow('response lost');
    expect(await gateway.answer('same-round', 'book', 'BOOK')).toEqual({ correct: true, completed: true, balance: 14 });
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[2][1].body);
    expect(createCode).toHaveBeenCalledTimes(1);
  });

  it('surfaces a rate limit without automatic retries or reauthentication', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 9 }))
      .mockResolvedValueOnce(response({ code: 'rate_limited', error: '30초 후 다시 시도해 주세요.' }, 429));
    const createCode = vi.fn().mockResolvedValue('code');
    const gateway = createRemoteHintGateway('https://api.example', createCode, fetcher);
    await expect(gateway.reveal('round', 'sea', 0, 'same-request')).rejects.toMatchObject({ code: 'rate_limited', message: '30초 후 다시 시도해 주세요.' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(createCode).toHaveBeenCalledTimes(1);
  });

  it('stops retrying when the renewed session is also rejected', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 }))
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401))
      .mockResolvedValueOnce(response({ token: 't'.repeat(43), balance: 10 }))
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401));
    const createCode = vi.fn().mockResolvedValue('code');
    await expect(createRemoteHintGateway('https://api.example', createCode, fetcher).balance()).rejects.toMatchObject({ code: 'unauthorized' });
    expect(createCode).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('does not fall back to ten hints when authentication fails or responses are malformed', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ error: 'auth failed' }, 401));
    await expect(createRemoteHintGateway('https://api.example', async () => 'code', fetcher).balance()).rejects.toThrow('사용자 확인');
    const malformed = vi.fn().mockResolvedValueOnce(response({ token, balance: 10 })).mockResolvedValueOnce(response({ balance: -1 }));
    await expect(createRemoteHintGateway('https://api.example', async () => 'code', malformed).balance()).rejects.toThrow('잔액');
  });
});
