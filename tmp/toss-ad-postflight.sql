SELECT c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon','public.toss_test_ad_rewards','SELECT') AS anon_read,
  has_table_privilege('authenticated','public.toss_test_ad_rewards','INSERT') AS client_insert,
  has_function_privilege('anon','public.toss_test_ad_reward(text,uuid,boolean)','EXECUTE') AS anon_execute,
  has_function_privilege('authenticated','public.toss_test_ad_reward(text,uuid,boolean)','EXECUTE') AS client_execute,
  has_function_privilege('service_role','public.toss_test_ad_reward(text,uuid,boolean)','EXECUTE') AS server_execute
FROM pg_class c WHERE c.oid='public.toss_test_ad_rewards'::regclass;
