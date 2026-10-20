BEGIN;

-- Test-ad callback claims only; this is not proof of a real ad impression.
CREATE TABLE public.toss_test_ad_rewards (
  identity_hash TEXT NOT NULL REFERENCES public.toss_hint_players(identity_hash),
  request_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (identity_hash, request_id)
);
ALTER TABLE public.toss_test_ad_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.toss_test_ad_rewards FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.toss_test_ad_reward(p_session_hash TEXT, p_request_id UUID, p_claim BOOLEAN)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_identity TEXT; v_balance INTEGER; v_reward public.toss_test_ad_rewards%ROWTYPE;
BEGIN
  SELECT s.identity_hash, p.balance INTO v_identity, v_balance
  FROM public.toss_hint_sessions s JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > now() FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  IF p_request_id IS NULL OR p_claim IS NULL THEN RAISE EXCEPTION 'invalid_ad_reward'; END IF;
  SELECT * INTO v_reward FROM public.toss_test_ad_rewards WHERE identity_hash = v_identity AND request_id = p_request_id;
  IF FOUND THEN
    IF v_reward.claimed_at IS NOT NULL THEN RETURN v_balance; END IF;
    IF v_reward.created_at < now() - INTERVAL '30 minutes' THEN RAISE EXCEPTION 'ad_reward_expired'; END IF;
    IF NOT p_claim THEN RETURN v_balance; END IF;
    UPDATE public.toss_hint_players SET balance = balance + 5 WHERE identity_hash = v_identity RETURNING balance INTO v_balance;
    UPDATE public.toss_test_ad_rewards SET claimed_at = now() WHERE identity_hash = v_identity AND request_id = p_request_id;
    RETURN v_balance;
  END IF;
  IF p_claim THEN RAISE EXCEPTION 'ad_reward_unavailable'; END IF;
  IF (SELECT count(*) FROM public.toss_test_ad_rewards WHERE identity_hash = v_identity AND created_at > now() - INTERVAL '24 hours') >= 10
    OR EXISTS (SELECT 1 FROM public.toss_test_ad_rewards WHERE identity_hash = v_identity AND created_at > now() - INTERVAL '1 minute')
    THEN RAISE EXCEPTION 'ad_reward_limit'; END IF;
  INSERT INTO public.toss_test_ad_rewards(identity_hash, request_id) VALUES(v_identity, p_request_id);
  RETURN v_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.toss_test_ad_reward(TEXT, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toss_test_ad_reward(TEXT, UUID, BOOLEAN) TO service_role;
COMMIT;
