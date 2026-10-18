BEGIN;

-- Server-only replay snapshots; scoped to verified identity, not a short-lived session.
CREATE TABLE public.toss_round_creations (
  identity_hash TEXT NOT NULL REFERENCES public.toss_hint_players(identity_hash),
  request_id UUID NOT NULL,
  fingerprint TEXT NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  round_id UUID REFERENCES public.toss_hint_rounds(id),
  puzzle JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (identity_hash, request_id)
);
ALTER TABLE public.toss_round_creations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.toss_round_creations FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_toss_round_creation(p_session_hash TEXT, p_request_id UUID, p_fingerprint TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_identity TEXT; v_balance INTEGER; v_saved public.toss_round_creations%ROWTYPE;
BEGIN
  SELECT s.identity_hash, p.balance INTO v_identity, v_balance FROM public.toss_hint_sessions s
  JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > NOW();
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  IF p_request_id IS NULL OR p_fingerprint IS NULL OR p_fingerprint !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_round_request' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_saved FROM public.toss_round_creations WHERE identity_hash = v_identity AND request_id = p_request_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_saved.fingerprint <> p_fingerprint THEN RAISE EXCEPTION 'round_request_mismatch' USING ERRCODE = '22023'; END IF;
  IF v_saved.created_at < NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'round_request_expired' USING ERRCODE = 'P0002';
  END IF;
  RETURN jsonb_build_object('roundId', v_saved.round_id, 'puzzle', v_saved.puzzle, 'balance', v_balance);
END;
$$;

CREATE FUNCTION public.save_toss_round_creation(p_session_hash TEXT, p_request_id UUID, p_fingerprint TEXT, p_round_id UUID, p_puzzle TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_identity TEXT; v_balance INTEGER; v_saved JSONB; v_puzzle JSONB; v_words JSONB;
BEGIN
  -- All wallet writes take this same player lock first. Recheck after acquiring it.
  SELECT s.identity_hash, p.balance INTO v_identity, v_balance FROM public.toss_hint_sessions s
  JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > NOW() FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  v_saved := public.get_toss_round_creation(p_session_hash, p_request_id, p_fingerprint);
  IF v_saved IS NOT NULL THEN RETURN v_saved; END IF;
  v_puzzle := p_puzzle::JSONB;
  IF v_puzzle IS NULL OR jsonb_typeof(v_puzzle) <> 'object' OR
     jsonb_typeof(v_puzzle->'words') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid_round' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(v_puzzle->'words') > 0 THEN
    IF p_round_id IS NULL THEN RAISE EXCEPTION 'invalid_round' USING ERRCODE = '22023'; END IF;
    SELECT jsonb_agg(jsonb_build_object('id', w->>'id', 'answer', upper(w->>'word'), 'hintLimit', w->'hintLimit'))
    INTO v_words FROM jsonb_array_elements(v_puzzle->'words') w;
    v_balance := public.register_toss_hint_round(p_session_hash, p_round_id, v_words);
  ELSIF p_round_id IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_round' USING ERRCODE = '22023';
  ELSE
    -- Empty results must not bypass the existing per-player creation budget.
    IF (SELECT count(*) FROM public.toss_round_creations WHERE identity_hash = v_identity AND round_id IS NULL
        AND created_at > NOW() - INTERVAL '1 hour') >= 60 THEN
      RAISE EXCEPTION 'too_many_rounds' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  INSERT INTO public.toss_round_creations(identity_hash, request_id, fingerprint, round_id, puzzle)
  VALUES(v_identity, p_request_id, p_fingerprint, p_round_id, v_puzzle);
  RETURN jsonb_build_object('roundId', p_round_id, 'puzzle', v_puzzle, 'balance', v_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.get_toss_round_creation(TEXT,UUID,TEXT), public.save_toss_round_creation(TEXT,UUID,TEXT,UUID,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_toss_round_creation(TEXT,UUID,TEXT), public.save_toss_round_creation(TEXT,UUID,TEXT,UUID,TEXT) TO service_role;
COMMIT;
