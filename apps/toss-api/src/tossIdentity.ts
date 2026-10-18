import { isRecord } from '@t-crossword/contracts';

export function parseTossIdentity(value: unknown): string {
  if (!isRecord(value) || value.resultType !== 'SUCCESS' || !isRecord(value.success) ||
      typeof value.success.anonKey !== 'string' || !value.success.anonKey || value.success.anonKey.length > 1024) {
    throw new Error('토스 사용자 확인에 실패했습니다. 다시 시도해 주세요.');
  }
  return value.success.anonKey;
}
