import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
const base = 'https://zduyaejdjwfhsiazcmrn.supabase.co/functions/v1/toss-hints';
const settingsFile = new URL('../apps/toss-api/.env.local', import.meta.url);
const origin = existsSync(settingsFile) ? parseEnv(readFileSync(settingsFile, 'utf8')).TOSS_ALLOWED_ORIGINS?.split(',').map((value) => value.trim()).find((value) => value.startsWith('https://')) : undefined;
const cases = [
  { name: 'health', path: '/healthz', init: {}, expected: 200 },
  { name: 'anonymous_balance', path: '/balance', init: { method: 'POST', body: '{}' }, expected: 401 },
  { name: 'invalid_session_round', path: '/round', init: { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${'x'.repeat(43)}` },
    body: JSON.stringify({ level: 'beginner', size: 8, completedWordIds: [], requestId: crypto.randomUUID() }) }, expected: 401 },
  { name: 'rejected_origin', path: '/balance', init: { method: 'POST', headers: { Origin: 'https://untrusted.example' }, body: '{}' }, expected: 403 },
];
if (origin) cases.push({ name: 'allowed_preflight', path: '/round', init: { method: 'OPTIONS', headers: { Origin: origin } }, expected: 204 });
for (const test of cases) {
  const response = await fetch(base + test.path, { ...test.init, signal: AbortSignal.timeout(20_000) });
  const cors = test.name !== 'allowed_preflight' || response.headers.get('access-control-allow-origin') === origin;
  console.log(JSON.stringify({ name: test.name, status: response.status, expected: test.expected, passed: response.status === test.expected && cors }));
  await response.body?.cancel();
  if (response.status !== test.expected || !cors) process.exitCode = 1;
}
