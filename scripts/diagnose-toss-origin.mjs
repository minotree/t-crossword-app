import assert from 'node:assert/strict';

const base = process.argv[2]?.replace(/\/$/, '');
assert(base && new URL(base).protocol === 'https:', 'Pass an HTTPS API base URL.');
const allowedOrigin = process.argv[3];
assert(allowedOrigin && new URL(allowedOrigin).origin === allowedOrigin && new URL(allowedOrigin).protocol === 'https:', 'Pass the confirmed allowed HTTPS Origin.');
// Same read-only route, varying only Origin. Never send credentials or create sessions.
const cases = [
  ['no-origin', undefined, 200],
  ['reserved-origin', 'https://not-allowed.example', 403],
  ['public-origin', 'https://example.org', 403],
  ['preview-origin', allowedOrigin, 200],
  ['preflight', allowedOrigin, 204],
];
const results = [];
const selected = cases.filter(([name]) => !process.argv[4] || process.argv[4].split(',').includes(name));
assert(selected.length > 0 && (!process.argv[4] || process.argv[4].split(',').every(name => cases.some(item => item[0] === name))), 'Unknown check name.');
for (const [name, origin, expected] of selected) {
  const started = performance.now();
  let status;
  try {
    const response = await fetch(`${base}${name === 'preflight' ? '/round/register' : '/healthz'}`, {
      method: name === 'preflight' ? 'OPTIONS' : 'GET',
      headers: { ...(origin ? { Origin: origin } : {}), ...(name === 'preflight' ? {
        'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type',
      } : {}) },
      redirect: 'manual', signal: AbortSignal.timeout(12_000) });
    status = response.status;
    const body = await response.text();
    results.push({ name, origin: origin ?? null, expected, status, elapsedMs: Math.round(performance.now() - started),
      allowOrigin: response.headers.get('access-control-allow-origin'), bodyBytes: Buffer.byteLength(body),
      passed: status === expected && (!['preview-origin', 'preflight'].includes(name) || response.headers.get('access-control-allow-origin') === origin) });
  } catch (error) {
    results.push({ name, origin: origin ?? null, expected, status: status ?? null,
      elapsedMs: Math.round(performance.now() - started), error: error instanceof Error ? error.name : 'UnknownError', passed: false });
  }
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
if (results.some(result => !result.passed)) process.exitCode = 1;
