export type { Database, SupabaseClient, UserProfile } from './supabaseClient.js';
export { getSupabaseClient } from './supabaseClient.js';
export { getUserHintBalance, consumeGlobalHint, claimAdReward, InsufficientHintError } from './hintManager.js';
