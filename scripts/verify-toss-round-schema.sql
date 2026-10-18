SELECT c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS anon_table_access,
  has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS authenticated_table_access,
  (SELECT count(*) FROM public.toss_hint_players) AS players,
  (SELECT count(*) FROM public.toss_hint_rounds) AS rounds,
  (SELECT sum(balance) FROM public.toss_hint_players) AS total_hint_balance,
  (SELECT count(*) FROM public.toss_round_creations) AS replay_rows
FROM pg_class c WHERE c.oid = 'public.toss_round_creations'::regclass;
SELECT p.proname, p.prosecdef AS security_definer,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') AS server_execute,
  EXISTS(SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('get_toss_round_creation','save_toss_round_creation');
