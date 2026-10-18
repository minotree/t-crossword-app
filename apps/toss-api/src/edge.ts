import { getSupabaseClient, createTossHintRepository } from '@t-crossword/data';
import { createHintHandler } from './handler.js';
import { createEdgeHandler } from './edgeAdapter.js';
import { parseTossIdentity } from './tossIdentity.js';

// Minimal host contract for workspace typechecking; provided by hosted Deno.
declare const Deno: {
  env: { get(name: string): string | undefined };
  createHttpClient(options: { cert: string; key: string }): { close(): void };
  serve(handler: (request: Request) => Promise<Response>): void;
};
function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
const allowedOrigins = required('TOSS_ALLOWED_ORIGINS').split(',').map((value) => value.trim()).filter(Boolean);
if (!allowedOrigins.length || allowedOrigins.some((value) => {
  try { const url = new URL(value); return url.protocol !== 'https:' || url.origin !== value; }
  catch { return true; }
})) throw new Error('Invalid allowed origins');

const handler = createHintHandler({
  repository: createTossHintRepository(getSupabaseClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'))),
  allowedOrigins,
  exchangeCode: async (code) => {
    const client = Deno.createHttpClient({ cert: required('TOSS_MTLS_CERT_PEM'), key: required('TOSS_MTLS_KEY_PEM') });
    try {
      const init = {
        method: 'POST', client, redirect: 'error' as const, signal: AbortSignal.timeout(10_000),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
      };
      const response = await fetch('https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/users/anon-key/exchange', init);
      if (!response.ok) throw new Error('Toss authentication failed');
      return parseTossIdentity(await response.json());
    } finally { client.close(); }
  },
});
Deno.serve(createEdgeHandler(handler));
