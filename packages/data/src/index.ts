export type { Database, SupabaseClient, UserProfile } from './supabaseClient.js';
export { getSupabaseClient } from './supabaseClient.js';
export { createTossHintRepository, TossHintError } from './tossHintRepository.js';
export { getUserHintBalance, consumeGlobalHint, claimAdReward, claimPuzzleCompletionReward, InsufficientHintError } from './hintManager.js';
