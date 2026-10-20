import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Read-only boundary smoke checks: no real session, authentication exchange or wallet mutation.
const base = process.argv[2]?.replace(/\/$/, '');
assert(base && new URL(base).protocol === 'https:', 'Pass the HTTPS API base URL.');
const vocabulary = JSON.parse(readFileSync(new URL('../packages/core/src/assets/vocab.json', import.meta.url), 'utf8'));
const sea = vocabulary.find(word => word.word === 'SEA');
assert(sea, 'Missing SEA fixture.');
const syntheticToken = 't'.repeat(43);
const draft = { level: 'beginner', size: 8, completedWordIds: [],
  requestId: '00000000-0000-4000-8000-000000000001',
  placements: [{ id: sea.id, startRow: 4, startCol: 2, orientation: 'across' }] };
const checks = [
  { name: 'health', path: '/healthz', method: 'GET', status: 200 },
  { name: 'balance without session', path: '/balance', body: {}, status: 401 },
  { name: 'device registration without session', path: '/round/register', body: draft, status: 401 },
  { name: 'invalid device draft', path: '/round/register', body: { ...draft, placements: [] }, token: true, status: 400, code: 'invalid_round_draft' },
  { name: 'valid device draft with invalid session', path: '/round/register', body: draft, token: true, status: 401, code: 'unauthorized' },
  { name: 'disallowed origin', path: '/round/register', body: draft, origin: 'https://not-allowed.example', status: 403 },
];
const selected = checks.filter(check => !process.argv[3] || check.name === process.argv[3]);
assert(selected.length > 0, 'Unknown check name.');
for (const check of selected) {
  const response = await fetch(`${base}${check.path}`, { method: check.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...(check.token ? { Authorization: `Bearer ${syntheticToken}` } : {}),
      ...(check.origin ? { Origin: check.origin } : {}) },
    ...(check.body ? { body: JSON.stringify(check.body) } : {}), signal: AbortSignal.timeout(20_000) });
  const value = await response.json();
  assert.equal(response.status, check.status, `${check.name}: unexpected HTTP status`);
  if (check.code) assert.equal(value.code, check.code, `${check.name}: unexpected response code`);
  console.log(`PASS ${check.name}: ${response.status}`);
}
