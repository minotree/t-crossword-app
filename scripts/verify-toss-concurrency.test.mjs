import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanupSql, exercise, plan } from './verify-toss-concurrency.mjs';

function harness({ wrongBalance = false, extraRound = false } = {}) {
  const identity = 'a'.repeat(64), tokens = ['b'.repeat(43), 'c'.repeat(43)];
  const round = { roundId: 'test-round', balance: 10, puzzle: { words: [{}, {}] } };
  const hint = { balance: wrongBalance ? 8 : 9, letter: 'C', used: 1 };
  const completed = { correct: true, completed: true, balance: 13 };
  const actions = ['round/register', 'round/register', 'round/register', 'round/register',
    'hint', 'hint', 'hint', 'hint', 'hint', 'hint', 'answer', 'answer', 'answer', 'answer', 'balance'];
  const responses = [round, round, undefined, round, hint, hint, hint, hint, undefined, { balance: 8 },
    { correct: true, completed: false, balance: 8 }, undefined, completed, completed, { balance: 13 }];
  const calls = [];
  let active = 0, maximum = 0, rpcCount = 0, inspectCount = 0;
  return { calls,
    counts: () => ({ maximum, rpcCount, inspectCount }),
    options: { identity, tokens, wordIds: ['cat', 'tap'], requestId: 'creation', hintIds: ['h1', 'h2', 'h3', 'h4'], placements: [],
      rpc: async (name, body) => {
        rpcCount++; assert.equal(name, 'open_toss_hint_session');
        assert.equal(body.p_identity_hash, identity); assert.match(body.p_session_hash, /^[a-f0-9]{64}$/); return 10;
      },
      api: async (action, body, token, discard = false) => {
        const index = calls.length; calls.push({ action, body, token, discard });
        assert.equal(action, actions[index]); assert(tokens.includes(token));
        assert.equal(discard, [2, 8, 11].includes(index));
        active++; maximum = Math.max(maximum, active); await Promise.resolve(); active--;
        return structuredClone(responses[index]);
      },
      inspect: async (table, query) => {
        inspectCount++; assert(query.includes(table === 'toss_hint_requests' ? 'round_id=eq.test-round' : `identity_hash=eq.${identity}`));
        if (table === 'toss_hint_rounds') return Array.from({ length: extraRound ? 2 : 1 }, () => ({ id: 'test-round', solved: ['tap', 'cat'], rewarded: true, hints: { cat: [0], tap: [0] } }));
        if (table === 'toss_round_creations') return [{ round_id: 'test-round' }];
        if (table === 'toss_hint_requests') return ['h1', 'h2', 'h3', 'h4'].map(request_id => ({ request_id }));
        assert.equal(table, 'toss_hint_sessions'); return [{}, {}];
      },
    },
  };
}

test('scenario uses two sessions, at most two in flight and the exact 21-request budget', async () => {
  const fixture = harness();
  assert.equal((await exercise(fixture.options)).passed, true);
  const { maximum, rpcCount, inspectCount } = fixture.counts();
  assert.equal(maximum, 2); assert.equal(rpcCount, 2); assert.equal(inspectCount, 4);
  assert.equal(fixture.calls.length + rpcCount + inspectCount, 21);
  assert.equal(fixture.calls.length, plan.edgeRequests);
  assert.deepEqual(fixture.calls[0].body, fixture.calls[3].body);
  assert.deepEqual(fixture.calls[4].body, fixture.calls[5].body);
  assert.deepEqual(fixture.calls[8].body, fixture.calls[9].body);
  assert.deepEqual(fixture.calls[11].body, fixture.calls[13].body);
});

test('unexpected double spending fails before later stages', async () => {
  const fixture = harness({ wrongBalance: true });
  await assert.rejects(exercise(fixture.options));
  assert.equal(fixture.calls.length, 6);
});

test('duplicate registered rows fail verification', async () => {
  await assert.rejects(exercise(harness({ extraRound: true }).options));
});

test('cleanup accepts only the generated hash and scopes every delete', () => {
  assert.throws(() => cleanupSql("'; DELETE FROM public.toss_hint_players;"));
  const sql = cleanupSql('a'.repeat(64));
  assert.equal(sql.split('\n').filter(line => line.startsWith('DELETE')).length, 5);
  assert(sql.split('\n').filter(line => line.startsWith('DELETE')).every(line => line.includes('WHERE') && line.includes('a'.repeat(64))));
  assert(!/TRUNCATE|DROP|CASCADE/.test(sql)); assert(sql.startsWith('BEGIN;')); assert(sql.includes('COMMIT;'));
});

test('default invocation only prints a plan and never exposes environment secrets', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./verify-toss-concurrency.mjs', import.meta.url))], {
    encoding: 'utf8', env: { SUPABASE_SERVICE_ROLE_KEY: 'test-secret-do-not-print' },
  });
  assert.equal(result.status, 0); assert.deepEqual(JSON.parse(result.stdout), plan);
  assert(!`${result.stdout}${result.stderr}`.includes('test-secret-do-not-print'));
});
