import { expect, it } from 'vitest';
import { createRequestLimiter, readLimitedBody } from '../src/requestLimit.js';

it('does not evict active identities at capacity and reclaims expired entries', () => {
  let time = 0;
  const limit = createRequestLimiter(() => time);
  for (let index = 0; index < 4096; index += 1) expect(limit(String(index), 1)).toBe(0);
  expect(limit('new', 1)).toBe(60);
  expect(limit('0', 1)).toBe(60);
  time = 59_001;
  expect(limit('0', 1)).toBe(1);
  time = 60_000;
  expect(limit('new', 1)).toBe(0);
});

it('cancels a chunked body as soon as the byte limit is exceeded', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new Uint8Array(40_000)); },
    cancel() { cancelled = true; },
  });
  const init = { method: 'POST', body: stream, duplex: 'half' };
  const request = new Request('https://api.example/hint', init);
  expect(await readLimitedBody(request)).toBeNull();
  expect(cancelled).toBe(true);
});
