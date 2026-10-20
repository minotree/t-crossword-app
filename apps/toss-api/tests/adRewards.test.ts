import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createHintHandler } from '../src/handler.js';

const db = new PGlite();
const player = 'a'.repeat(64), session = '1'.repeat(64), other = '2'.repeat(64);
const id = '00000000-0000-4000-8000-000000000001';
const reward = async (claim: boolean, token = session, requestId = id) =>
  (await db.query<{ balance: number }>('select public.toss_test_ad_reward($1,$2,$3) as balance', [token, requestId, claim])).rows[0].balance;
beforeAll(async () => {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const file of ['20261018_toss_hint_wallet.sql', '20261020_toss_test_ad_rewards.sql'])
    await db.exec(readFileSync(new URL(`../../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
}, 30_000);
afterAll(async () => { await db.close(); });
beforeEach(async () => {
  await db.exec('truncate public.toss_test_ad_rewards, public.toss_hint_requests, public.toss_hint_rounds, public.toss_hint_sessions, public.toss_hint_players;');
  await db.query('select public.open_toss_hint_session($1,$2)', [player, session]);
  await db.query('select public.open_toss_hint_session($1,$2)', ['b'.repeat(64), other]);
});

describe('test ad reward database', () => {
  it('prepares without credit, grants fixed five once, and returns current balance on retries', async () => {
    expect(await reward(false)).toBe(10);
    expect(await reward(false)).toBe(10);
    const balances = await Promise.all(Array.from({ length: 6 }, () => reward(true)));
    expect(balances).toEqual(Array(6).fill(15));
    await db.query('update public.toss_hint_players set balance=14 where identity_hash=$1', [player]);
    expect(await reward(true)).toBe(14);
  });
  it('rejects missing, other-player and expired tickets and expired sessions', async () => {
    await expect(reward(true)).rejects.toThrow('ad_reward_unavailable');
    await reward(false);
    await expect(reward(true, other)).rejects.toThrow('ad_reward_unavailable');
    await db.exec("update public.toss_test_ad_rewards set created_at=now()-interval '31 minutes'");
    await expect(reward(true)).rejects.toThrow('ad_reward_expired');
    await expect(reward(false)).rejects.toThrow('ad_reward_expired');
    await db.exec("update public.toss_hint_sessions set expires_at=now()-interval '1 second'");
    await expect(reward(false)).rejects.toThrow('toss_session_expired');
  });
  it('enforces cooldown and rolling daily cap, denies direct client RPC/table access', async () => {
    await reward(false);
    await expect(reward(false, session, '00000000-0000-4000-8000-000000000002')).rejects.toThrow('ad_reward_limit');
    await db.exec("update public.toss_test_ad_rewards set created_at=now()-interval '2 minutes'");
    await db.query("insert into public.toss_test_ad_rewards(identity_hash,request_id,created_at) select $1, ('00000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid, now()-interval '2 minutes' from generate_series(2,10) i", [player]);
    await expect(reward(false, session, '00000000-0000-4000-8000-000000000011')).rejects.toThrow('ad_reward_limit');
    await db.exec('set role authenticated');
    await expect(reward(false)).rejects.toThrow('permission denied');
    await expect(db.query('select * from public.toss_test_ad_rewards')).rejects.toThrow('permission denied');
    await db.exec('reset role');
  });
});

it('keeps test rewards disabled by default and validates ad ID/session at the API boundary', async () => {
  const repository = { openSession: vi.fn(), balance: vi.fn(), findRoundCreation: vi.fn(), saveRoundCreation: vi.fn(), startRound: vi.fn(), reveal: vi.fn(), answer: vi.fn(), testAdReward: vi.fn().mockResolvedValue(15) };
  const make = (enabled = false) => createHintHandler({ repository, exchangeCode: vi.fn(), allowedOrigins: ['https://app.example'], testAdsEnabled: enabled });
  const post = (body: unknown, auth = true) => new Request('https://api.example/ads/test/claim', { method: 'POST', headers: { Origin: 'https://app.example', ...(auth ? { Authorization: `Bearer ${'t'.repeat(43)}` } : {}) }, body: JSON.stringify(body) });
  const valid = { requestId: id, adGroupId: 'ait-ad-test-rewarded-id' };
  expect((await make()(post(valid))).status).toBe(503);
  expect((await make(true)(post(valid, false))).status).toBe(401);
  expect((await make(true)(post({ ...valid, adGroupId: 'live' }))).status).toBe(400);
  expect((await make(true)(post({ ...valid, requestId: 'fake' }))).status).toBe(400);
  const response = await make(true)(post(valid));
  expect(await response.json()).toEqual({ balance: 15 });
  expect(repository.testAdReward).toHaveBeenCalledTimes(1);
});
