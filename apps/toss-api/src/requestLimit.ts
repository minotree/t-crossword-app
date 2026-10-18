type Bucket = { count: number; expiresAt: number };

/** Instance-local guard. It cannot enforce quotas across Edge workers. */
export function createRequestLimiter(now: () => number = Date.now) {
  const buckets = new Map<string, Bucket>();
  return (key: string, limit: number): number => {
    const time = now();
    for (const [storedKey, bucket] of buckets) {
      if (bucket.expiresAt <= time) buckets.delete(storedKey);
    }
    const bucket = buckets.get(key);
    if (bucket) {
      if (bucket.count >= limit) return Math.max(1, Math.ceil((bucket.expiresAt - time) / 1000));
      bucket.count += 1;
      return 0;
    }
    // Reject new identities rather than evicting an active limit under token churn.
    if (buckets.size >= 4096) return 60;
    buckets.set(key, { count: 1, expiresAt: time + 60_000 });
    return 0;
  };
}

export async function readLimitedBody(request: Request): Promise<string | null> {
  const maximum = 65_536;
  const length = request.headers.get('Content-Length');
  if (length && Number(length) > maximum) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
