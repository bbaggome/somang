import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-static';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // 성공적으로 세션이 교환되면 홈페이지로 리디렉션
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('세션 교환 실패:', error);
        return NextResponse.redirect(`${origin}/login?error=session_exchange_failed`);
      }
    } catch (err) {
      console.error('콜백 처리 중 오류:', err);
      return NextResponse.redirect(`${origin}/login?error=callback_error`);
    }
  }

  // code가 없는 경우
  return NextResponse.redirect(`${origin}/login?error=no_auth_code`);
}