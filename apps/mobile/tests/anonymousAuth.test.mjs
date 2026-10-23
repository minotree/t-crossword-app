import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnonymousAuth } from '../src/adapters/anonymousAuth.ts';

const userId = '12345678-1234-4234-8234-123456789abc';
const session = { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { id: userId, is_anonymous: true } };
function storage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; }
test('deduplicates anonymous signup and restores persisted identity', async () => {
  const store = storage(); let calls = 0;
  const fetcher = async () => { calls++; return new Response(JSON.stringify(session)); };
  const auth = createAnonymousAuth('https://example.supabase.co', 'public', store, fetcher);
  assert.deepEqual(await Promise.all([auth.token(), auth.token()]), ['access', 'access']);
  assert.equal(calls, 1);
  assert.equal(await createAnonymousAuth('https://example.supabase.co', 'public', store, fetcher).token(), 'access');
  assert.equal(calls, 1);
});
test('refreshes the same identity and never signs up again after a refresh failure', async () => {
  const store = storage(); const paths = [];
  const auth = createAnonymousAuth('https://example.supabase.co', 'public', store, async url => {
    paths.push(url);
    return paths.length === 1 ? new Response(JSON.stringify(session)) : new Response('{}', { status: 401 });
  });
  await auth.token(); const before = store.getItem('mobile-anonymous-session-v1');
  await assert.rejects(auth.token(true));
  assert.ok(paths[1].endsWith('/token?grant_type=refresh_token'));
  assert.equal(store.getItem('mobile-anonymous-session-v1'), before);
});
test('refuses a different user returned on refresh', async () => {
  const store = storage(); let calls = 0;
  const auth = createAnonymousAuth('https://example.supabase.co', 'public', store, async () => new Response(JSON.stringify(++calls === 1 ? session : { ...session, user: { ...session.user, id: 'different' } })));
  await auth.token(); await assert.rejects(auth.token(true));
});
test('preserves malformed stored credentials without creating another account', async () => {
  const store = storage(); store.setItem('mobile-anonymous-session-v1', '{bad');
  const auth = createAnonymousAuth('https://example.supabase.co', 'public', store, async () => { throw new Error('must not fetch'); });
  await assert.rejects(auth.token());
  assert.equal(store.getItem('mobile-anonymous-session-v1'), '{bad');
});
