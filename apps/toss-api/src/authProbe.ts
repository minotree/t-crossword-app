import { isRecord } from '@t-crossword/contracts';

/** Operator-only relay. Credentials stay in the local server, never the app. */
export function createAuthProbe(url: string, serverKey: string, probeToken: string, fetcher = fetch) {
  return async (code: string): Promise<boolean> => {
    const response = await fetcher(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serverKey}`, 'X-Probe-Token': probeToken },
      body: JSON.stringify({ code }),
    });
    const result: unknown = await response.json();
    if (response.ok && isRecord(result) && result.authenticated === true) return true;
    throw new Error('무료 인증 연결을 확인하지 못했습니다. 실제 토스에서 다시 시도해 주세요.');
  };
}
