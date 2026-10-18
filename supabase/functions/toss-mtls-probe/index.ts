// Temporary, operator-only compatibility probe. No wallet or database access.
// Keep gateway JWT verification enabled; require a separate probe token as well.
function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error('Probe configuration missing');
  return value;
}

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (value: unknown, status: number) => new Response(JSON.stringify(value), { status, headers });

Deno.serve(async (request: Request) => {
  try {
    const expected = required('TOSS_PROBE_TOKEN');
    if (expected.length < 32 || request.headers.get('X-Probe-Token') !== expected) {
      return json({ error: 'unauthorized' }, 401);
    }
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    // Read at most 4 KiB, even if Content-Length is missing or forged.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'invalid_request' }, 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 4096) {
          await reader.cancel();
          return json({ error: 'request_too_large' }, 413);
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let body: unknown;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return json({ error: 'invalid_request' }, 400); }
    if (typeof body !== 'object' || body === null || !('code' in body) ||
        typeof body.code !== 'string' || !body.code || body.code.length > 1024) {
      return json({ error: 'invalid_request' }, 400);
    }
    const cert = required('TOSS_MTLS_CERT_PEM');
    const key = required('TOSS_MTLS_KEY_PEM');
    // Do not guess support for encrypted or legacy key formats in hosted Deno.
    if (!cert.includes('-----BEGIN CERTIFICATE-----') || !key.includes('-----BEGIN PRIVATE KEY-----')) {
      return json({ error: 'pem_format_requires_review' }, 503);
    }
    const client = Deno.createHttpClient({ cert, key });
    try {
      const response = await fetch('https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/users/anon-key/exchange', {
        method: 'POST', client, redirect: 'error', signal: AbortSignal.timeout(10_000),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: body.code }),
      });
      const value: unknown = await response.json();
      const authenticated = response.ok && typeof value === 'object' && value !== null &&
        'resultType' in value && value.resultType === 'SUCCESS' &&
        'success' in value && typeof value.success === 'object' && value.success !== null &&
        'anonKey' in value.success && typeof value.success.anonKey === 'string' && value.success.anonKey.length > 0;
      // Never return the identity, upstream response, code, certificate or key.
      return json({ reachedUpstream: true, upstreamStatus: response.status, authenticated }, authenticated ? 200 : 502);
    } finally { client.close(); }
  } catch {
    // Invalid PEM can also terminate the hosted isolate before this catch runs.
    return json({ error: 'probe_failed' }, 503);
  }
});
