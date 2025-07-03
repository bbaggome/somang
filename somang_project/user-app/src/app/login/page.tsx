'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isLogginIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 로딩이 끝나고, 이미 유저 정보가 있으면 메인 페이지로 리디렉션
    if (!isAuthLoading && user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // ====================================================================
  // 2. 카카오 로그인 핸들러 함수 수정
  // ====================================================================
  const handleKakaoLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      // Supabase의 OAuth 로그인 기능을 호출합니다.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoggingIn(false);
    }
    // 성공 시, Supabase가 카카오 로그인 페이지로 리디렉션합니다.
    // 로그인 완료 후에는 카카오가 Supabase Redirect URI로 돌려보내고,
    // Supabase가 다시 우리 앱의 페이지로 돌려보내며 로그인 세션이 생성됩니다.
  };

  // 인증 상태를 확인중이거나 이미 로그인 되어있다면 로딩 표시
  if (isAuthLoading || user) {
    return (
        <div className='flex items-center justify-center min-h-screen'>
            <p>Loading...</p>
        </div>
    );
  }



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
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button
            onClick={handleKakaoLogin}
            disabled={isLogginIn}
            className="w-full flex items-center justify-center bg-[#FEE500] text-gray-800 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-100 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <KakaoIcon />
            {isLogginIn ? '로그인 중...' : '카카오 로그인'}
          </button>
        </footer>
      </div>
    </div>
  );
}
