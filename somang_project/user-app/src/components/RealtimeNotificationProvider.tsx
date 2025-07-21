// 1. 실시간 알림 컨텍스트 (추가 필요)
// src/components/RealtimeNotificationProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'quote' | 'message' | 'system';
  data?: any;
  read: boolean;
  created_at: string;
}

interface RealtimeNotificationContextType {
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | undefined>(undefined);

export function RealtimeNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    // 1. 기존 알림 로드
    loadNotifications();

    // 2. Supabase 실시간 구독 설정
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quotes',
          filter: `request_id=in.(${getUserQuoteRequestIds()})` // 사용자의 견적 요청 ID들
        },
        (payload) => {
          // 새 견적이 들어왔을 때
          handleNewQuote(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `request_id=in.(${getUserQuoteRequestIds()})`
        },
        (payload) => {
          // 견적 상태가 변경되었을 때
          handleQuoteUpdate(payload.new);
        }
      )
      .subscribe();

    // 3. Service Worker 메시지 수신 (Push 알림이 왔을 때 앱 내에서도 처리)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      channel.unsubscribe();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // 최근 7일간의 알림 로드 (실제로는 별도 notifications 테이블이 있어야 함)
      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const getUserQuoteRequestIds = () => {
    // 사용자의 견적 요청 ID들을 가져오는 로직
    // 실제로는 별도 상태나 API 호출이 필요
    return 'user_quote_request_ids';
  };

  const handleNewQuote = (newQuote: any) => {
    // 새 견적 알림 생성
    const notification: RealtimeNotification = {
      id: `quote_${newQuote.id}`,
      title: '새로운 견적이 도착했습니다!',
      message: `${newQuote.store_name}에서 견적을 보냈습니다.`,
      type: 'quote',
      data: { quoteId: newQuote.id, requestId: newQuote.request_id },
      read: false,
      created_at: new Date().toISOString()
    };

    setNotifications(prev => [notification, ...prev]);
    
    // 앱 내 토스트 알림 표시
    showInAppNotification(notification);
  };

  const handleQuoteUpdate = (updatedQuote: any) => {
    // 견적 업데이트 알림 (필요시)
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    // Service Worker에서 받은 Push 알림을 앱 내에서도 처리
    if (event.data?.type === 'push-received') {
      const { title, body, data } = event.data.payload;
      
      const notification: RealtimeNotification = {
        id: `push_${Date.now()}`,
        title,
        message: body,
        type: data?.type || 'system',
        data,
        read: false,
        created_at: new Date().toISOString()
      };

      setNotifications(prev => [notification, ...prev]);
      showInAppNotification(notification);
    }
  };

  const showInAppNotification = (notification: RealtimeNotification) => {
    // 앱 내 토스트 알림 표시 (react-hot-toast 등 라이브러리 사용 권장)
    console.log('새 알림:', notification);
    
    // 간단한 브라우저 알림 (이미 Service Worker에서 처리되므로 중복 방지 필요)
    if (document.hidden) {
      // 앱이 백그라운드에 있을 때만 추가 알림
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png'
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification
  };

  return (
    <RealtimeNotificationContext.Provider value={value}>
      {children}
      <InAppNotificationDisplay />
    </RealtimeNotificationContext.Provider>
  );
}

// 2. 앱 내 알림 표시 컴포넌트
function InAppNotificationDisplay() {
  const { notifications, markAsRead, clearNotification } = useRealtimeNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<RealtimeNotification[]>([]);

  useEffect(() => {
    // 읽지 않은 새 알림만 표시 (최근 5초 이내)
    const recentUnread = notifications.filter(notif => 
      !notif.read && 
      new Date().getTime() - new Date(notif.created_at).getTime() < 5000
    );

    setVisibleNotifications(recentUnread);

    // 5초 후 자동으로 숨김
    const timer = setTimeout(() => {
      setVisibleNotifications([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map(notification => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">
                {notification.title}
              </h4>
              <p className="text-gray-600 text-sm mt-1">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => {
                markAsRead(notification.id);
                clearNotification(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 ml-2"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {notification.type === 'quote' && (
            <button
              onClick={() => {
                // 견적 상세 페이지로 이동
                window.location.href = `/quote/requests/${notification.data?.requestId}`;
              }}
              className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              견적 보기 →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// 3. 알림 아이콘 컴포넌트 (헤더에 추가용)
export function NotificationIcon() {
  const { unreadCount } = useRealtimeNotifications();

  return (
    <div className="relative">
      <button className="p-2 text-gray-600 hover:text-gray-900" aria-label="Notifications">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.586 10.586a2 2 0 102.828 2.828l6.364 6.364a2 2 0 102.828-2.828l-6.364-6.364zm-7.07 7.07l6.364-6.364" />
        </svg>
      </button>
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}

// 4. 훅
export function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationContext);
  if (context === undefined) {
    throw new Error('useRealtimeNotifications must be used within a RealtimeNotificationProvider');
  }
  return context;
}