// 3. user-app/src/components/NotificationProvider.tsx
// 알림 권한 관리 컴포넌트

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/notifications/push';

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSupported] = useState(isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // 초기 상태 확인
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, [isSupported]);

  // 구독 상태 확인
  const checkSubscriptionStatus = useCallback(async () => {
    const subscription = await getCurrentSubscription();
    setIsSubscribed(!!subscription);
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, [isSupported]);

  // Push 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported || permission !== 'granted') return false;

    try {
      const subscriptionData = await subscribeToPush();
      if (!subscriptionData) return false;

      // 서버에 구독 정보 저장
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          is_active: true,
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Failed to save subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      return false;
    }
  }, [user, isSupported, permission]);

  // Push 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await unsubscribeFromPush();
      if (!success) return false;

      // 서버에서 구독 정보 비활성화
      const { error } = await supabase
        .from('user_push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to deactivate subscription:', error);
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Unsubscription failed:', error);
      return false;
    }
  }, [user]);

  const value = {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}