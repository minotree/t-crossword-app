BEGIN;
DO $$
DECLARE
  v_identity TEXT := encode(sha256(gen_random_uuid()::text::bytea),'hex');
  v_session TEXT := encode(sha256(gen_random_uuid()::text::bytea),'hex');
  v_renewed TEXT := encode(sha256(gen_random_uuid()::text::bytea),'hex');
  v_request UUID := gen_random_uuid(); v_round UUID := gen_random_uuid();
  v_fingerprint TEXT := repeat('f',64); v_first JSONB; v_replay JSONB; v_denied BOOLEAN := false;
  v_puzzle TEXT := '{"size":8,"level":"beginner","words":[{"id":"verification-sea","word":"SEA","hintLimit":1}],"grid":[]}';
BEGIN
  PERFORM public.open_toss_hint_session(v_identity,v_session);
  v_first := public.save_toss_round_creation(v_session,v_request,v_fingerprint,v_round,v_puzzle);
  v_replay := public.save_toss_round_creation(v_session,v_request,v_fingerprint,gen_random_uuid(),v_puzzle);
  IF v_first <> v_replay THEN RAISE EXCEPTION 'verification_replay_failed'; END IF;
  IF (SELECT count(*) FROM public.toss_hint_rounds WHERE identity_hash=v_identity) <> 1 THEN RAISE EXCEPTION 'verification_duplicate_round'; END IF;
  PERFORM public.consume_toss_round_hint(v_session,v_round,'verification-sea',0,gen_random_uuid());
  PERFORM public.open_toss_hint_session(v_identity,v_renewed);
  v_replay := public.get_toss_round_creation(v_renewed,v_request,v_fingerprint);
  IF (v_replay->>'balance')::integer <> 9 OR (v_replay->>'roundId')::uuid <> v_round THEN RAISE EXCEPTION 'verification_renewed_session_failed'; END IF;
  BEGIN
    PERFORM public.get_toss_round_creation(v_session,v_request,repeat('e',64));
  EXCEPTION WHEN SQLSTATE '22023' THEN v_denied := SQLERRM='round_request_mismatch'; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'verification_mismatch_failed'; END IF;
  v_replay := public.submit_toss_round_answer(v_session,v_round,'verification-sea','SEA');
  IF (v_replay->>'balance')::integer <> 14 THEN RAISE EXCEPTION 'verification_reward_failed'; END IF;
  v_replay := public.submit_toss_round_answer(v_session,v_round,'verification-sea','SEA');
  IF (v_replay->>'balance')::integer <> 14 THEN RAISE EXCEPTION 'verification_duplicate_reward'; END IF;
END;
$$;
ROLLBACK;
SELECT 'passed_rolled_back' AS verification;
