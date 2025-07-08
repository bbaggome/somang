import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  console.log('=== 콜백 라우트 시작 ===');
  console.log('URL:', requestUrl.toString());
  console.log('Code 존재:', !!code);
  console.log('Error:', error);

  if (error) {
    console.error('OAuth 에러:', error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('코드가 없습니다');
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: false,
                sameSite: 'lax',
              });
            });
          } catch (error) {
            console.error('쿠키 설정 에러:', error);
          }
        },
      },
    }
  );

  try {
    console.log('세션 교환 시작...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('세션 교환 에러:', exchangeError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=session_exchange_failed`);
    }

    console.log('세션 교환 성공:', {
      userId: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session,
    });

    if (!data.user || !data.session) {
      console.error('사용자 또는 세션이 없습니다');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user_session`);
    }

    // 프로필 생성 대기
    console.log('프로필 생성 대기...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('메인 페이지로 리디렉션');
    return NextResponse.redirect(requestUrl.origin);

  } catch (error) {
    console.error('콜백 처리 중 예외:', error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_exception`);
  }
}