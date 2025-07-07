import { createBrowserClient } from '@supabase/ssr'; //

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; //
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; //

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL 또는 Anon Key가 .env.local 파일에 설정되지 않았습니다. ' +
    '파일 위치, 변수명, 서버 재시작 여부를 확인해주세요.'
  );
}

// 제안: 아래 주석을 현재 코드에 맞게 수정하세요.
// 현재 코드는 createBrowserClient를 올바르게 사용하고 있습니다.
// 클라이언트 컴포넌트에서는 createBrowserClient를 사용합니다.
export const supabase = createBrowserClient( supabaseUrl, supabaseAnonKey ); //