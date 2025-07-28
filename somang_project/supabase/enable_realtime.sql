-- Supabase에서 실행할 SQL
-- quotes 테이블에 Realtime 활성화

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;

-- 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';