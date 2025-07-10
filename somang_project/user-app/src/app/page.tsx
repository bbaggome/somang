'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 로그아웃 로딩 상태 추가

  // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // useCallback으로 함수 최적화 (탭 전환 후 재연결 문제 해결)
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // 중복 실행 방지
    
    try {
      setIsLoggingOut(true);
      console.log('로그아웃 시작');
      
      // 즉시 로컬 상태와 스토리지 정리 (Supabase 호출 전에)
      localStorage.clear();
      sessionStorage.clear();
      
      // 짧은 타임아웃으로 빠른 강제 이동
      const timeoutId = setTimeout(() => {
        console.log('로그아웃 타임아웃 - 강제 이동');
        window.location.href = '/login'; // router.push 대신 직접 이동
      }, 1000); // 1초로 단축
      
      try {
        // Supabase 로그아웃 시도 (Promise.race로 더 빠른 타임아웃)
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 500)
          )
        ]);
        
        clearTimeout(timeoutId);
        console.log('로그아웃 완료');
        window.location.href = '/login';
      } catch (error) {
        clearTimeout(timeoutId);
        console.log('Supabase 로그아웃 실패, 강제 이동:', error);
        window.location.href = '/login';
      }
      
    } catch (error) {
      console.error('로그아웃 처리 실패:', error);
      // 모든 경우에 강제로 로그인 페이지로 이동
      window.location.href = '/login';
    }
  }, [isLoggingOut]);

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading || !user) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">로딩 중...</p>
      </div>
    );
  }

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
              <span className="text-gray-700 text-sm sm:text-base">
                안녕하세요, {profile?.nick_name || user.email}님!
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-500 text-white px-3 py-2 sm:px-4 rounded hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              환영합니다! 🎉
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              가장 투명한 통신 견적 비교 서비스
            </p>
          </div>
          
          {/* 사용자 정보 카드 */}
          <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">내 정보</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700">이메일:</span>
                <span className="text-gray-900 break-all">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700">닉네임:</span>
                <span className="text-gray-900">{profile?.nick_name || '생성 중...'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700">역할:</span>
                <span className="text-gray-900">{profile?.role || 'user'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700">가입일:</span>
                <span className="text-gray-900">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}
                </span>
              </div>
            </div>
            
            {!profile && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  프로필 정보를 생성하는 중입니다.
                </p>
              </div>
            )}
          </div>

          {/* 서비스 안내 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-semibold text-gray-900 mb-2">휴대폰 견적</h4>
              <p className="text-sm text-gray-600">다양한 통신사의 휴대폰 요금제를 비교해보세요</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🌐</div>
              <h4 className="font-semibold text-gray-900 mb-2">인터넷 견적</h4>
              <p className="text-sm text-gray-600">집에서 사용할 인터넷 상품을 찾아보세요</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold text-gray-900 mb-2">1:1 상담</h4>
              <p className="text-sm text-gray-600">전문가와 직접 상담받으실 수 있습니다</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}