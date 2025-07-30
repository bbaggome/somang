-- Create FCM tokens table for mobile push notifications
-- supabase/migrations/create_fcm_tokens_table.sql

-- FCM 토큰 저장 테이블
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fcm_token text NOT NULL,
  device_info jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 동일한 사용자+토큰 조합은 유일해야 함
  UNIQUE(user_id, fcm_token)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_active ON user_fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_token ON user_fcm_tokens(fcm_token);

-- RLS (Row Level Security) 활성화
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 FCM 토큰만 관리 가능
CREATE POLICY "Users can manage own FCM tokens" ON user_fcm_tokens
FOR ALL USING (auth.uid() = user_id);

-- 서비스 역할은 모든 토큰에 접근 가능 (Edge Function에서 사용)
CREATE POLICY "Service role can access all FCM tokens" ON user_fcm_tokens
FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_fcm_tokens_updated_at 
    BEFORE UPDATE ON user_fcm_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- FCM 토큰 중복 처리 함수 (UPSERT)
CREATE OR REPLACE FUNCTION upsert_fcm_token(
  p_user_id uuid,
  p_fcm_token text,
  p_device_info jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  token_id uuid;
BEGIN
  -- FCM 토큰 존재 여부 확인 후 업데이트 또는 삽입
  INSERT INTO user_fcm_tokens (user_id, fcm_token, device_info, is_active)
  VALUES (p_user_id, p_fcm_token, p_device_info, true)
  ON CONFLICT (user_id, fcm_token) 
  DO UPDATE SET 
    device_info = EXCLUDED.device_info,
    is_active = true,
    updated_at = timezone('utc'::text, now())
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 비활성 FCM 토큰 정리 함수 (주기적으로 실행 권장)
CREATE OR REPLACE FUNCTION cleanup_inactive_fcm_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 30일 이상 비활성 상태인 토큰들 삭제
  DELETE FROM user_fcm_tokens 
  WHERE is_active = false 
    AND updated_at < (now() - interval '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 추가
COMMENT ON TABLE user_fcm_tokens IS 'FCM 푸시 알림을 위한 디바이스 토큰 저장';
COMMENT ON COLUMN user_fcm_tokens.fcm_token IS 'Firebase Cloud Messaging 토큰';
COMMENT ON COLUMN user_fcm_tokens.device_info IS '디바이스 정보 (OS, 버전, 모델 등)';
COMMENT ON COLUMN user_fcm_tokens.is_active IS '토큰 활성 상태';
COMMENT ON FUNCTION upsert_fcm_token IS 'FCM 토큰 추가/업데이트 (중복 처리)';
COMMENT ON FUNCTION cleanup_inactive_fcm_tokens IS '비활성 FCM 토큰 정리 (30일 이상 된 것들)';