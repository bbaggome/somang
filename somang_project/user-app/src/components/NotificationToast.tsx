'use client';

import { useEffect, useState } from 'react';
import { useRealtimeNotifications } from '@/components/RealtimeNotificationProvider';
import { useRouter } from 'next/navigation';

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

  const handleNotificationClick = (notification: any) => {
    // 알림을 읽음으로 표시
    markAsRead(notification.id);
    
    // 견적 상세 페이지로 이동
    if (notification.data?.quote_request_id) {
      router.push(`/quote/requests/${notification.data.quote_request_id}`);
    }
    
    // 알림 제거
    handleDismiss(notification.id);
  };

  const handleDismiss = (notificationId: string) => {
    // 화면에서 제거
    setVisibleNotifications(prev => prev.filter(id => id !== notificationId));
    
    // 3초 후 상태에서도 제거
    setTimeout(() => {
      clearNotification(notificationId);
    }, 300);
  };

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
  }, [visibleNotifications]);

  const visibleNotificationObjects = notifications.filter(n => 
    visibleNotifications.includes(n.id)
  );

  if (visibleNotificationObjects.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotificationObjects.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 animate-slide-in-right"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                새로운 견적이 도착했습니다!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(notification.created_at).toLocaleTimeString('ko-KR')}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}