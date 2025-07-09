import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 검증 강화
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경 변수가 누락되었습니다.\n' +
    '다음을 확인해주세요:\n' +
    '1. .env.local 파일이 프로젝트 루트에 있는지\n' +
    '2. NEXT_PUBLIC_SUPABASE_URL 설정 확인\n' +
    '3. NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 확인\n' +
    '4. 개발 서버 재시작'
  );
}

// URL 형식 검증
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error(`잘못된 Supabase URL 형식: ${supabaseUrl}`);
}

// Supabase 프로젝트 참조 ID 추출
const supabaseRef = supabaseUrl.split('//')[1]?.split('.')[0];
if (!supabaseRef) {
  throw new Error('Supabase 참조 ID를 추출할 수 없습니다.');
}

// 개발 환경에서만 로그 출력 (한 번만)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase 클라이언트 초기화:', {
    url: supabaseUrl,
    ref: supabaseRef,
    hasAnonKey: !!supabaseAnonKey
  });
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storageKey: `sb-${supabaseRef}-auth-token`,
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          try {
            const item = window.localStorage.getItem(key);
            // 로그 빈도 줄임 - 중요한 것만 출력
            return item;
          } catch (error) {
            console.error('로컬 스토리지 읽기 에러:', error);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.setItem(key, value);
            // 로그 빈도 줄임
          } catch (error) {
            console.error('로컬 스토리지 저장 에러:', error);
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.removeItem(key);
            // 로그 빈도 줄임
          } catch (error) {
            console.error('로컬 스토리지 삭제 에러:', error);
          }
        },
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // 토큰 갱신 빈도 조정
      flowType: 'pkce',
    },
  }
);