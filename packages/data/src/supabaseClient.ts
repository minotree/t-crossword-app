import { createClient } from '@supabase/supabase-js';

export type SupabaseClient = ReturnType<typeof createClient>;

export function getSupabaseClient(
  url?: string,
  anonKey?: string
): SupabaseClient {
  const apiUrl = url || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const apiKey = anonKey || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'Supabase URL 또는 키가 설정되지 않았습니다. 환경 변수 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_KEY 중 하나를 설정해주세요.'
    );
  }

  return createClient(apiUrl, apiKey);
}
