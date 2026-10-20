import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';
import type { HintReveal, HintAnswerResult } from '@t-crossword/contracts';

export type UserProfile = {
  id: string;
  hint_balance: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: {
          id: string;
          hint_balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hint_balance?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      toss_test_ad_reward: { Args: { p_session_hash: string; p_request_id: string; p_claim: boolean }; Returns: number };
      get_toss_round_creation: { Args: { p_session_hash: string; p_request_id: string; p_fingerprint: string }; Returns: unknown };
      save_toss_round_creation: { Args: { p_session_hash: string; p_request_id: string; p_fingerprint: string; p_round_id: string | null; p_puzzle: string }; Returns: unknown };
      open_toss_hint_session: { Args: { p_identity_hash: string; p_session_hash: string }; Returns: number };
      get_toss_hint_balance: { Args: { p_session_hash: string }; Returns: number };
      register_toss_hint_round: { Args: { p_session_hash: string; p_round_id: string; p_words: { id: string; answer: string; hintLimit: number }[] }; Returns: number };
      consume_toss_round_hint: { Args: { p_session_hash: string; p_round_id: string; p_word_id: string; p_index: number; p_request_id: string }; Returns: HintReveal };
      submit_toss_round_answer: { Args: { p_session_hash: string; p_round_id: string; p_word_id: string; p_answer: string }; Returns: HintAnswerResult };
      claim_puzzle_completion_reward: {
        Args: { p_round_id: string };
        Returns: number;
      };
      consume_user_hint: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      grant_ad_reward_hints: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type SupabaseClient = SupabaseClientBase<Database>;

export function getSupabaseClient(
  url?: string,
  anonKey?: string
): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon key must be provided.');
  }

  return createClient<Database>(url, anonKey);
}
