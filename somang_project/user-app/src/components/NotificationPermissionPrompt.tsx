// 4. user-app/src/components/NotificationPermissionPrompt.tsx
// 알림 권한 요청 컴포넌트

'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/components/NotificationProvider';

export default function NotificationPermissionPrompt() {
  const { isSupported, permission, isSubscribed, requestPermission, subscribe } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 알림이 지원되고, 권한이 없고, 구독하지 않은 경우에만 프롬프트 표시
    if (isSupported && permission === 'default' && !isSubscribed) {
      // 페이지 로드 후 3초 후에 프롬프트 표시
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, isSubscribed]);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const permissionGranted = await requestPermission();
      if (permissionGranted) {
        const subscribed = await subscribe();
        if (subscribed) {
          setShowPrompt(false);
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 24시간 후에 다시 표시하도록 localStorage에 저장
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  // 24시간 이내에 이미 거부한 경우 표시하지 않음
  useEffect(() => {
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < twentyFourHours) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5zM10 4.236L16 8.5V18H4V8.5l6-4.264z"/>
                <path d="M10 12c.553 0 1-.447 1-1s-.447-1-1-1-1 .447-1 1 .447 1 1 1z"/>
                <path d="M10 15c.553 0 1-.447 1-1v-2c0-.553-.447-1-1-1s-1 .447-1 1v2c0 .553.447 1 1 1z"/>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">알림 받기</h3>
            <p className="text-sm text-gray-600 mt-1">
              새로운 견적이 도착하면 즉시 알려드릴게요!
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '설정 중...' : '알림 받기'}
              </button>
              <button
                onClick={handleDismiss}
                className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}