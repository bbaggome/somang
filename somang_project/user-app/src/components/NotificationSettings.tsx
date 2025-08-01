// 11. user-app/src/components/NotificationSettings.tsx
// 사용자 알림 설정 관리 컴포넌트

'use client';

import { useState } from 'react';
import { useNotifications } from '@/components/NotificationProvider';

export default function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    requestPermission, 
    subscribe, 
    unsubscribe 
  } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  // WebView 환경 감지 (React Native WebView)
  const isWebView = typeof window !== 'undefined' && 
    typeof navigator !== 'undefined' && (
      navigator.userAgent.includes('ReactNativeWebView') ||
      // 대안 감지 방법들
      (typeof window.ReactNativeWebView !== 'undefined') ||
      navigator.userAgent.includes('wv') || // Android WebView
      /Android.*wv/.test(navigator.userAgent)
    );
  
  // 디버깅 정보
  if (typeof window !== 'undefined') {
    console.log('🔍 NotificationSettings 환경 체크:', {
      userAgent: navigator.userAgent,
      isWebView,
      hasReactNativeWebView: navigator.userAgent.includes('ReactNativeWebView'),
      hasWindowReactNativeWebView: typeof window.ReactNativeWebView !== 'undefined',
      hasWv: navigator.userAgent.includes('wv'),
      androidWvTest: /Android.*wv/.test(navigator.userAgent),
      url: window.location.href
    });
  }

  const handleToggleNotifications = async () => {
    console.log('🔄 알림 설정 토글 시작:', { isSubscribed, permission });
    setIsLoading(true);
    
    try {
      if (!isSubscribed) {
        // 구독하기
        console.log('🔄 구독 프로세스 시작...');
        localStorage.setItem('user-wants-notifications', 'true');
        
        if (permission !== 'granted') {
          console.log('🔄 권한 요청 중... 현재 상태:', permission);
          
          if (permission === 'denied') {
            alert('HTTP 환경에서는 브라우저 알림이 차단됩니다.\n\n해결 방법:\n1. Chrome 주소창에 입력: chrome://flags/#unsafely-treat-insecure-origin-as-secure\n2. "Enabled" 선택\n3. 텍스트 박스에 http://localhost:50331 입력\n4. Chrome 재시작 후 다시 시도');
            localStorage.removeItem('user-wants-notifications');
            return;
          }
          
          const granted = await requestPermission();
          console.log('권한 요청 결과:', granted);
          
          if (!granted) {
            if (Notification.permission === 'denied') {
              alert('알림 권한이 영구적으로 차단되었습니다.\n\n해결 방법:\n1. 주소창 왼쪽의 🔒 아이콘 클릭\n2. "알림" 설정을 "허용"으로 변경\n3. 페이지 새로고침');
            } else {
              alert('알림 권한을 허용해주세요.');
            }
            localStorage.removeItem('user-wants-notifications');
            return;
          }
        }
        
        console.log('🔄 구독 시도 중...');
        // 약간의 지연을 두어 상태 업데이트가 반영되도록 함
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const success = await subscribe();
        console.log('구독 결과:', success);
        
        if (success) {
          alert('✅ 알림 설정이 완료되었습니다! 이제 새로운 견적이 오면 알림을 받으실 수 있습니다.');
        } else {
          alert('❌ 알림 설정에 실패했습니다. 브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
          localStorage.removeItem('user-wants-notifications');
        }
      } else {
        // 구독 해제
        console.log('🔄 구독 해제 프로세스 시작...');
        localStorage.removeItem('user-wants-notifications');
        const success = await unsubscribe();
        console.log('구독 해제 결과:', success);
        
        if (success) {
          alert('✅ 알림이 해제되었습니다.');
        } else {
          alert('❌ 알림 해제에 실패했습니다. 브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
        }
      }
    } catch (error) {
      console.error('❌ 알림 설정 변경 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`❌ 알림 설정 변경에 실패했습니다.\n오류: ${errorMessage}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인하세요.`);
    } finally {
      setIsLoading(false);
    }
  };


  // WebView 환경에서는 알림 설정을 숨김
  if (isWebView) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">📱</span>
          <div>
            <p className="text-sm font-medium text-blue-800">모바일 앱</p>
            <p className="text-xs text-blue-600">
              모바일 앱에서는 자동으로 견적 알림을 받으실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            HTTP 환경에서는 브라우저 알림이 제한됩니다.
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>해결 방법 1 (Docker 사용 시):</strong></p>
            <p>1. HTTPS Docker 컨테이너 실행:</p>
            <code className="block bg-gray-200 p-1 rounded text-xs">docker-compose --profile dev up --build user-app-dev</code>
            <p>2. https://localhost:50443 로 접속</p>
            <br />
            <p><strong>해결 방법 2 (로컬 개발):</strong></p>
            <p>1. 터미널에서 HTTPS 서버 실행:</p>
            <code className="block bg-gray-200 p-1 rounded text-xs">cd user-app && pnpm run dev:https</code>
            <p>2. https://localhost:50443 로 접속</p>
            <br />
            <p><strong>해결 방법 3 (Chrome 플래그):</strong></p>
            <p>1. Chrome 주소창에 다음 입력:</p>
            <code className="block bg-gray-200 p-1 rounded text-xs">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>
            <p>2. "Enabled" 선택</p>
            <p>3. 텍스트 박스에 입력:</p>
            <code className="block bg-gray-200 p-1 rounded text-xs">http://localhost:50331</code>
            <p>4. Chrome 재시작</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">새 견적 알림</h3>
          <p className="text-sm text-gray-600">
            매장에서 견적을 보내면 즉시 알림을 받습니다.
          </p>
          {permission === 'denied' && (
            <p className="text-xs text-red-600 mt-1">
              HTTP 환경에서는 알림이 차단됩니다. Chrome flags 설정이 필요합니다.
            </p>
          )}
          {permission === 'default' && (
            <p className="text-xs text-gray-600 mt-1">
              버튼을 클릭하여 알림 권한을 허용해주세요.
            </p>
          )}
        </div>
        <div>
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
              isSubscribed 
                ? 'bg-blue-600' 
                : 'bg-gray-200'
            }`}
            aria-label={isSubscribed ? 'disable notifications' : 'enable notifications'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSubscribed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        <p>상태: {
          permission === 'granted' && isSubscribed ? '✅ 알림 활성화됨' :
          permission === 'denied' ? '❌ 알림 차단됨 (주소창 🔒 클릭하여 허용)' :
          permission === 'default' ? '⏸️ 알림 권한 대기 중' :
          '⚪ 알림 비활성화됨'
        }</p>
      </div>
    </div>
  );
}