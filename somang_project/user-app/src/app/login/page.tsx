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
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(() => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl p-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      {/* 메인 카드 */}
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl font-black text-blue-600">T</span>
            </div>
            <h1 className="text-2xl font-black text-white">T-BRIDGE</h1>
            <p className="text-blue-100 text-sm mt-2">가장 투명한 통신 견적 비교</p>
          </div>
        </div>

        {/* 컨텐츠 - 상단 부분 */}
        <div className="p-8 flex-1">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              환영합니다! 👋
            </h2>
            <p className="text-gray-600">
              지금 바로 시작해 볼까요?
            </p>
          </div>

          {/* 서비스 특징 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📱</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">투명한 견적 비교</p>
                <p className="text-xs text-gray-600">숨겨진 비용 없이 명확하게</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">💬</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">1:1 전문 상담</p>
                <p className="text-xs text-gray-600">전문가와 직접 소통</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">⚡</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">빠른 견적 확인</p>
                <p className="text-xs text-gray-600">실시간으로 즉시 확인</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 영역 - 에러, 로그인 버튼, 약관, 푸터 */}
        <div className="p-8 pt-0">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 mb-6 flex items-start">
              <div className="flex-shrink-0 mr-3">
                <span className="text-red-500">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900 ml-2 text-sm"
                type="button"
              >
                ✕
              </button>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            onClick={handleKakaoLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center bg-[#FEE500] text-gray-800 py-4 font-bold text-lg transition-all duration-200 hover:bg-[#FDD835] hover:scale-105 active:scale-100 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl mb-6"
          >
            {!isLoggingIn && <KakaoIcon />}
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                로그인 중...
              </>
            ) : (
              '카카오 로그인'
            )}
          </button>

          {/* 하단 텍스트 */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500">
              로그인하시면{' '}
              <span className="text-blue-600 underline">서비스 이용약관</span>과{' '}
              <span className="text-blue-600 underline">개인정보처리방침</span>에 동의하게 됩니다.
            </p>
          </div>

          {/* 푸터 */}
          <div className="bg-gray-50 -mx-8 -mb-8 px-8 py-6 text-center">
            <p className="text-xs text-gray-500">
              © 2025 T-BRIDGE. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}