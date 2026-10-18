import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { parseHintReveal, parseHintAnswer } from '@t-crossword/contracts';

const db = new PGlite();
const player = 'a'.repeat(64), session = '1'.repeat(64), otherSession = '2'.repeat(64);
const round = '00000000-0000-4000-8000-000000000001';
const requestId = '00000000-0000-4000-8000-000000000002';
const words = [{ id: 'sea', answer: 'SEA', hintLimit: 1 }, { id: 'book', answer: 'BOOK', hintLimit: 1 }];
async function balance(token = session) {
  return (await db.query<{ value: number }>('select public.get_toss_hint_balance($1) as value', [token])).rows[0].value;
}
async function reveal(index = 0, id = requestId, token = session) {
  const result = await db.query<{ value: unknown }>('select public.consume_toss_round_hint($1,$2,$3,$4,$5) as value', [token, round, 'sea', index, id]);
  return parseHintReveal(result.rows[0].value);
}
async function answer(wordId: string, value: string, token = session) {
  const result = await db.query<{ value: unknown }>('select public.submit_toss_round_answer($1,$2,$3,$4) as value', [token, round, wordId, value]);
  return parseHintAnswer(result.rows[0].value);
}

beforeAll(async () => {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  await db.exec(readFileSync(new URL('../../../supabase/migrations/20261018_toss_hint_wallet.sql', import.meta.url), 'utf8'));
}, 30_000);
afterAll(async () => { await db.close(); });
beforeEach(async () => {
  await db.exec('truncate public.toss_hint_requests, public.toss_hint_rounds, public.toss_hint_sessions, public.toss_hint_players;');
  await db.query('select public.open_toss_hint_session($1,$2)', [player, session]);
  await db.query('select public.open_toss_hint_session($1,$2)', ['b'.repeat(64), otherSession]);
  await db.query('select public.register_toss_hint_round($1,$2,$3)', [session, round, JSON.stringify(words)]);
});

describe('PostgreSQL Toss hint wallet', () => {
  it('grants ten initial hints once per verified identity and retains balances across sessions', async () => {
    expect(await balance()).toBe(10);
    await reveal();
    const newSession = '3'.repeat(64);
    await db.query('select public.open_toss_hint_session($1,$2)', [player, newSession]);
    expect(await balance(newSession)).toBe(9);
    expect(await balance(otherSession)).toBe(10);
  });

  it('deducts once and returns the same letter for request and position retries', async () => {
    expect(await reveal()).toEqual({ balance: 9, index: 0, letter: 'S', used: 1 });
    expect(await reveal()).toEqual({ balance: 9, index: 0, letter: 'S', used: 1 });
    expect((await reveal(0, '00000000-0000-4000-8000-000000000003')).balance).toBe(9);
    await expect(reveal(1)).rejects.toThrow('hint_request_mismatch');
    expect(await balance()).toBe(9);
  });

  it('rejects excess usage, invalid targets and other players without spending hints', async () => {
    await expect(reveal(-1)).rejects.toThrow('invalid_hint_target');
    await expect(reveal(0, requestId, otherSession)).rejects.toThrow('toss_round_unavailable');
    await reveal();
    await expect(reveal(1, '00000000-0000-4000-8000-000000000004')).rejects.toThrow('word_hint_limit');
    expect(await balance()).toBe(9);
  });

  it('rejects hint requests when balance is zero', async () => {
    await db.query('update public.toss_hint_players set balance=0 where identity_hash=$1', [player]);
    await expect(reveal()).rejects.toThrow('insufficient_hint_balance');
    expect(await balance()).toBe(0);
  });

  it('validates every answer and grants exactly five for completing a registered round', async () => {
    expect((await answer('sea', 'WRONG')).correct).toBe(false);
    expect(await balance()).toBe(10);
    await reveal();
    expect(await answer('sea', 'sea')).toEqual({ correct: true, completed: false, balance: 9 });
    expect(await answer('book', 'BOOK')).toEqual({ correct: true, completed: true, balance: 14 });
    expect((await answer('book', 'BOOK')).balance).toBe(14);
    expect((await answer('sea', 'SEA')).balance).toBe(14);
    await expect(answer('book', 'BOOK', otherSession)).rejects.toThrow('toss_round_unavailable');
  });

  it('blocks expired and forged sessions', async () => {
    await expect(balance('f'.repeat(64))).rejects.toThrow('toss_session_expired');
    await db.query('update public.toss_hint_sessions set expires_at=now()-interval \'1 second\' where token_hash=$1', [session]);
    await expect(reveal()).rejects.toThrow('toss_session_expired');
  });

  it('rejects stale rounds and bounds new round creation', async () => {
    await db.query("update public.toss_hint_rounds set created_at=now()-interval '25 hours' where id=$1", [round]);
    await expect(reveal()).rejects.toThrow('toss_round_unavailable');
    await expect(answer('sea', 'SEA')).rejects.toThrow('toss_round_unavailable');
    await db.query("insert into public.toss_hint_rounds(id,identity_hash,words) select md5(i::text)::uuid,$1,$2::jsonb from generate_series(1,60) i", [player, JSON.stringify(words)]);
    await expect(db.query('select public.register_toss_hint_round($1,$2,$3)', [session, '00000000-0000-4000-8000-000000000099', JSON.stringify(words)])).rejects.toThrow('too_many_rounds');
  });

  it('denies client roles all wallet tables and all grant/spend RPCs', async () => {
    for (const role of ['anon', 'authenticated']) {
      for (const table of ['toss_hint_players', 'toss_hint_sessions', 'toss_hint_rounds', 'toss_hint_requests']) {
        const result = await db.query<{ allowed: boolean }>("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') as allowed", [role, `public.${table}`]);
        expect(result.rows[0].allowed).toBe(false);
      }
      for (const signature of ['open_toss_hint_session(text,text)', 'get_toss_hint_balance(text)', 'register_toss_hint_round(text,uuid,jsonb)', 'consume_toss_round_hint(text,uuid,text,integer,uuid)', 'submit_toss_round_answer(text,uuid,text,text)']) {
        const result = await db.query<{ allowed: boolean }>("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, `public.${signature}`]);
        expect(result.rows[0].allowed).toBe(false);
      }
      await db.exec(`set role ${role}`);
      await expect(db.query('select public.open_toss_hint_session($1,$2)', [player, 'f'.repeat(64)])).rejects.toThrow('permission denied');
      await db.exec('reset role');
    }
  });
});
