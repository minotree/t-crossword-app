import { expect, it, vi } from 'vitest';
import { runAuthProbe } from '../src/adapters/authProbe.js';

it('uses a fresh SDK code for each test and sends no operator credentials', async () => {
  const code = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
  const fetcher = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ authenticated: true })));
  await runAuthProbe('https://api.example', code, fetcher);
  await runAuthProbe('https://api.example', code, fetcher);
  expect(code).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' });
  expect(fetcher.mock.calls[0][1].body).toBe(JSON.stringify({ code: 'first' }));
  expect(fetcher.mock.calls[1][1].body).toBe(JSON.stringify({ code: 'second' }));
});

it('does not report success for HTTP errors or unverified results', async () => {
  const code = vi.fn().mockResolvedValue('code');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: true }), { status: 502 }));
  await expect(runAuthProbe('https://api.example', code, fetcher)).rejects.toThrow('인증');
  await expect(runAuthProbe('http://api.example', code, fetcher)).rejects.toThrow('HTTPS');
});
