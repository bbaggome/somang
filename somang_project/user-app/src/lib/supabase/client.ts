import { createClient } from '@supabase/supabase-js';

// ====================================================================
// 1. Supabase 클라이언트 설정
// ====================================================================
// 실제 프로젝트에서는 이 값들을 .env.local 파일에 저장하고
// process.env.NEXT_PUBLIC_SUPABASE_URL과 같이 불러와야 합니다.
const supabaseUrl = 'https://bbxycbghbatcovzuiotu.supabase.co'; // Supabase 대시보드 > Project Settings > API 에서 확인
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHljYmdoYmF0Y292enVpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDEwOTYsImV4cCI6MjA2NTc3NzA5Nn0.dvG6EzASvCOWQZ0AEHMseTV7WvgOnHNkt58NAviW5is'; // Supabase 대시보드 > Project Settings > API 에서 확인

// 앱 전체에서 사용할 Supabase 클라이언트 인스턴스 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);