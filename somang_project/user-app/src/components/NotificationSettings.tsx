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

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    try {
      if (!isSubscribed) {
        // 구독하기
        if (permission !== 'granted') {
          const granted = await requestPermission();
          if (!granted) {
            alert('알림 권한을 허용해주세요.');
            return;
          }
        }
        
        const success = await subscribe();
        if (success) {
          alert('알림 설정이 완료되었습니다.');
        } else {
          alert('알림 설정에 실패했습니다.');
        }
      } else {
        // 구독 해제
        const success = await unsubscribe();
        if (success) {
          alert('알림이 해제되었습니다.');
        } else {
          alert('알림 해제에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Notification toggle failed:', error);
      alert('알림 설정 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          이 브라우저에서는 Push 알림이 지원되지 않습니다.
        </p>
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
              브라우저 설정에서 알림 권한을 허용해주세요.
            </p>
          )}
        </div>
        <div>
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading || permission === 'denied'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
              isSubscribed 
                ? 'bg-blue-600' 
                : 'bg-gray-200'
            }`}
            aria-label='disable notifications'
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
          permission === 'granted' && isSubscribed ? '알림 활성화됨' :
          permission === 'denied' ? '알림 차단됨' :
          permission === 'default' ? '알림 권한 필요' :
          '알림 비활성화됨'
        }</p>
      </div>
    </div>
  );
}