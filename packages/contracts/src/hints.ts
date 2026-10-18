export interface HintReveal {
  balance: number;
  index: number;
  letter: string;
  used: number;
}

export interface HintAnswerResult {
  correct: boolean;
  balance: number;
  completed: boolean;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isHintBalance(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function parseHintReveal(value: unknown): HintReveal {
  if (!isRecord(value) || !isHintBalance(value.balance) || !isHintBalance(value.index) ||
      typeof value.letter !== 'string' || !/^[A-Z]$/.test(value.letter) || !isHintBalance(value.used) || value.used < 1 || value.used > 3 || value.index > 11) {
    throw new Error('힌트 응답을 확인하지 못했습니다.');
  }
  return { balance: value.balance, index: value.index, letter: value.letter, used: value.used };
}

export function parseHintAnswer(value: unknown): HintAnswerResult {
  if (!isRecord(value) || !isHintBalance(value.balance) || typeof value.correct !== 'boolean' || typeof value.completed !== 'boolean') {
    throw new Error('정답 응답을 확인하지 못했습니다.');
  }
  return { balance: value.balance, correct: value.correct, completed: value.completed };
}
