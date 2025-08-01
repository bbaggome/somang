-- Create Expo Push tokens table for 2025 latest push notifications
-- supabase/migrations/create_expo_tokens_table.sql

-- Expo Push 토큰 저장 테이블 (2025 최신 방식)
CREATE TABLE IF NOT EXISTS user_expo_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expo_push_token text NOT NULL,
  device_push_token text, -- Native FCM/APNs token (optional)
  device_info jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 동일한 사용자+Expo토큰 조합은 유일해야 함
  UNIQUE(user_id, expo_push_token)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_expo_tokens_user_id ON user_expo_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_expo_tokens_active ON user_expo_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_expo_tokens_expo_token ON user_expo_tokens(expo_push_token);
CREATE INDEX IF NOT EXISTS idx_user_expo_tokens_device_token ON user_expo_tokens(device_push_token) WHERE device_push_token IS NOT NULL;

-- RLS (Row Level Security) 활성화
ALTER TABLE user_expo_tokens ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 Expo 토큰만 관리 가능
CREATE POLICY "Users can manage own Expo tokens" ON user_expo_tokens
FOR ALL USING (auth.uid() = user_id);

-- 서비스 역할은 모든 토큰에 접근 가능 (Edge Function에서 사용)
CREATE POLICY "Service role can access all Expo tokens" ON user_expo_tokens
FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_expo_tokens_updated_at 
    BEFORE UPDATE ON user_expo_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Expo 토큰 중복 처리 함수 (UPSERT)
CREATE OR REPLACE FUNCTION upsert_expo_token(
  p_user_id uuid,
  p_expo_push_token text,
  p_device_push_token text DEFAULT NULL,
  p_device_info jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  token_id uuid;
BEGIN
  -- Expo 토큰 존재 여부 확인 후 업데이트 또는 삽입
  INSERT INTO user_expo_tokens (user_id, expo_push_token, device_push_token, device_info, is_active)
  VALUES (p_user_id, p_expo_push_token, p_device_push_token, p_device_info, true)
  ON CONFLICT (user_id, expo_push_token) 
  DO UPDATE SET 
    device_push_token = EXCLUDED.device_push_token,
    device_info = EXCLUDED.device_info,
    is_active = true,
    updated_at = timezone('utc'::text, now())
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 비활성 Expo 토큰 정리 함수 (주기적으로 실행 권장)
CREATE OR REPLACE FUNCTION cleanup_inactive_expo_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 30일 이상 비활성 상태인 토큰들 삭제
  DELETE FROM user_expo_tokens 
  WHERE is_active = false 
    AND updated_at < (now() - interval '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자별 활성 Expo 토큰 조회 함수
CREATE OR REPLACE FUNCTION get_user_expo_tokens(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  expo_push_token text,
  device_push_token text,
  device_info jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uet.id,
    uet.expo_push_token,
    uet.device_push_token,
    uet.device_info,
    uet.created_at,
    uet.updated_at
  FROM user_expo_tokens uet
  WHERE uet.user_id = p_user_id 
    AND uet.is_active = true
  ORDER BY uet.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 견적 알림 발송 로그 테이블 (옵션)
CREATE TABLE IF NOT EXISTS quote_notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL DEFAULT 'expo_push',
  expo_push_token text,
  notification_title text,
  notification_body text,
  notification_data jsonb DEFAULT '{}',
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  success boolean DEFAULT false,
  error_message text,
  receipt_id text -- Expo Push Service receipt ID
);

-- 알림 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_quote_notification_logs_quote_id ON quote_notification_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_notification_logs_user_id ON quote_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_notification_logs_sent_at ON quote_notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_quote_notification_logs_success ON quote_notification_logs(success);

-- 댓글 추가
COMMENT ON TABLE user_expo_tokens IS 'Expo Push 알림을 위한 디바이스 토큰 저장 (2025 최신)';
COMMENT ON COLUMN user_expo_tokens.expo_push_token IS 'Expo Push Service 토큰';
COMMENT ON COLUMN user_expo_tokens.device_push_token IS '네이티브 FCM/APNs 토큰 (선택사항)';
COMMENT ON COLUMN user_expo_tokens.device_info IS '디바이스 정보 (OS, 버전, 모델 등)';
COMMENT ON COLUMN user_expo_tokens.is_active IS '토큰 활성 상태';
COMMENT ON FUNCTION upsert_expo_token IS 'Expo 토큰 추가/업데이트 (중복 처리)';
COMMENT ON FUNCTION cleanup_inactive_expo_tokens IS '비활성 Expo 토큰 정리 (30일 이상)';
COMMENT ON FUNCTION get_user_expo_tokens IS '사용자별 활성 Expo 토큰 조회';
COMMENT ON TABLE quote_notification_logs IS '견적 알림 발송 로그';