import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // ⛳️ createServerClient 가 요구하는 형태의 쿠키 객체 생성
    const cookieStore = await getCookies(); // 타입: ReadonlyRequestCookies

    // 수동으로 CookieMethodsServer 형태로 래핑 (필수 메소드 제공)
    const cookieHandler = {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    };

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieHandler, // ✅ 직접 래핑한 객체 전달
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin);
}
