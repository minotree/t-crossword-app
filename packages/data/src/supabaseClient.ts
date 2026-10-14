import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';

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
