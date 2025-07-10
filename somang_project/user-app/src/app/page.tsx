'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // useCallback으로 함수 최적화 (탭 전환 후 재연결 문제 해결)
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      console.log('로그아웃 시작');
      
      // 즉시 로컬 상태와 스토리지 정리 (Supabase 호출 전에)
      localStorage.clear();
      sessionStorage.clear();
      
      // 짧은 타임아웃으로 빠른 강제 이동
      const timeoutId = setTimeout(() => {
        console.log('로그아웃 타임아웃 - 강제 이동');
        window.location.href = '/login';
      }, 1000);
      
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
      window.location.href = '/login';
    }
  }, [isLoggingOut]);

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl flex flex-col items-center justify-center">
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
              환영합니다! 🎉
            </h2>
            <p className="text-gray-600">
              안녕하세요, {profile?.nick_name || user.email}님!
            </p>
          </div>

          {/* 사용자 정보 카드 */}
          <div className="bg-gray-50 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">내 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">이메일:</span>
                <span className="text-gray-900 text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">닉네임:</span>
                <span className="text-gray-900">{profile?.nick_name || '생성 중...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">역할:</span>
                <span className="text-gray-900">{profile?.role || 'user'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">가입일:</span>
                <span className="text-gray-900 text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}
                </span>
              </div>
            </div>
            
            {!profile && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  프로필 정보를 생성하는 중입니다.
                </p>
              </div>
            )}
          </div>

          {/* 서비스 안내 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📱</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">휴대폰 견적</h4>
                <p className="text-sm text-gray-600">다양한 통신사의 휴대폰 요금제를 비교해보세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-green-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">🌐</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">인터넷 견적</h4>
                <p className="text-sm text-gray-600">집에서 사용할 인터넷 상품을 찾아보세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-purple-50">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-lg">💬</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">1:1 상담</h4>
                <p className="text-sm text-gray-600">전문가와 직접 상담받으실 수 있습니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 영역 - 로그아웃 버튼과 푸터 */}
        <div className="p-8 pt-0">
          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center bg-red-500 text-white py-4 font-bold text-lg transition-all duration-200 hover:bg-red-600 hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl mb-6"
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                로그아웃 중...
              </>
            ) : (
              '로그아웃'
            )}
          </button>

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