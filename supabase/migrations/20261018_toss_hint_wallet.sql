BEGIN;

-- These tables and RPCs are server-only. Browser auth roles receive no access.
CREATE TABLE public.toss_hint_players (
  identity_hash TEXT PRIMARY KEY CHECK (identity_hash ~ '^[a-f0-9]{64}$'),
  balance INTEGER NOT NULL DEFAULT 10 CHECK (balance >= 0)
);
CREATE TABLE public.toss_hint_sessions (
  token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  identity_hash TEXT NOT NULL REFERENCES public.toss_hint_players(identity_hash),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);
CREATE TABLE public.toss_hint_rounds (
  id UUID PRIMARY KEY,
  identity_hash TEXT NOT NULL REFERENCES public.toss_hint_players(identity_hash),
  words JSONB NOT NULL CHECK (jsonb_typeof(words) = 'array'),
  hints JSONB NOT NULL DEFAULT '{}',
  solved TEXT[] NOT NULL DEFAULT '{}',
  rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX toss_hint_rounds_player_idx ON public.toss_hint_rounds(identity_hash);
CREATE TABLE public.toss_hint_requests (
  round_id UUID NOT NULL REFERENCES public.toss_hint_rounds(id),
  request_id UUID NOT NULL,
  word_id TEXT NOT NULL,
  letter_index INTEGER NOT NULL,
  PRIMARY KEY (round_id, request_id)
);

ALTER TABLE public.toss_hint_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toss_hint_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toss_hint_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toss_hint_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.toss_hint_players, public.toss_hint_sessions, public.toss_hint_rounds, public.toss_hint_requests FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.open_toss_hint_session(p_identity_hash TEXT, p_session_hash TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_balance INTEGER;
BEGIN
  INSERT INTO public.toss_hint_players(identity_hash) VALUES (p_identity_hash) ON CONFLICT DO NOTHING;
  INSERT INTO public.toss_hint_sessions(token_hash, identity_hash) VALUES (p_session_hash, p_identity_hash);
  SELECT balance INTO v_balance FROM public.toss_hint_players WHERE identity_hash = p_identity_hash;
  RETURN v_balance;
END;
$$;

CREATE FUNCTION public.get_toss_hint_balance(p_session_hash TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_balance INTEGER;
BEGIN
  SELECT p.balance INTO v_balance FROM public.toss_hint_sessions s
  JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > NOW();
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  RETURN v_balance;
END;
$$;

CREATE FUNCTION public.register_toss_hint_round(p_session_hash TEXT, p_round_id UUID, p_words JSONB)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_identity TEXT; v_balance INTEGER;
BEGIN
  SELECT s.identity_hash, p.balance INTO v_identity, v_balance FROM public.toss_hint_sessions s
  JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > NOW() FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  IF (SELECT count(*) FROM public.toss_hint_rounds WHERE identity_hash = v_identity AND created_at > NOW() - INTERVAL '1 hour') >= 60 THEN
    RAISE EXCEPTION 'too_many_rounds' USING ERRCODE = 'P0001';
  END IF;
  IF p_words IS NULL OR jsonb_typeof(p_words) <> 'array' OR jsonb_array_length(p_words) < 1 OR jsonb_array_length(p_words) > 144 THEN
    RAISE EXCEPTION 'invalid_round' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_words) w WHERE
    coalesce(w->>'id', '') = '' OR coalesce(w->>'answer', '') !~ '^[A-Z]{3,12}$' OR
    NOT (w ? 'hintLimit') OR (w->>'hintLimit')::INTEGER NOT BETWEEN 0 AND 3) THEN
    RAISE EXCEPTION 'invalid_round' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(DISTINCT w->>'id') FROM jsonb_array_elements(p_words) w) <> jsonb_array_length(p_words) THEN
    RAISE EXCEPTION 'invalid_round' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.toss_hint_rounds(id, identity_hash, words) VALUES(p_round_id, v_identity, p_words);
  RETURN v_balance;
END;
$$;

CREATE FUNCTION public.consume_toss_round_hint(p_session_hash TEXT, p_round_id UUID, p_word_id TEXT, p_index INTEGER, p_request_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_identity TEXT; v_balance INTEGER; v_round public.toss_hint_rounds%ROWTYPE;
  v_word JSONB; v_indices JSONB; v_previous public.toss_hint_requests%ROWTYPE;
BEGIN
  SELECT s.identity_hash, p.balance INTO v_identity, v_balance FROM public.toss_hint_sessions s
  JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > NOW() FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_round FROM public.toss_hint_rounds WHERE id = p_round_id AND identity_hash = v_identity FOR UPDATE;
  IF NOT FOUND OR v_round.created_at < NOW() - INTERVAL '24 hours' THEN RAISE EXCEPTION 'toss_round_unavailable' USING ERRCODE = 'P0002'; END IF;
  SELECT w INTO v_word FROM jsonb_array_elements(v_round.words) w WHERE w->>'id' = p_word_id;
  IF v_word IS NULL OR p_index IS NULL OR p_index < 0 OR p_index >= length(v_word->>'answer') OR p_request_id IS NULL THEN
    RAISE EXCEPTION 'invalid_hint_target' USING ERRCODE = '22023';
  END IF;
  v_indices := coalesce(v_round.hints->p_word_id, '[]'::JSONB);
  SELECT * INTO v_previous FROM public.toss_hint_requests WHERE round_id = p_round_id AND request_id = p_request_id;
  IF FOUND THEN
    IF v_previous.word_id <> p_word_id OR v_previous.letter_index <> p_index THEN RAISE EXCEPTION 'hint_request_mismatch' USING ERRCODE = '22023'; END IF;
  ELSIF NOT v_indices @> to_jsonb(ARRAY[p_index]) THEN
    IF p_word_id = ANY(v_round.solved) THEN RAISE EXCEPTION 'word_already_solved' USING ERRCODE = 'P0001'; END IF;
    IF jsonb_array_length(v_indices) >= (v_word->>'hintLimit')::INTEGER THEN RAISE EXCEPTION 'word_hint_limit' USING ERRCODE = 'P0001'; END IF;
    IF v_balance <= 0 THEN RAISE EXCEPTION 'insufficient_hint_balance' USING ERRCODE = 'P0001'; END IF;
    UPDATE public.toss_hint_players SET balance = balance - 1 WHERE identity_hash = v_identity RETURNING balance INTO v_balance;
    v_indices := v_indices || to_jsonb(p_index);
    UPDATE public.toss_hint_rounds SET hints = jsonb_set(hints, ARRAY[p_word_id], v_indices) WHERE id = p_round_id;
  END IF;
  INSERT INTO public.toss_hint_requests(round_id, request_id, word_id, letter_index)
  VALUES(p_round_id, p_request_id, p_word_id, p_index) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('balance', v_balance, 'index', p_index, 'letter', substr(v_word->>'answer', p_index + 1, 1), 'used', jsonb_array_length(v_indices));
END;
$$;

CREATE FUNCTION public.submit_toss_round_answer(p_session_hash TEXT, p_round_id UUID, p_word_id TEXT, p_answer TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_identity TEXT; v_balance INTEGER; v_round public.toss_hint_rounds%ROWTYPE; v_word JSONB; v_completed BOOLEAN;
BEGIN
  SELECT s.identity_hash, p.balance INTO v_identity, v_balance FROM public.toss_hint_sessions s
  JOIN public.toss_hint_players p USING(identity_hash)
  WHERE s.token_hash = p_session_hash AND s.expires_at > NOW() FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'toss_session_expired' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_round FROM public.toss_hint_rounds WHERE id = p_round_id AND identity_hash = v_identity FOR UPDATE;
  IF NOT FOUND OR v_round.created_at < NOW() - INTERVAL '24 hours' THEN RAISE EXCEPTION 'toss_round_unavailable' USING ERRCODE = 'P0002'; END IF;
  SELECT w INTO v_word FROM jsonb_array_elements(v_round.words) w WHERE w->>'id' = p_word_id;
  IF v_word IS NULL THEN RAISE EXCEPTION 'invalid_word' USING ERRCODE = '22023'; END IF;
  IF upper(trim(p_answer)) IS DISTINCT FROM v_word->>'answer' THEN
    RETURN jsonb_build_object('correct', false, 'balance', v_balance, 'completed', v_round.rewarded);
  END IF;
  IF NOT p_word_id = ANY(v_round.solved) THEN v_round.solved := array_append(v_round.solved, p_word_id); END IF;
  v_completed := cardinality(v_round.solved) = jsonb_array_length(v_round.words);
  IF v_completed AND NOT v_round.rewarded THEN
    UPDATE public.toss_hint_players SET balance = balance + 5 WHERE identity_hash = v_identity RETURNING balance INTO v_balance;
  END IF;
  UPDATE public.toss_hint_rounds SET solved = v_round.solved, rewarded = v_completed OR v_round.rewarded WHERE id = p_round_id;
  RETURN jsonb_build_object('correct', true, 'balance', v_balance, 'completed', v_completed);
END;
$$;

REVOKE ALL ON FUNCTION public.open_toss_hint_session(TEXT, TEXT), public.get_toss_hint_balance(TEXT), public.register_toss_hint_round(TEXT, UUID, JSONB), public.consume_toss_round_hint(TEXT, UUID, TEXT, INTEGER, UUID), public.submit_toss_round_answer(TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_toss_hint_session(TEXT, TEXT), public.get_toss_hint_balance(TEXT), public.register_toss_hint_round(TEXT, UUID, JSONB), public.consume_toss_round_hint(TEXT, UUID, TEXT, INTEGER, UUID), public.submit_toss_round_answer(TEXT, UUID, TEXT, TEXT) TO service_role;
COMMIT;
