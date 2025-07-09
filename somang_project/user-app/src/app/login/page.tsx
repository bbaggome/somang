'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';

// 카카오 로고 SVG 컴포넌트
const KakaoIcon = () => (
  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.73 0 3.36-.44 4.78-1.22-.16-.29-.31-.59-.44-.9-.55-1.24-.85-2.58-.85-3.88 0-4.42 3.58-8 8-8 .05 0 .09 0 .14.01-.1-.81-.3-1.6-.59-2.34C19.04 2.87 15.68 2 12 2z" />
  </svg>
);

// 로그인 페이지 컴포넌트
export default function LoginPage() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogginIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceShowLogin, setForceShowLogin] = useState(false);
  const redirectAttempted = useRef(false);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);

  // 디버그 로그
  console.log('[LoginPage] 상태:', { 
    hasUser: !!user, 
    hasProfile: !!profile,
    isAuthLoading,
    isLogginIn,
    forceShowLogin
  });

  // 로그인된 사용자 즉시 리디렉션 (최우선 처리)
  useEffect(() => {
    // 이미 리디렉션을 시도했거나 강제 표시 모드면 중단
    if (redirectAttempted.current || forceShowLogin) {
      return;
    }

    // 사용자가 있으면 즉시 메인으로 리디렉션 (프로필 체크 생략)
    if (user && !isAuthLoading) {
      console.log('[LoginPage] 이미 로그인됨 - 즉시 메인 페이지로 리디렉션');
      redirectAttempted.current = true;
      router.replace('/');
    }
  }, [user, isAuthLoading, router, forceShowLogin]);

  // 3초 후 강제로 로그인 폼 표시 (타임아웃 단축)
  useEffect(() => {
    if (isAuthLoading && !forceShowLogin && !user) {
      loadingTimeout.current = setTimeout(() => {
        console.log('[LoginPage] 로딩 타임아웃 - 강제로 로그인 폼 표시');
        setForceShowLogin(true);
      }, 3000); // 5초에서 3초로 단축
    }

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [isAuthLoading, forceShowLogin, user]);

  // URL 파라미터에서 에러 확인
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      switch (urlError) {
        case 'session_exchange_failed':
          setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
          break;
        case 'callback_error':
          setError('인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
          break;
        default:
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
      
      // URL에서 에러 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // 카카오 로그인 핸들러 함수
  const handleKakaoLogin = async () => {
    console.log('[LoginPage] 카카오 로그인 시작');
    setIsLoggingIn(true);
    setError(null);
    try {
      // Supabase의 OAuth 로그인 기능을 호출합니다.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[LoginPage] 카카오 로그인 에러:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoggingIn(false);
    }
  };

  // 이미 로그인된 사용자는 즉시 리디렉션 표시
  if (user && !redirectAttempted.current) {
    console.log('[LoginPage] 로그인됨 - 리디렉션 중...');
    redirectAttempted.current = true;
    router.replace('/');
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">메인 페이지로 이동 중...</p>
      </div>
    );
  }

  // 인증 상태를 확인중이고 강제 표시 모드가 아니고 사용자가 없으면 로딩 표시
  if (isAuthLoading && !forceShowLogin && !user) {
    console.log('[LoginPage] 인증 로딩 중...');
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">인증 확인 중...</p>
      </div>
    );
  }

  console.log('[LoginPage] 로그인 폼 표시');
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen ">
      <div className="w-full max-w-[500px] min-h-screen bg-white rounded-[40px] shadow-2xl p-6 sm:p-8 flex flex-col">
        <header className="pt-4 pb-8">
          <h1 className="text-xl font-black text-blue-600">
            T-BRIDGE
          </h1>
        </header>
        <main className="flex-grow flex flex-col justify-center">
          <p className="text-gray-500 font-medium text-lg mb-4">가장 투명한 통신 견적 비교</p>
          <h2 className="text-4xl font-bold text-gray-800 leading-snug">
            지금 바로,
            <br />
            시작해 볼까요?
          </h2>
        </main>
        <footer className="pb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-800 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={handleKakaoLogin}
            disabled={isLogginIn}
            className="w-full flex items-center justify-center bg-[#FEE500] text-gray-800 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-100 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <KakaoIcon />
            {isLogginIn ? '로그인 중...' : '카카오 로그인'}
          </button>
          
          {/* 디버그 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug:</strong></p>
              <p>User: {user ? '✅' : '❌'}</p>
              <p>Profile: {profile ? '✅' : '❌'}</p>
              <p>Loading: {isAuthLoading ? '✅' : '❌'}</p>
              <p>Force Show: {forceShowLogin ? '✅' : '❌'}</p>
              <p>Redirect Attempted: {redirectAttempted.current ? '✅' : '❌'}</p>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}