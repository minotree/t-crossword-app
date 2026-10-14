BEGIN;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  hint_balance INTEGER NOT NULL DEFAULT 10 CHECK (hint_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.user_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_profiles TO authenticated;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.user_profiles;
CREATE POLICY "Users can read their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE OR REPLACE FUNCTION public.consume_user_hint()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;

  UPDATE public.user_profiles
  SET hint_balance = hint_balance - 1,
      updated_at = NOW()
  WHERE id = auth.uid()
    AND hint_balance > 0
  RETURNING hint_balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_hint_balance' USING ERRCODE = 'P0001';
  END IF;

  RETURN v_balance;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_user_hint() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_user_hint() TO authenticated;

CREATE OR REPLACE FUNCTION public.grant_ad_reward_hints(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_balance INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount < 1 OR p_amount > 5 THEN
    RAISE EXCEPTION 'invalid_ad_reward' USING ERRCODE = '22023';
  END IF;

  UPDATE public.user_profiles
  SET hint_balance = hint_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING hint_balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_balance;
END;
$function$;

REVOKE ALL ON FUNCTION public.grant_ad_reward_hints(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_ad_reward_hints(UUID, INTEGER) TO service_role;

COMMIT;
