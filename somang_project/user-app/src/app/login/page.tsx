'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import KakaoIcon from '@/components/KakaoIcon';
import LoadingOverlay from '@/components/LoadingOverlay';

function LoginPageContent() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const { user, isLoading, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 해시에서 토큰 처리
  useEffect(() => {
    const handleHashParams = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes('access_token=')) {
        console.log('토큰 감지됨, 세션 설정 중...');
        setIsProcessingAuth(true);
        
        try {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // URL 정리
            window.history.replaceState(null, '', '/login');
            
            // 세션 설정
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('세션 설정 실패:', error);
              setError('로그인 처리 중 오류가 발생했습니다.');
              setIsProcessingAuth(false);
              return;
            }
            
            console.log('세션 설정 완료, 잠시 후 홈으로 이동');
            
            // 짧은 대기 후 리디렉션 (AuthProvider 상태 업데이트 대기)
            setTimeout(() => {
              setIsProcessingAuth(false);
              router.replace('/');
            }, 1000);
          }
        } catch (error) {
          console.error('토큰 처리 실패:', error);
          setError('로그인 처리 중 오류가 발생했습니다.');
          setIsProcessingAuth(false);
          window.history.replaceState(null, '', '/login');
        }
      }
    };

    // 컴포넌트 마운트 후 해시 확인
    const timer = setTimeout(() => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        handleHashParams();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // 이미 로그인된 사용자는 홈으로 리디렉션
  useEffect(() => {
    // 초기화 완료 후 사용자가 있고, 인증 처리 중이 아닐 때만 리디렉션
    if (!isInitializing && !isProcessingAuth && user) {
      console.log('로그인된 사용자 감지, 홈으로 이동');
      router.replace('/');
    }
  }, [user, isInitializing, isProcessingAuth, router]);

  // URL 파라미터에서 에러 메시지 처리
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam && !isProcessingAuth) {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        return;
      }
      
      switch (errorParam) {
        case 'session_exchange_failed':
          setError('로그인 세션 생성에 실패했습니다.');
          break;
        case 'callback_error':
          setError('로그인 처리 중 오류가 발생했습니다.');
          break;
        case 'no_auth_code':
          if (!hash || !hash.includes('access_token=')) {
            setError('인증 코드가 없습니다.');
          }
          break;
        default:
          setError('로그인 중 오류가 발생했습니다.');
      }
    }
  }, [searchParams, isProcessingAuth]);

  const handleKakaoLogin = async () => {
    if (isLoggingIn || isProcessingAuth) return;

    try {
      setIsLoggingIn(true);
      setError(null);

      // WebView 환경 감지
      const isWebView = searchParams.get('mobile') === 'true';
      const userAgent = navigator.userAgent;
      const isReactNativeWebView = userAgent.includes('ReactNativeWebView');
      
      console.log('로그인 환경 감지:', { 
        isWebView, 
        isReactNativeWebView, 
        userAgent: userAgent.substring(0, 100) 
      });

      if (isWebView || isReactNativeWebView) {
        // WebView 환경: 같은 창에서 카카오 로그인 처리
        console.log('WebView 환경에서 카카오 로그인 시작');
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: {
            redirectTo: `${window.location.origin}/login?mobile=true`,
            // WebView에서는 popup 대신 같은 창 사용
            skipBrowserRedirect: false,
          },
        });

        if (error) {
          throw error;
        }
      } else {
        // 일반 웹 환경: 기존 로직
        const redirectTo = `${window.location.origin}/login`;
        console.log('웹 환경에서 카카오 로그인 시작:', redirectTo);
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: {
            redirectTo: redirectTo,
          },
        });

        if (error) {
          throw error;
        }
      }
    } catch (err) {
      console.error('카카오 로그인 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      setIsLoggingIn(false);
    }
  };

  // 초기화 중인 경우
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <LoadingOverlay 
          isVisible={true} 
          message="초기화 중..."
        />
      </div>
    );
  }

  // 인증 처리 중인 경우
  if (isProcessingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <LoadingOverlay 
          isVisible={true} 
          message="로그인 처리 중..."
        />
      </div>
    );
  }

  // 이미 로그인된 경우
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <LoadingOverlay 
        isVisible={isLoading || isLoggingIn} 
        message={isLoggingIn ? "로그인 중..." : "로딩 중..."}
      />
      
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
              {(searchParams.get('mobile') === 'true' || navigator.userAgent.includes('ReactNativeWebView')) 
                ? '모바일 앱에서 간편하게 로그인하세요'
                : '지금 바로 시작해 볼까요?'
              }
            </p>
          </div>

          {/* 서비스 특징 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📱</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">투명한 견적 비교</p>
                <p className="text-xs text-gray-600">숨겨진 비용 없이 명확하게</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">💬</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">1:1 전문 상담</p>
                <p className="text-xs text-gray-600">전문가와 직접 소통</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-lg">⚡</span>
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
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-start">
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
            disabled={isLoggingIn || isProcessingAuth}
            className="w-full flex items-center justify-center bg-[#FEE500] text-gray-800 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:bg-[#FDD835] hover:scale-105 active:scale-100 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl mb-6"
          >
            {!isLoggingIn && !isProcessingAuth && <KakaoIcon />}
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                로그인 중...
              </>
            ) : isProcessingAuth ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                처리 중...
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <LoadingOverlay isVisible={true} message="로딩 중..." />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}