import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL 또는 Anon Key가 .env.local 파일에 설정되지 않았습니다. ' +
    '파일 위치, 변수명, 서버 재시작 여부를 확인해주세요.'
  );
}

// Supabase 프로젝트에서 추출한 참조 ID
const supabaseRef = supabaseUrl.split('//')[1]?.split('.')[0];

console.log('Supabase 클라이언트 초기화:', {
  url: supabaseUrl,
  ref: supabaseRef,
  hasAnonKey: !!supabaseAnonKey
});

export const supabase = createBrowserClient(
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
            console.log(`로컬 스토리지에서 읽기 - ${key}:`, item ? '데이터 존재' : '데이터 없음');
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
            console.log(`로컬 스토리지에 저장 - ${key}:`, '저장 완료');
          } catch (error) {
            console.error('로컬 스토리지 저장 에러:', error);
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.removeItem(key);
            console.log(`로컬 스토리지에서 삭제 - ${key}:`, '삭제 완료');
          } catch (error) {
            console.error('로컬 스토리지 삭제 에러:', error);
          }
        },
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);