'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [showFallback, setShowFallback] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  // 디버그 로그
  console.log('[HomePage] 상태:', { 
    hasUser: !!user, 
    hasProfile: !!profile,
    isLoading,
    forceShow
  });

  // 인증되지 않은 사용자를 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user && !forceShow) {
      console.log('[HomePage] 인증되지 않은 사용자 - 로그인 페이지로 리디렉션');
      router.replace('/login');
    }
  }, [user, isLoading, router, forceShow]);

  // 10초 후에도 로딩 중이면 강제로 컨텐츠 표시
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('[HomePage] 로딩 타임아웃 - 강제로 페이지 표시');
        setForceShow(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // 5초 후에도 로딩 중이면 fallback 표시
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !forceShow) {
        console.log('[HomePage] 로딩 지연 - Fallback 표시');
        setShowFallback(true);
      }
    }, 5000);

    if (!isLoading || forceShow) {
      setShowFallback(false);
    }

    return () => clearTimeout(timer);
  }, [isLoading, forceShow]);

  // 로딩 중 (강제 표시 모드가 아닐 때)
  if (isLoading && !showFallback && !forceShow) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">로딩 중...</p>
      </div>
    );
  }

  // 로딩이 지연되는 경우 강제 진입 옵션 제공
  if (isLoading && showFallback && !forceShow) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 mb-4">로딩이 지연되고 있습니다...</p>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            새로고침
          </button>
          <button
            onClick={() => setForceShow(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            계속하기
          </button>
          <button
            onClick={() => router.push('/login')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자 (리디렉션 전 임시 표시 또는 강제 표시 모드)
  if (!user) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 mb-4">리디렉션 중...</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          로그인 페이지로 이동
        </button>
      </div>
    );
  }

  // 인증된 사용자의 메인 홈페이지
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-black text-blue-600">T-BRIDGE</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                안녕하세요, {profile?.nick_name || user.email}님!
              </span>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    router.push('/login');
                  } catch (error) {
                    console.error('로그아웃 에러:', error);
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                환영합니다! 🎉
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                가장 투명한 통신 견적 비교 서비스
              </p>
              
              {/* 사용자 정보 카드 */}
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-4">내 정보</h3>
                <div className="space-y-2 text-left">
                  <p><span className="font-medium">이메일:</span> {user.email}</p>
                  <p><span className="font-medium">닉네임:</span> {profile?.nick_name || '생성 중...'}</p>
                  <p><span className="font-medium">역할:</span> {profile?.role || 'user'}</p>
                  <p>
                    <span className="font-medium">가입일:</span> {' '}
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}
                  </p>
                </div>
                
                {!profile && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      프로필 정보를 생성하는 중입니다. 잠시만 기다려주세요.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      새로고침
                    </button>
                  </div>
                )}
              </div>

              {/* 개발 환경에서만 디버그 정보 표시 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-100 rounded text-sm text-left max-w-md mx-auto">
                  <h4 className="font-semibold mb-2">디버그 정보:</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify({
                      userId: user.id,
                      hasProfile: !!profile,
                      profileId: profile?.id,
                      userRole: profile?.role,
                      isLoading,
                      showFallback,
                      forceShow
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}