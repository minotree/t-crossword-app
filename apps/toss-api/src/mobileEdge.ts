import { getSupabaseClient, createTossHintRepository } from '@t-crossword/data';
import { createHintHandler } from './handler.js';
import { createEdgeHandler } from './edgeAdapter.js';
import { mobileIdentity } from './mobileIdentity.js';

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
const client = getSupabaseClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));
const allowedOrigins = required('MOBILE_ALLOWED_ORIGINS').split(',').map(value => value.trim()).filter(Boolean);
if (!allowedOrigins.length || allowedOrigins.some(value => {
  try { const url = new URL(value); return url.origin !== value || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))); }
  catch { return true; }
})) throw new Error('Invalid mobile origins');
const handler = createHintHandler({
  repository: createTossHintRepository(client), allowedOrigins, maxCodeLength: 8192, sessionNamespace: 'mobile-v1:',
  authenticationError: '모바일 사용자 확인에 실패했습니다. 다시 시도해 주세요.',
  exchangeCode: token => mobileIdentity(token, async jwt => {
    const { data, error } = await client.auth.getUser(jwt);
    return error || !data.user ? null : { id: data.user.id, anonymous: data.user.is_anonymous === true };
  }),
});
Deno.serve(createEdgeHandler(handler, 'mobile-hints'));
