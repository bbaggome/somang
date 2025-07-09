import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 개발 환경에서만 로그 출력
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${message}`, data || '');
    }
  };

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname;
    debugLog(`Path: ${pathname}, User: ${user ? 'authenticated' : 'not authenticated'}`);

    // 에러가 있거나 사용자가 없는 경우 (인증되지 않음)
    if (error || !user) {
      // 이미 로그인 페이지에 있거나 인증 관련 경로면 그대로 진행
      if (pathname === '/login' || pathname.startsWith('/auth/')) {
        debugLog('Allowing access to login/auth page');
        return response;
      }

      // 보호된 페이지(메인 페이지)에 접근 시 로그인으로 리디렉션
      if (pathname === '/') {
        debugLog('Redirecting to login - user not authenticated');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // 기타 보호된 경로들도 로그인으로 리디렉션
      debugLog('Redirecting to login - protected route');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 사용자가 인증된 경우
    if (user) {
      // 로그인 페이지에 접근 시 메인 페이지로 리디렉션
      if (pathname === '/login') {
        debugLog('Redirecting to home - user already authenticated');
        return NextResponse.redirect(new URL('/', request.url));
      }

      // 인증된 사용자는 다른 모든 페이지에 접근 허용
      debugLog('Allowing access - user authenticated');
      return response;
    }

  } catch (error) {
    // 인증 확인 중 오류 발생 시 로그인 페이지로 리디렉션
    console.error('[Middleware] Auth check error:', error);
    
    if (request.nextUrl.pathname !== '/login' && !request.nextUrl.pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}