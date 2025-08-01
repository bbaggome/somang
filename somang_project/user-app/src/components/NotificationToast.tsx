'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeNotifications } from '@/components/RealtimeNotificationProvider';
import { useRouter } from 'next/navigation';

// RealtimeNotification 타입 정의
interface RealtimeNotification {
  id: string;
  type: "quote" | "system";
  title: string;
  message: string;
  data?: {
    quote_request_id?: string;
    requestId?: string;
    storeId?: string;
    [key: string]: unknown;
  };
  read: boolean;
  created_at: string;
}

export default function NotificationToast() {
  const { notifications, markAsRead, clearNotification } = useRealtimeNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // 새로운 알림이 추가되면 표시
    const unreadNotifications = notifications.filter(n => !n.read);
    const newNotificationIds = unreadNotifications
      .filter(n => !visibleNotifications.includes(n.id))
      .map(n => n.id);

    if (newNotificationIds.length > 0) {
      setVisibleNotifications(prev => [...prev, ...newNotificationIds]);
    }
  }, [notifications, visibleNotifications]);

  const handleNotificationClick = (notification: RealtimeNotification) => {
    // 알림을 읽음으로 표시
    markAsRead(notification.id);
    
    // 견적 상세 페이지로 이동
    if (notification.data?.quote_request_id) {
      router.push(`/quote/requests/${notification.data.quote_request_id}`);
    }
    
    // 알림 제거
    handleDismiss(notification.id);
  };

  const handleDismiss = useCallback((notificationId: string) => {
    // 화면에서 제거
    setVisibleNotifications(prev => prev.filter(id => id !== notificationId));
    
    // 3초 후 상태에서도 제거
    setTimeout(() => {
      clearNotification(notificationId);
    }, 300);
  }, [clearNotification]);

  // 자동으로 숨기기 (10초 후)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    visibleNotifications.forEach(notificationId => {
      const timer = setTimeout(() => {
        handleDismiss(notificationId);
      }, 10000);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, handleDismiss]);

  const visibleNotificationObjects = notifications.filter(n => 
    visibleNotifications.includes(n.id)
  );

  if (visibleNotificationObjects.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotificationObjects.map((notification) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 animate-slide-in-right border-l-4 border-orange-400"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* 알림 아이콘 */}
              <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <p className="font-bold text-white text-sm">
                  💰 새로운 견적 도착!
                </p>
                <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-blue-200 text-xs mt-2">
                  {new Date(notification.created_at).toLocaleTimeString('ko-KR')} • 클릭하여 확인
                </p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
              className="ml-2 text-blue-200 hover:text-white transition-colors flex-shrink-0"
              aria-label='닫기'
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* 진행바 애니메이션 */}
          <div className="mt-3">
            <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-1">
              <div className="bg-white h-1 rounded-full animate-[progress_10s_linear]"></div>
            </div>
          </div>
        </div>
      ))}
      
      {/* CSS-in-JS 제거 - tailwind.config.ts에 커스텀 애니메이션 추가 필요 */}
    </div>
  );
}