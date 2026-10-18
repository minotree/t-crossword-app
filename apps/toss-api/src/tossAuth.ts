import { request } from 'node:https';
import { isRecord } from '@t-crossword/contracts';

export function parseTossIdentity(value: unknown): string {
  if (!isRecord(value) || value.resultType !== 'SUCCESS' || !isRecord(value.success) ||
      typeof value.success.anonKey !== 'string' || !value.success.anonKey || value.success.anonKey.length > 1024) {
    throw new Error('토스 사용자 확인에 실패했습니다. 다시 시도해 주세요.');
  }
  return value.success.anonKey;
}

/** Official partner API: only the app's own mTLS certificate can exchange its codes. */
export function createTossAuthExchange(cert: string, key: string, passphrase?: string) {
  return (code: string): Promise<string> => new Promise((resolve, reject) => {
    const req = request('https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/users/anon-key/exchange', {
      method: 'POST', cert, key, passphrase, rejectUnauthorized: true,
      headers: { 'Content-Type': 'application/json' }, timeout: 10_000,
    }, (response) => {
      const chunks: Buffer[] = []; let bytes = 0;
      response.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 65_536) { response.destroy(); reject(new Error('토스 사용자 확인 응답이 올바르지 않습니다.')); return; }
        chunks.push(chunk);
      });
      response.on('error', () => reject(new Error('토스 사용자 확인에 실패했습니다.')));
      response.on('end', () => {
        try {
          const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (process.env.TOSS_LOG_AUTH_STATUS === 'true') {
            const errorCode = isRecord(value) && isRecord(value.error) ? value.error.errorCode : undefined;
            console.info('Toss auth response:', response.statusCode,
              'errorCode:', typeof errorCode === 'number' || (typeof errorCode === 'string' && /^[A-Z0-9_-]{1,40}$/i.test(errorCode)) ? errorCode : 'none');
          }
          if (response.statusCode !== 200) throw new Error('토스 사용자 확인에 실패했습니다.');
          resolve(parseTossIdentity(value));
        } catch { reject(new Error('토스 사용자 확인에 실패했습니다. 다시 시도해 주세요.')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error: NodeJS.ErrnoException) => {
      if (process.env.TOSS_LOG_AUTH_STATUS === 'true') {
        console.info('Toss auth transport:', typeof error.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(error.code) ? error.code : 'failed');
      }
      reject(new Error('토스 사용자 확인 서버에 연결하지 못했습니다.'));
    });
    req.end(JSON.stringify({ code }));
  });
}
