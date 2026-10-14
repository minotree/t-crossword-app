import type { SupabaseClient } from './supabaseClient.js';

export interface HintError extends Error {
  code?: string;
  message: string;
}

export class InsufficientHintError extends Error implements HintError {
  constructor(message = '힌트가 부족합니다.') {
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
    throw new Error(`사용자 프로필 조회 실패: ${error.message}`);
  }

  return data?.hint_balance ?? 10;
}

export async function consumeGlobalHint(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const currentBalance = await getUserHintBalance(client, userId);

  if (currentBalance < 1) {
    throw new InsufficientHintError();
  }

  const { data, error } = await client
    .from('user_profiles')
    .update({
      hint_balance: currentBalance - 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('hint_balance')
    .single();

  if (error) {
    throw new Error(`힌트 소비 실패: ${error.message}`);
  }

  return data.hint_balance;
}

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
    throw new Error(`광고 리워드 충전 실패: ${error.message}`);
  }

  return data;
}
