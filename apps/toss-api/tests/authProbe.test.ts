import { expect, it, vi } from 'vitest';
import { createAuthProbe } from '../src/authProbe.js';
import { createHintHandler } from '../src/handler.js';

it('keeps operator credentials in the relay and returns only a verified boolean', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: true })));
  expect(await createAuthProbe('https://project.example/probe', 'server-key', 'probe-token', fetcher)('fresh-code')).toBe(true);
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer server-key');
  expect(fetcher.mock.calls[0][1].body).toBe(JSON.stringify({ code: 'fresh-code' }));
  const failure = vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: false }), { status: 502 }));
  await expect(createAuthProbe('https://project.example/probe', 'key', 'token', failure)('code')).rejects.toThrow('인증');
});

it('requires an allowed origin, hides relay errors and never calls the wallet', async () => {
  const repository = { findRoundCreation: vi.fn(), saveRoundCreation: vi.fn(), openSession: vi.fn(), balance: vi.fn(), startRound: vi.fn(), reveal: vi.fn(), answer: vi.fn() };
  const probeCode = vi.fn().mockResolvedValue(true);
  const options = { repository, exchangeCode: vi.fn(), allowedOrigins: ['https://app.example'] };
  const handler = createHintHandler({ ...options, probeCode });
  const request = (origin?: string) => new Request('https://api.example/auth-probe', {
    method: 'POST', headers: origin ? { Origin: origin } : {}, body: JSON.stringify({ code: 'fresh' }),
  });
  expect((await handler(request())).status).toBe(403);
  expect((await handler(request('https://other.example'))).status).toBe(403);
  expect((await createHintHandler(options)(request('https://app.example'))).status).toBe(404);
  expect(await (await handler(request('https://app.example'))).json()).toEqual({ authenticated: true });
  probeCode.mockRejectedValue(new Error('private credential details'));
  expect(await (await handler(request('https://app.example'))).text()).not.toContain('private credential');
  expect(repository.openSession).not.toHaveBeenCalled();
  expect(repository.balance).not.toHaveBeenCalled();
});
