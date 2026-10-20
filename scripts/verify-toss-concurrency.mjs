import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const plan = {
  maxConcurrent: 2, edgeRequests: 15, seedRpcRequests: 2, inspectionRequests: 4,
  writes: 'one synthetic player, two sessions, one round and creation snapshot, at most four hint request rows',
  expectedBalance: '10 -> 9 -> 8 -> 13; completion reward once',
  cleanup: 'separate scoped SQL transaction; never executed automatically',
};

const sha = value => createHash('sha256').update(value).digest('hex');
async function overlap(requests) {
  // Await both outcomes before stopping, including when one request fails.
  const settled = await Promise.allSettled(requests);
  const failed = settled.find(result => result.status === 'rejected');
  if (failed) throw failed.reason;
  return settled.map(result => result.value);
}
export function cleanupSql(identity) {
  assert.match(identity, /^[a-f0-9]{64}$/);
  return `BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '10s';
DELETE FROM public.toss_round_creations WHERE identity_hash = '${identity}';
DELETE FROM public.toss_hint_requests WHERE round_id IN (SELECT id FROM public.toss_hint_rounds WHERE identity_hash = '${identity}');
DELETE FROM public.toss_hint_rounds WHERE identity_hash = '${identity}';
DELETE FROM public.toss_hint_sessions WHERE identity_hash = '${identity}';
DELETE FROM public.toss_hint_players WHERE identity_hash = '${identity}';
COMMIT;
SELECT count(*) AS remaining_test_players FROM public.toss_hint_players WHERE identity_hash = '${identity}';
`;
}

/** Transport-injected scenario. No automatic retry; no real user identity or Toss authentication exchange. */
export async function exercise({ api, rpc, inspect, identity, tokens, requestId, hintIds, placements, wordIds }) {
  for (const token of tokens) {
    assert.equal(await rpc('open_toss_hint_session', { p_identity_hash: identity, p_session_hash: sha(token) }), 10);
  }
  const body = { level: 'intermediate', size: 8, completedWordIds: [], requestId, placements };
  const created = await overlap(tokens.map(token => api('round/register', body, token)));
  assert.equal(typeof created[0].roundId, 'string');
  assert.equal(created[0].puzzle.words.length, 2);
  assert.equal(created[0].roundId, created[1].roundId);
  assert.equal(created[0].balance, 10); assert.equal(created[1].balance, 10);
  await api('round/register', body, tokens[0], true);
  assert.equal((await api('round/register', body, tokens[1])).roundId, created[0].roundId);
  const roundId = created[0].roundId;
  const hint = { roundId, wordId: wordIds[0], index: 0, requestId: hintIds[0] };
  const duplicate = await overlap(tokens.map(token => api('hint', hint, token)));
  assert(duplicate.every(result => result.balance === 9 && result.letter === 'C' && result.used === 1));
  const sameCell = await overlap(tokens.map((token, index) => api('hint', { ...hint, requestId: hintIds[index + 1] }, token)));
  assert(sameCell.every(result => result.balance === 9 && result.used === 1));
  const second = { roundId, wordId: wordIds[1], index: 0, requestId: hintIds[3] };
  await api('hint', second, tokens[0], true);
  assert.equal((await api('hint', second, tokens[1])).balance, 8);
  const firstAnswer = await api('answer', { roundId, wordId: wordIds[0], answer: 'CAT' }, tokens[0]);
  assert.deepEqual(firstAnswer, { correct: true, completed: false, balance: 8 });
  const final = { roundId, wordId: wordIds[1], answer: 'TAP' };
  const [, completion] = await overlap([api('answer', final, tokens[0], true), api('answer', final, tokens[1])]);
  assert.deepEqual(completion, { correct: true, completed: true, balance: 13 });
  assert.deepEqual(await api('answer', final, tokens[0]), completion);
  assert.equal((await api('balance', {}, tokens[0])).balance, 13);
  const rounds = await inspect('toss_hint_rounds', `identity_hash=eq.${identity}&select=id,solved,rewarded,hints`);
  assert.equal(rounds.length, 1); assert.equal(rounds[0].id, roundId);
  assert.equal(rounds[0].rewarded, true);
  assert.deepEqual([...rounds[0].solved].sort(), [...wordIds].sort());
  for (const id of wordIds) assert.deepEqual(rounds[0].hints[id], [0]);
  const snapshots = await inspect('toss_round_creations', `identity_hash=eq.${identity}&select=round_id`);
  assert.deepEqual(snapshots, [{ round_id: roundId }]);
  const requests = await inspect('toss_hint_requests', `round_id=eq.${roundId}&select=request_id`);
  assert.equal(requests.length, 4);
  assert.equal(new Set(requests.map(row => row.request_id)).size, 4);
  const sessions = await inspect('toss_hint_sessions', `identity_hash=eq.${identity}&select=token_hash`);
  assert.equal(sessions.length, 2);
  return { passed: true, roundCount: 1, balance: 13, ...plan };
}

async function main() {
  if (process.argv[2] !== '--execute') { console.log(JSON.stringify(plan, null, 2)); return; }
  const project = process.argv[3];
  assert.match(project ?? '', /^[a-z]{20}$/, 'Pass the explicitly approved project reference.');
  const root = `https://${project}.supabase.co`;
  assert.equal(process.env.SUPABASE_URL?.replace(/\/$/, ''), root, 'Server environment must match the approved project.');
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(secret, 'A server-side service key must already be available in the environment. Never pass it as an argument.');
  const runId = randomUUID();
  const identity = sha(`t-crossword-concurrency:${runId}`);
  const tokens = [randomBytes(32).toString('base64url'), randomBytes(32).toString('base64url')];
  const vocabulary = JSON.parse(readFileSync(new URL('../packages/core/src/assets/vocab.json', import.meta.url), 'utf8'));
  const wordIds = ['CAT', 'TAP'].map(text => {
    const word = vocabulary.find(item => item.word === text);
    assert(word, 'Missing canonical test vocabulary.'); return word.id;
  });
  const artifact = new URL(`../tmp/toss-concurrency-${runId}/`, import.meta.url);
  mkdirSync(artifact, { recursive: true });
  writeFileSync(new URL('scope.json', artifact), JSON.stringify({ runId, project, identity, plan }, null, 2));
  writeFileSync(new URL('cleanup.sql', artifact), cleanupSql(identity));
  console.log(`Recovery artifacts: tmp/toss-concurrency-${runId}/ (no keys or raw session tokens)`);
  let calls = 0;
  const call = async (url, method, body, headers, discard = false) => {
    assert(++calls <= 21, 'Request budget exceeded.');
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20_000), redirect: 'error' });
    // Do not log upstream bodies: they can contain internal DB details.
    assert(response.ok, `Verification stopped at request ${calls}, HTTP ${response.status}.`);
    if (discard) { await response.body?.cancel(); return undefined; }
    return response.json();
  };
  const privileged = { apikey: secret, Authorization: `Bearer ${secret}` };
  const report = await exercise({ identity, tokens, wordIds, requestId: randomUUID(), hintIds: Array.from({ length: 4 }, () => randomUUID()),
    placements: [{ id: wordIds[0], startRow: 4, startCol: 2, orientation: 'across' },
      { id: wordIds[1], startRow: 4, startCol: 4, orientation: 'down' }],
    rpc: (name, body) => call(`${root}/rest/v1/rpc/${name}`, 'POST', body, privileged),
    api: (action, body, token, discard) => call(`${root}/functions/v1/toss-hints/${action}`, 'POST', body, { Authorization: `Bearer ${token}` }, discard),
    inspect: (table, query) => call(`${root}/rest/v1/${table}?${query}`, 'GET', undefined, privileged),
  });
  assert.equal(calls, 21);
  writeFileSync(new URL('result.json', artifact), JSON.stringify({ ...report, calls, checkedAt: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ ...report, calls }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('Verification stopped. Inspect the scoped artifacts; no automatic retry or cleanup was performed.'); process.exitCode = 1; });
}
