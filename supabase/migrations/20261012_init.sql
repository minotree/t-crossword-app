-- user_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hint_balance INTEGER NOT NULL DEFAULT 10,
  CHECK (hint_balance >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 행 SELECT 허용 정책
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 본인 행 UPDATE 허용 정책
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 신규 유저 생성 시 기본 행 자동 생성 트리거 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, hint_balance)
  VALUES (NEW.id, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 작성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 광고 리워드 힌트 충전 RPC 함수
CREATE OR REPLACE FUNCTION grant_ad_reward_hints(p_user_id UUID, p_amount INT)
RETURNS INT AS $$
DECLARE
  v_new_balance INT;
BEGIN
  UPDATE user_profiles
  SET hint_balance = hint_balance + p_amount,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id
  RETURNING hint_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다: %', p_user_id;
  END IF;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
