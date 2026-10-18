import { User } from '@apps-in-toss/web-framework';
import { isRecord } from '@t-crossword/contracts';

export async function runAuthProbe(baseUrl: string, createCode = async () => (await User.createAnonymousKeyAuthCode()).code, fetcher = fetch): Promise<void> {
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:') throw new Error('HTTPS 시험 주소가 필요합니다.');
  const code = await createCode();
  const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/auth-probe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }), signal: AbortSignal.timeout(25_000),
  });
  const result: unknown = await response.json();
  if (!response.ok || !isRecord(result) || result.authenticated !== true) {
    throw new Error('무료 인증 연결을 확인하지 못했습니다. 실제 토스에서 다시 시도해 주세요.');
  }
}
