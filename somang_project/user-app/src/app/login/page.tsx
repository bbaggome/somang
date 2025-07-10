'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import KakaoIcon from '@/components/KakaoIcon';

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 해시에서 토큰 처리
  useEffect(() => {
    const handleHashParams = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        // URL 해시에서 토큰 파라미터들을 추출
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // 토큰이 있으면 세션 설정
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(() => {
            // 해시 제거하고 홈으로 이동
            window.history.replaceState(null, '', window.location.pathname);
            router.replace('/');
          });
        }
      }
    };

    if (!isLoading) {
      handleHashParams();
    }
  }, [isLoading, router]);

  // 이미 로그인된 사용자는 홈으로 리디렉션
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // URL 파라미터에서 에러 메시지 처리
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'session_exchange_failed':
          setError('로그인 세션 생성에 실패했습니다.');
          break;
        case 'callback_error':
          setError('로그인 처리 중 오류가 발생했습니다.');
          break;
        case 'no_auth_code':
          setError('인증 코드가 없습니다.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다.');
      }
    }
  }, [searchParams]);

  const handleKakaoLogin = async () => {
    if (isLoggingIn) return;

    try {
      setIsLoggingIn(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('카카오 로그인 실패:', err);
      setError(err.message || '로그인 중 오류가 발생했습니다.');
      setIsLoggingIn(false);
    }
  };

  // 로딩 중이거나 이미 로그인된 경우
  if (isLoading || user) {
    return (
      <div className="bg-gray-100 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* 헤더 */}
        <header className="pt-4 pb-8">
          <h1 className="text-xl font-black text-blue-600">T-BRIDGE</h1>
        </header>
        
        {/* 메인 컨텐츠 */}
        <main className="flex-grow flex flex-col justify-center">
          <p className="text-gray-500 font-medium text-lg mb-4">가장 투명한 통신 견적 비교</p>
          <h2 className="text-4xl font-bold text-gray-800 leading-snug">
            지금 바로,
            <br />
            시작해 볼까요?
          </h2>
        </main>
        
        {/* 푸터 - 로그인 버튼 */}
        <footer className="pb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900 ml-2"
                type="button"
              >
                ✕
              </button>
            </div>
          )}
          
          <button
            onClick={handleKakaoLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center bg-[#FEE500] text-gray-800 py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-100 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <KakaoIcon />
            {isLoggingIn ? '로그인 중...' : '카카오 로그인'}
          </button>
        </footer>
      </div>
    </div>
  );
}