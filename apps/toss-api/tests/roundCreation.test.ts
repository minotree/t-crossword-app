import { beforeAll, beforeEach, afterAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { defaultVocabList, generateCrossword, crosswordPlacements } from '@t-crossword/core';
import { createHintHandler, hash } from '../src/handler.js';

const db = new PGlite();
const player = 'a'.repeat(64), session = '1'.repeat(64), otherSession = '2'.repeat(64);
const id = '00000000-0000-4000-8000-000000000001';
const round = '00000000-0000-4000-8000-000000000002';
const alternate = '00000000-0000-4000-8000-000000000003';
const fingerprint = 'f'.repeat(64);
const sea = defaultVocabList.find((word) => word.word.toUpperCase() === 'SEA');
if (!sea) throw new Error('Missing vocabulary fixture');
const puzzle = generateCrossword([sea], 'beginner', 8);

async function lookup(token = session, requestId = id, signature = fingerprint) {
  return (await db.query<{ value: unknown }>('select public.get_toss_round_creation($1,$2,$3) as value', [token, requestId, signature])).rows[0].value;
}
async function save(token = session, requestId = id, signature = fingerprint, roundId: string | null = round, value: unknown = puzzle) {
  return (await db.query<{ value: unknown }>('select public.save_toss_round_creation($1,$2,$3,$4,$5) as value', [token, requestId, signature, roundId, JSON.stringify(value)])).rows[0].value;
}
async function counts() {
  return (await db.query<{ rounds: number; requests: number }>('select (select count(*)::int from public.toss_hint_rounds) as rounds, (select count(*)::int from public.toss_round_creations) as requests')).rows[0];
}
beforeAll(async () => {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const file of ['20261018_toss_hint_wallet.sql', '20261019_toss_round_idempotency.sql']) {
    await db.exec(readFileSync(new URL(`../../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
}, 30_000);
beforeEach(async () => {
  await db.exec('truncate public.toss_round_creations, public.toss_hint_requests, public.toss_hint_rounds, public.toss_hint_sessions, public.toss_hint_players;');
  await db.query('select public.open_toss_hint_session($1,$2)', [player, session]);
  await db.query('select public.open_toss_hint_session($1,$2)', ['b'.repeat(64), otherSession]);
});
afterAll(async () => { await db.close(); });

it('keeps the original snapshot and one registered round when save responses are lost', async () => {
  expect(await lookup()).toBeNull();
  const first = await save();
  expect(first).toEqual({ roundId: round, puzzle, balance: 10 });
  expect(await save(session, id, fingerprint, alternate, generateCrossword([], 'beginner', 8))).toEqual(first);
  expect(await lookup()).toEqual(first);
  expect(await counts()).toEqual({ rounds: 1, requests: 1 });
});

it('returns the current balance and replays across renewed sessions', async () => {
  await save();
  await db.query('select public.consume_toss_round_hint($1,$2,$3,$4,$5)', [session, round, puzzle.words[0].id, 0, alternate]);
  const renewed = '3'.repeat(64);
  await db.query('select public.open_toss_hint_session($1,$2)', [player, renewed]);
  expect(await lookup(renewed)).toEqual({ roundId: round, puzzle, balance: 9 });
  expect(await save(renewed)).toEqual({ roundId: round, puzzle, balance: 9 });
});

it('isolates identities even with identical request UUIDs', async () => {
  await save();
  expect(await lookup(otherSession)).toBeNull();
  expect(await save(otherSession, id, fingerprint, alternate)).toEqual({ roundId: alternate, puzzle, balance: 10 });
  expect(await lookup()).toEqual({ roundId: round, puzzle, balance: 10 });
  expect(await counts()).toEqual({ rounds: 2, requests: 2 });
});

it('rejects settings mismatches without registering another round', async () => {
  await save();
  await expect(lookup(session, id, 'e'.repeat(64))).rejects.toThrow('round_request_mismatch');
  await expect(save(session, id, 'e'.repeat(64), alternate)).rejects.toThrow('round_request_mismatch');
  expect(await counts()).toEqual({ rounds: 1, requests: 1 });
});

it('does not recreate an expired request and rejects invalid or expired sessions', async () => {
  await save();
  await db.exec("update public.toss_round_creations set created_at=now()-interval '25 hours'");
  await expect(lookup()).rejects.toThrow('round_request_expired');
  await expect(save()).rejects.toThrow('round_request_expired');
  await expect(lookup('c'.repeat(64))).rejects.toThrow('toss_session_expired');
  await expect(save('c'.repeat(64))).rejects.toThrow('toss_session_expired');
  await db.exec("update public.toss_hint_sessions set expires_at=now()-interval '1 second'");
  await expect(lookup()).rejects.toThrow('toss_session_expired');
  expect(await counts()).toEqual({ rounds: 1, requests: 1 });
});

it('stores and replays an empty result without creating a playable round', async () => {
  const empty = generateCrossword([], 'beginner', 8);
  expect(await save(session, id, fingerprint, null, empty)).toEqual({ roundId: null, puzzle: empty, balance: 10 });
  expect(await lookup()).toEqual({ roundId: null, puzzle: empty, balance: 10 });
  expect(await counts()).toEqual({ rounds: 0, requests: 1 });
});

it('queues competing candidates but stores a single winning round (single PGlite connection)', async () => {
  const results = await Promise.all(Array.from({ length: 6 }, (_, index) => save(session, id, fingerprint, `00000000-0000-4000-8000-${String(index + 10).padStart(12, '0')}`)));
  expect(results.every((value) => JSON.stringify(value) === JSON.stringify(results[0]))).toBe(true);
  expect(await counts()).toEqual({ rounds: 1, requests: 1 });
});

it('rolls back a rejected registration together with its replay record', async () => {
  await expect(save(session, id, fingerprint, round, { ...puzzle, words: puzzle.words.map((word) => ({ ...word, hintLimit: 4 })) })).rejects.toThrow('invalid_round');
  expect(await counts()).toEqual({ rounds: 0, requests: 0 });
});

it('replays at the existing creation budget without consuming another slot', async () => {
  await save();
  const words = puzzle.words.map((word) => ({ id: word.id, answer: word.word, hintLimit: word.hintLimit }));
  await db.query('insert into public.toss_hint_rounds(id,identity_hash,words) select md5(i::text)::uuid,$1,$2::jsonb from generate_series(1,59) i', [player, JSON.stringify(words)]);
  expect(await save()).toEqual({ roundId: round, puzzle, balance: 10 });
  await expect(save(session, alternate, fingerprint, alternate)).rejects.toThrow('too_many_rounds');
  expect(await counts()).toEqual({ rounds: 60, requests: 1 });
});

it('restricts replay data and both RPCs to trusted server calls', async () => {
  for (const role of ['anon', 'authenticated']) {
    const permission = await db.query<{ allowed: boolean }>("select has_table_privilege($1,'public.toss_round_creations','SELECT,INSERT,UPDATE,DELETE') as allowed", [role]);
    expect(permission.rows[0].allowed).toBe(false);
    for (const signature of ['get_toss_round_creation(text,uuid,text)', 'save_toss_round_creation(text,uuid,text,uuid,text)']) {
      const permission = await db.query<{ allowed: boolean }>("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, `public.${signature}`]);
      expect(permission.rows[0].allowed).toBe(false);
    }
    await db.exec(`set role ${role}`);
    await expect(lookup()).rejects.toThrow('permission denied');
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  expect(await save()).toEqual({ roundId: round, puzzle, balance: 10 });
  await db.exec('reset role');
});

it.each(['/round', '/round/register'])('replays the committed %s result after a lost response without invoking registration again', async (path) => {
  const token = 't'.repeat(43);
  await db.query('select public.open_toss_hint_session($1,$2)', [player, hash(token)]);
  const repository = {
    findRoundCreation: lookup, saveRoundCreation: vi.fn(save),
    openSession: vi.fn(), balance: vi.fn().mockResolvedValue(10), startRound: vi.fn(), reveal: vi.fn(), answer: vi.fn(),
  };
  const handler = createHintHandler({ repository, exchangeCode: vi.fn(), allowedOrigins: [] });
  const post = (completedWordIds: string[]) => handler(new Request(`https://local.example${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ level: 'beginner', size: 8, completedWordIds, requestId: id,
      ...(path === '/round/register' ? { placements: crosswordPlacements(puzzle) } : {}) }),
  }));
  const first = await post(['unused-b', 'unused-a']);
  expect(first.status).toBe(200);
  const expected = await first.clone().json();
  await first.body?.cancel();
  const replay = await post(['unused-a', 'unused-b', 'unused-a']);
  expect(replay.status).toBe(200);
  expect(await replay.json()).toEqual(expected);
  expect(repository.saveRoundCreation).toHaveBeenCalledTimes(1);
  expect(repository.startRound).not.toHaveBeenCalled();
  expect(await counts()).toEqual({ rounds: 1, requests: 1 });
});
