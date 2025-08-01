// user-app/src/components/RealtimeNotificationProvider.tsx (수정된 버전)
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// Quote interface for Supabase response
interface Quote {
  id: string;
  request_id: string;
  store_id: string;
  quote_details: {
    tco_24months: number;
    [key: string]: unknown;
  };
}

// 실시간 알림 타입
interface RealtimeNotification {
  id: string;
  type: "quote" | "system";
  title: string;
  message: string;
  data?: {
    requestId?: string;
    storeId?: string;
    [key: string]: unknown;
  };
  read: boolean;
  created_at: string;
}

// Context 타입
interface RealtimeNotificationContextType {
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAll: () => void;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | null>(null);

export const useRealtimeNotifications = () => {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    throw new Error(
      "useRealtimeNotifications must be used within a RealtimeNotificationProvider"
    );
  }
  return context;
};

interface RealtimeNotificationProviderProps {
  children: ReactNode;
}

export const RealtimeNotificationProvider = ({
  children,
}: RealtimeNotificationProviderProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mounted = useRef(true);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  
  // 알림 설정 상태 확인
  useEffect(() => {
    const checkNotificationStatus = () => {
      // 브라우저 환경에서만 Notification API 사용
      if (typeof window === 'undefined' || typeof Notification === 'undefined') {
        setIsNotificationEnabled(false);
        return;
      }
      
      const enabled = localStorage.getItem('user-wants-notifications') === 'true' && 
                     Notification.permission === 'granted';
      setIsNotificationEnabled(enabled);
      console.log('알림 설정 상태:', { enabled, permission: Notification.permission });
    };
    
    checkNotificationStatus();
    
    // 브라우저 환경에서만 이벤트 리스너 등록
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkNotificationStatus);
      return () => window.removeEventListener('storage', checkNotificationStatus);
    }
  }, []);

  // 앱 내 알림 표시
  const showInAppNotification = useCallback(
    (notification: RealtimeNotification) => {
      console.log("새 알림:", notification);
      
      // 알림 설정이 켜져있고 권한이 있는 경우에만 브라우저 알림 표시
      if (isNotificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
        console.log('🔔 브라우저 알림 표시:', notification.title);
        
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/next.svg',
          tag: notification.id,
          data: notification.data,
          requireInteraction: true
        });

        browserNotification.onclick = () => {
          console.log('🔔 알림 클릭됨');
          window.focus();
          if (notification.data?.requestId) {
            // 견적 상세 페이지로 이동
            window.location.href = `/quote/requests/${notification.data.requestId}`;
          }
          browserNotification.close();
        };

        // 10초 후 자동 닫기
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      } else {
        console.warn('🔔 알림 표시 안함:', {
          isNotificationEnabled,
          hasNotification: typeof window !== 'undefined' && 'Notification' in window,
          permission: typeof window !== 'undefined' && typeof Notification !== 'undefined' ? Notification.permission : 'unknown',
          localStorage: typeof window !== 'undefined' ? localStorage.getItem('user-wants-notifications') : null
        });
      }
    },
    [isNotificationEnabled]
  );

  // 새 견적 처리
  const handleNewQuote = useCallback(
    async (newQuote: Quote) => {
      if (!user || !mounted.current) {
        console.log('🔔 handleNewQuote 조건 실패:', { hasUser: !!user, mounted: mounted.current });
        return;
      }

      console.log('🔔 새 견적 수신 처리 시작:', newQuote);

      try {
        // 매장 정보 가져오기
        const { data: store, error: storeError } = await supabase
          .from("stores")
          .select("name")
          .eq("id", newQuote.store_id)
          .maybeSingle(); // single() 대신 maybeSingle() 사용
          
        if (storeError) {
          console.warn("매장 정보 로드 실패:", storeError);
        }

        // 견적 요청 정보 가져오기 (디바이스 정보 포함)
        const { data: quoteRequest } = await supabase
          .from("quote_requests")
          .select("request_details")
          .eq("id", newQuote.request_id)
          .single();

        // 디바이스 정보 가져오기
        let deviceName = "휴대폰";
        if (quoteRequest?.request_details?.deviceId) {
          const { data: device } = await supabase
            .from("devices")
            .select("device_name, storage_options")
            .eq("id", quoteRequest.request_details.deviceId)
            .single();

          if (device) {
            deviceName = device.device_name;
            // 저장 용량 정보가 있으면 포함
            if (quoteRequest.request_details.storageId && device.storage_options) {
              const storage = device.storage_options.find(
                (s: { id: string; capacity: string }) => s.id === quoteRequest.request_details.storageId
              );
              if (storage) {
                deviceName += ` ${storage.capacity}`;
              }
            }
          }
        }

        const storeName = store?.name || "매장";
        const tco = newQuote.quote_details?.tco_24months || 0;

        const notification: RealtimeNotification = {
          id: `quote_${newQuote.id}_${Date.now()}`,
          type: "quote",
          title: `💰 새 견적이 도착했습니다!`,
          message: `${storeName}에서 ${deviceName} 견적을 보내드렸어요. 24개월 총 비용: ${formatCurrency(tco)}원`,
          data: {
            requestId: newQuote.request_id,
            storeId: newQuote.store_id,
          },
          read: false,
          created_at: new Date().toISOString(),
        };

        if (mounted.current) {
          setNotifications((prev) => [notification, ...prev]);
          showInAppNotification(notification);
        }
      } catch (error) {
        console.error("Failed to handle new quote:", error);
      }
    },
    [user, showInAppNotification]
  );

  // 실시간 구독 설정
  const setupRealtimeSubscription = useCallback(async () => {
    if (!user || !mounted.current) return;

    try {
      // 기존 채널이 있으면 해제
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      console.log("Setting up realtime subscription for user:", user.id);

      // 사용자의 모든 견적 요청 ID들을 가져오기 (status 제한 없음)
      const { data: userRequests } = await supabase
        .from("quote_requests")
        .select("id")
        .eq("user_id", user.id);

      if (!userRequests || userRequests.length === 0) {
        console.log("No quote requests for user");
        return;
      }

      const requestIds = userRequests.map((req) => req.id);
      console.log("Watching all quote requests:", requestIds);

      // 새 채널 생성 및 구독 (필터 없이 모든 quotes 테이블 INSERT 이벤트 감지)
      const channel = supabase
        .channel(`user_quotes_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "quotes"
            // 필터 제거 - 모든 INSERT 이벤트를 받아서 직접 필터링
          },
          async (payload) => {
            console.log("🔥 모든 QUOTE INSERT 이벤트 수신:", payload);
            console.log("🔥 Request ID:", payload.new?.request_id);
            console.log("🔥 사용자 Request IDs:", requestIds);
            
            // 수동 필터링: 사용자의 요청에 대한 견적인지 확인
            if (payload.new?.request_id && requestIds.includes(payload.new.request_id)) {
              console.log("🔥 사용자 견적 매칭됨! 알림 처리 시작");
              await handleNewQuote(payload.new as Quote);
            } else {
              console.log("🔥 다른 사용자의 견적이므로 무시");
            }
          }
        )
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
          if (status === 'SUBSCRIBED') {
            console.log("✅ 실시간 알림 구독 완료 - 새 견적 알림을 받을 준비가 되었습니다!");
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error("Failed to setup realtime subscription:", error);
    }
  }, [user, handleNewQuote]);

  // 견적 업데이트 처리 (현재 사용하지 않지만 향후 확장 가능)
  // const handleQuoteUpdate = useCallback(async (updatedQuote: Quote) => {
  //   // 견적 상태 변경 시 처리 (필요한 경우)
  //   console.log("Quote updated:", updatedQuote);
  // }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  // 특정 알림 지우기
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // 모든 알림 지우기
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter((n) => !n.read).length;

  // 사용자 변경 시 구독 설정
  useEffect(() => {
    if (user) {
      setupRealtimeSubscription();
    } else {
      // 로그아웃 시 정리
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setNotifications([]);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, setupRealtimeSubscription]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    mounted.current = true;
    
    return () => {
      mounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const contextValue: RealtimeNotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };

  return (
    <RealtimeNotificationContext.Provider value={contextValue}>
      {children}
    </RealtimeNotificationContext.Provider>
  );
};