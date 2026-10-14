import { getSupabaseClient } from '@t-crossword/data';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? getSupabaseClient(supabaseUrl, supabaseAnonKey)
    : null;
