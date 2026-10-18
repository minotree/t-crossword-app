import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { getSupabaseClient, createTossHintRepository } from '@t-crossword/data';
import { createTossAuthExchange } from './tossAuth.js';
import { createHintHandler } from './handler.js';
import { parseEnv } from 'node:util';
import { createAuthProbe } from './authProbe.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`필수 서버 설정이 없습니다: ${name}`);
  return value;
}

const probeSettings = process.env.TOSS_AUTH_PROBE_SETTINGS_PATH;
const probeToken = probeSettings ? parseEnv(readFileSync(probeSettings, 'utf8')).TOSS_PROBE_TOKEN : undefined;
if (probeSettings && (!probeToken || probeToken.length < 32)) throw new Error('인증 시험 설정을 확인해 주세요.');
const handler = createHintHandler({
  probeCode: probeToken ? createAuthProbe(`${required('SUPABASE_URL')}/functions/v1/toss-mtls-probe`, required('SUPABASE_SERVICE_ROLE_KEY'), probeToken) : undefined,
  repository: createTossHintRepository(getSupabaseClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'))),
  exchangeCode: createTossAuthExchange(readFileSync(required('TOSS_MTLS_CERT_PATH'), 'utf8'), readFileSync(required('TOSS_MTLS_KEY_PATH'), 'utf8'), process.env.TOSS_MTLS_KEY_PASSPHRASE),
  allowedOrigins: required('TOSS_ALLOWED_ORIGINS').split(',').map((origin) => origin.trim()).filter(Boolean),
});

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks: Buffer[] = []; let bytes = 0;
    for await (const chunk of incoming) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > 65_536) { outgoing.writeHead(413); outgoing.end(); return; }
      chunks.push(buffer);
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (typeof value === 'string') headers.set(name, value);
    }
    const method = incoming.method ?? 'GET';
    const response = await handler(new Request(new URL(incoming.url ?? '/', 'http://localhost'), {
      method, headers, ...(method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
    }));
    // Opt-in local CORS diagnosis: log only the normalized origin, never credentials or bodies.
    if (response.status === 403 && process.env.TOSS_LOG_REJECTED_ORIGINS === 'true') {
      const origin = headers.get('Origin');
      if (origin) {
        try { console.info('Rejected CORS origin:', new URL(origin).origin); }
        catch { console.info('Rejected CORS origin: invalid'); }
      }
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(await response.text());
  } catch { outgoing.writeHead(500); outgoing.end(); }
});
server.requestTimeout = 20_000;
server.headersTimeout = 15_000;
server.listen(Number(process.env.PORT ?? 8787), process.env.HOST ?? '127.0.0.1', () => {
  console.info('토스 힌트 API가 시작되었습니다.');
});

// Finish in-flight wallet requests before a host replaces this process.
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 15_000);
  deadline.unref();
  server.close((error) => {
    clearTimeout(deadline);
    process.exit(error ? 1 : 0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
