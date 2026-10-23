interface Session { accessToken: string; refreshToken: string; expiresAt: number; userId: string }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function createAnonymousAuth(url: string, publicKey: string, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage, fetcher = fetch) {
  if (new URL(url).protocol !== 'https:') throw new Error('인증 서버는 HTTPS 주소가 필요합니다.');
  const key = 'mobile-anonymous-session-v1';
  let pending: Promise<string> | null = null;
  const token = async (refresh = false): Promise<string> => {
    const raw = storage.getItem(key);
    let current: Session | null = null;
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!record(parsed) || typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string' || typeof parsed.expiresAt !== 'number' || typeof parsed.userId !== 'string') throw new Error('인증 기록을 읽지 못했습니다. 기존 기록을 보존했습니다.');
      current = { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken, expiresAt: parsed.expiresAt, userId: parsed.userId };
    }
    if (current && !refresh && current.expiresAt > Date.now() + 60_000) return current.accessToken;
    const response = await fetcher(`${url.replace(/\/$/, '')}/auth/v1/${current ? 'token?grant_type=refresh_token' : 'signup'}`, {
      method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(current ? { refresh_token: current.refreshToken } : { data: {} }), signal: AbortSignal.timeout(15_000),
    });
    const value: unknown = await response.json();
    if (!response.ok || !record(value) || typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string' ||
        typeof value.expires_in !== 'number' || !Number.isFinite(value.expires_in) || value.expires_in <= 0 || !record(value.user) || typeof value.user.id !== 'string' || value.user.is_anonymous !== true ||
        (current && current.userId !== value.user.id)) throw new Error('비회원 인증을 확인하지 못했습니다. 기존 계정을 새로 만들지 않고 다시 시도합니다.');
    const session: Session = { accessToken: value.access_token, refreshToken: value.refresh_token, expiresAt: Date.now() + value.expires_in * 1000, userId: value.user.id };
    storage.setItem(key, JSON.stringify(session));
    return session.accessToken;
  };
  return { token(refresh = false) {
    if (!pending) pending = token(refresh).finally(() => { pending = null; });
    return pending;
  } };
}
