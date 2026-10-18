import type { SupabaseClient } from './supabaseClient.js';

export interface HintError extends Error {
  code?: string;
  message: string;
}

export class InsufficientHintError extends Error implements HintError {
  constructor(message = 'Not enough hints.') {
    super(message);
    this.name = 'InsufficientHintError';
  }
}

export async function getUserHintBalance(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await client
    .from('user_profiles')
    .select('hint_balance')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to load user hint balance: ${error.message}`);
  }

  return data?.hint_balance ?? 10;
}

export async function consumeGlobalHint(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc('consume_user_hint');

  if (error) {
    if (error.code === 'P0001' && error.message === 'insufficient_hint_balance') {
      throw new InsufficientHintError();
    }
    throw new Error(`Failed to consume hint: ${error.message}`);
  }

  return data;
}

/** The server grants a fixed five hints once for this user's round ID. */
export async function claimPuzzleCompletionReward(client: SupabaseClient, roundId: string): Promise<number> {
  const { data, error } = await client.rpc('claim_puzzle_completion_reward', { p_round_id: roundId });
  if (error) throw new Error('완성 보상 힌트 5개를 지급하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
  return data;
}

/** Call only from a trusted server after verifying the ad reward. */
export async function claimAdReward(
  client: SupabaseClient,
  userId: string,
  amount: number
): Promise<number> {
  const { data, error } = await client.rpc('grant_ad_reward_hints', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(`Failed to grant ad reward hints: ${error.message}`);
  }

  return data;
}
