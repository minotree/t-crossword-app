SELECT to_regclass('public.toss_test_ad_rewards') IS NOT NULL AS ad_table_exists,
  to_regprocedure('public.toss_test_ad_reward(text,uuid,boolean)') IS NOT NULL AS ad_rpc_exists,
  to_regclass('public.toss_hint_players') IS NOT NULL AS wallet_exists;
