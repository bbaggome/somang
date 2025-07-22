// user-app/src/components/RealtimeNotificationProvider.tsx (개선된 버전)
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: "quote" | "message" | "system";
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

const RealtimeNotificationContext = createContext<
  RealtimeNotificationContextType | undefined
>(undefined);

export function RealtimeNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    []
  );
  const channelRef = useRef<any>(null);
  const mounted = useRef(true);

  // 실시간 구독 설정
  const setupRealtimeSubscription = useCallback(async () => {
    if (!user || !mounted.current) return;

    try {
      // 기존 채널이 있으면 해제
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      console.log("Setting up realtime subscription for user:", user.id);

      // 사용자의 견적 요청 ID들을 먼저 가져오기
      const { data: userRequests } = await supabase
        .from("quote_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open");

      if (!userRequests || userRequests.length === 0) {
        console.log("No open quote requests for user");
        return;
      }

      const requestIds = userRequests.map((req) => req.id);
      console.log("Watching quote requests:", requestIds);

      // 새 채널 생성 및 구독
      const channel = supabase
        .channel(`user_quotes_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "quotes",
            filter: `request_id=in.(${requestIds.join(",")})`, // 사용자의 요청에 대한 견적만 필터링
          },
          async (payload) => {
            console.log("New quote received:", payload);
            await handleNewQuote(payload.new);
          }
        )
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
        });

      channelRef.current = channel;
    } catch (error) {
      console.error("Failed to setup realtime subscription:", error);
    }
  }, [user]);

  // 새 견적 처리
  const handleNewQuote = useCallback(
    async (newQuote: any) => {
      if (!user || !mounted.current) return;

      try {
        // 매장 정보 가져오기
        const { data: store } = await supabase
          .from("stores")
          .select("name")
          .eq("id", newQuote.store_id)
          .single();

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
            deviceName = `${device.device_name} ${device.storage_options[0]}GB`;
          }
        }

        const notification: RealtimeNotification = {
          id: `quote_${newQuote.id}`,
          title: "💰 새로운 견적이 도착했어요!",
          message: `${
            store?.name || "매장"
          }에서 ${deviceName} 견적을 보냈습니다. 총 ${formatCurrency(
            newQuote.quote_details.tco_24months
          )}원`,
          type: "quote",
          data: {
            quoteId: newQuote.id,
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
    [user]
  );

  // 견적 업데이트 처리
  const handleQuoteUpdate = useCallback(async (updatedQuote: any) => {
    // 견적 상태 변경 시 처리 (필요한 경우)
    console.log("Quote updated:", updatedQuote);
  }, []);

  // 앱 내 알림 표시
  const showInAppNotification = useCallback(
    (notification: RealtimeNotification) => {
      console.log("새 알림:", notification);

      // 페이지가 백그라운드에 있을 때만 브라우저 알림 표시
      if (
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: "quote_notification",
          data: notification.data,
        });

        browserNotification.onclick = () => {
          window.focus();
          if (notification.type === "quote" && notification.data?.requestId) {
            window.location.href = `/quote/requests/${notification.data.requestId}`;
          }
          browserNotification.close();
        };

        // 5초 후 자동 닫기
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    },
    []
  );

  // Service Worker 메시지 수신
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "push-received") {
        const { title, body, data } = event.data.payload;

        const notification: RealtimeNotification = {
          id: `push_${Date.now()}`,
          title,
          message: body,
          type: data?.type || "system",
          data,
          read: false,
          created_at: new Date().toISOString(),
        };

        if (mounted.current) {
          setNotifications((prev) => [notification, ...prev]);
        }
      }
    };

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
    };
  }, []);

  // 사용자 변경 시 구독 설정
  useEffect(() => {
    mounted.current = true;

    if (user) {
      setupRealtimeSubscription();
    }

    return () => {
      mounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, setupRealtimeSubscription]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };

  return (
    <RealtimeNotificationContext.Provider value={value}>
      {children}
      <InAppNotificationDisplay />
    </RealtimeNotificationContext.Provider>
  );
}

// 앱 내 알림 표시 컴포넌트
function InAppNotificationDisplay() {
  const { notifications, markAsRead, clearNotification } =
    useRealtimeNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<
    RealtimeNotification[]
  >([]);

  useEffect(() => {
    // 읽지 않은 새 알림만 표시 (최근 10초 이내)
    const recentUnread = notifications.filter(
      (notif) =>
        !notif.read &&
        new Date().getTime() - new Date(notif.created_at).getTime() < 10000
    );

    setVisibleNotifications(recentUnread.slice(0, 3)); // 최대 3개만 표시

    // 10초 후 자동으로 숨김
    if (recentUnread.length > 0) {
      const timer = setTimeout(() => {
        setVisibleNotifications([]);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300"
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
              aria-label="알림 닫기"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {notification.type === "quote" && (
            <button
              onClick={() => {
                if (notification.data?.requestId) {
                  window.location.href = `/quote/requests/${notification.data.requestId}`;
                }
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

// 훅
export function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationContext);
  if (context === undefined) {
    throw new Error(
      "useRealtimeNotifications must be used within a RealtimeNotificationProvider"
    );
  }
  return context;
}
