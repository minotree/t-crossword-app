import { parseHintReveal, parseHintAnswer } from '@t-crossword/contracts';
import type { SupabaseClient } from './supabaseClient.js';

export class TossHintError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'TossHintError'; }
}

function fail(error: { code: string; message: string }): never {
  const messages: Record<string, string> = {
    toss_session_expired: '사용자 확인이 필요합니다.',
    toss_round_unavailable: '이 퍼즐의 힌트를 더 이상 사용할 수 없습니다. 새 퍼즐을 시작해 주세요.',
    word_hint_limit: '이 단어의 힌트를 모두 사용했습니다.',
    insufficient_hint_balance: '남은 힌트가 없습니다.',
    word_already_solved: '이미 완성한 단어입니다.',
    too_many_rounds: '새 퍼즐 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  };
  const known = Object.hasOwn(messages, error.message);
  throw new TossHintError(error.code === '28000' ? 'unauthorized' : known ? error.message : 'hint_failed',
    known ? messages[error.message] : '힌트 요청을 처리하지 못했습니다. 다시 시도해 주세요.');
}

/** Trusted server only: the supplied client must use a server-side service key. */
export function createTossHintRepository(client: SupabaseClient) {
  return {
    async openSession(identityHash: string, sessionHash: string) {
      const { data, error } = await client.rpc('open_toss_hint_session', { p_identity_hash: identityHash, p_session_hash: sessionHash });
      if (error) fail(error); return data;
    },
    async balance(sessionHash: string) {
      const { data, error } = await client.rpc('get_toss_hint_balance', { p_session_hash: sessionHash });
      if (error) fail(error); return data;
    },
    async startRound(sessionHash: string, roundId: string, words: { id: string; answer: string; hintLimit: number }[]) {
      const { data, error } = await client.rpc('register_toss_hint_round', { p_session_hash: sessionHash, p_round_id: roundId, p_words: words });
      if (error) fail(error); return data;
    },
    async reveal(sessionHash: string, roundId: string, wordId: string, index: number, requestId: string) {
      const { data, error } = await client.rpc('consume_toss_round_hint', { p_session_hash: sessionHash, p_round_id: roundId, p_word_id: wordId, p_index: index, p_request_id: requestId });
      if (error) fail(error); return parseHintReveal(data);
    },
    async answer(sessionHash: string, roundId: string, wordId: string, answer: string) {
      const { data, error } = await client.rpc('submit_toss_round_answer', { p_session_hash: sessionHash, p_round_id: roundId, p_word_id: wordId, p_answer: answer });
      if (error) fail(error); return parseHintAnswer(data);
    },
  };
}
