BEGIN;

-- Completion is currently checked by the app; this ledger prevents duplicate
-- requests for the same round, not forged completion claims by modified clients.
CREATE TABLE public.puzzle_completion_rewards (
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  round_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, round_id)
);
ALTER TABLE public.puzzle_completion_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.puzzle_completion_rewards FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.claim_puzzle_completion_reward(p_round_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;
  IF p_round_id IS NULL THEN
    RAISE EXCEPTION 'invalid_round_id' USING ERRCODE = '22023';
  END IF;

  -- Serialize grants and hint consumption on the same balance row.
  SELECT hint_balance INTO v_balance FROM public.user_profiles
  WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.puzzle_completion_rewards(user_id, round_id)
  VALUES (v_user_id, p_round_id) ON CONFLICT DO NOTHING;
  IF FOUND THEN
    UPDATE public.user_profiles SET hint_balance = hint_balance + 5, updated_at = NOW()
    WHERE id = v_user_id RETURNING hint_balance INTO v_balance;
  END IF;
  RETURN v_balance;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_puzzle_completion_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_puzzle_completion_reward(UUID) TO authenticated;

COMMIT;
