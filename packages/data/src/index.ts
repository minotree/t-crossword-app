export type { Database, SupabaseClient, UserProfile } from './supabaseClient.js';
export { getSupabaseClient } from './supabaseClient.js';
export { getUserHintBalance, consumeGlobalHint, claimAdReward, claimPuzzleCompletionReward, InsufficientHintError } from './hintManager.js';
