import { expect, it, vi } from 'vitest';
import { createEdgeHandler } from '../src/edgeAdapter.js';
import { createHintHandler } from '../src/handler.js';

it.each(['/toss-hints/balance', '/functions/v1/toss-hints/balance', '/balance'])('normalizes %s and preserves auth, origin and body', async (path) => {
  const handler = vi.fn(async (request: Request) => {
    expect(new URL(request.url).pathname).toBe('/balance');
    expect(request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.headers.get('Origin')).toBe('https://app.example');
    expect(await request.json()).toEqual({ sample: true });
    return new Response('{}');
  });
  await createEdgeHandler(handler)(new Request(`https://project.example${path}`, {
    method: 'POST', headers: { Authorization: 'Bearer test-token', Origin: 'https://app.example' },
    body: JSON.stringify({ sample: true }),
  }));
  expect(handler).toHaveBeenCalledOnce();
});

it('does not treat custom sessions as Supabase JWTs or allow anonymous wallet calls', async () => {
  const repository = { findRoundCreation: vi.fn(), saveRoundCreation: vi.fn(), balance: vi.fn().mockResolvedValue(13), openSession: vi.fn(), startRound: vi.fn(), reveal: vi.fn(), answer: vi.fn() };
  const handler = createEdgeHandler(createHintHandler({ repository, exchangeCode: vi.fn(), allowedOrigins: ['https://app.example'] }));
  const request = (token?: string) => new Request('https://project.example/toss-hints/balance', {
    method: 'POST', headers: { Origin: 'https://app.example', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: '{}',
  });
  expect((await handler(request())).status).toBe(401);
  expect(repository.balance).not.toHaveBeenCalled();
  const response = await handler(request('t'.repeat(43)));
  expect(await response.json()).toEqual({ balance: 13 });
  expect(repository.balance).toHaveBeenCalledOnce();
});
