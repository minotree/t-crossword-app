const base = 'https://zduyaejdjwfhsiazcmrn.supabase.co/functions/v1/toss-hints';
const origin = 'https://t-crossword.private-apps.tossmini.com';
const checks = [
  ['health', '/healthz', 'GET', undefined, false, 200],
  ['unauthenticated reward', '/ads/test/claim', 'POST', { requestId: '00000000-0000-4000-8000-000000000001', adGroupId: 'ait-ad-test-rewarded-id' }, false, 401],
  ['enabled test reward with invalid session', '/ads/test/prepare', 'POST', { requestId: '00000000-0000-4000-8000-000000000001', adGroupId: 'ait-ad-test-rewarded-id' }, true, 401],
];
for (const [name, path, method, body, fakeAuth, expected] of checks) {
  const response = await fetch(base + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(fakeAuth ? { Authorization: `Bearer ${'x'.repeat(43)}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) });
  const value = await response.json();
  const passed = response.status === expected && (!fakeAuth || value.code === 'unauthorized');
  console.log(JSON.stringify({ name, status: response.status, code: value.code ?? null, passed }));
  if (!passed) process.exitCode = 1;
}
