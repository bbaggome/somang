// user-app/src/components/NotificationProvider.tsx (개선된 버전)
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
  isLoading: boolean;  // 로딩 상태 추가
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
  const [isLoading, setIsLoading] = useState(false);

  // 초기 상태 확인
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, [isSupported, user]); // user 의존성 추가

  // 구독 상태 확인
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user || !isSupported) return;
    
    setIsLoading(true);
    try {
      // 브라우저에서 현재 구독 상태 확인
      const browserSubscription = await getCurrentSubscription();
      
      if (browserSubscription) {
        // 서버에서도 구독 상태 확인
        const { data, error } = await supabase
          .from('user_push_subscriptions')
          .select('is_active')
          .eq('user_id', user.id)
          .eq('endpoint', browserSubscription.endpoint)
          .eq('is_active', true)
          .single();

        setIsSubscribed(!!data && !error);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      setIsLoading(true);
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Push 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
  if (!user || !isSupported || permission !== 'granted') return false;

  try {
    console.log('Starting subscription process for user:', user.id);
    
    const subscriptionData = await subscribeToPush();
    if (!subscriptionData) {
      console.error('Failed to get subscription data');
      return false;
    }

    console.log('Got subscription data:', subscriptionData.endpoint);

    // UPSERT를 사용하여 중복 방지
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys.p256dh,
        auth_key: subscriptionData.keys.auth,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint',
        ignoreDuplicates: false
      })
      .select();

    console.log('Upsert result:', { data, error });

    if (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }

    console.log('Subscription saved successfully');
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
    console.log('Starting unsubscribe for user:', user.id);
    
    // 1. 현재 브라우저의 구독 정보 가져오기
    const currentSubscription = await getCurrentSubscription();
    console.log('Current browser subscription:', currentSubscription?.endpoint);

    // 2. 브라우저에서 구독 해제
    try {
      const browserUnsubscribed = await unsubscribeFromPush();
      console.log('Browser unsubscribe result:', browserUnsubscribed);
    } catch (pushError) {
      console.warn('Browser unsubscribe failed:', pushError);
    }

    // 3. 서버에서 해당 사용자의 모든 활성 구독 비활성화
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select();

    console.log('Server update result:', { data, error, updatedCount: data?.length });

    if (error) {
      console.error('Database update failed:', error);
      // 에러가 있어도 로컬 상태는 업데이트 (UX 개선)
    }

    setIsSubscribed(false);
    return true;

  } catch (error) {
    console.error('Unsubscribe failed:', error);
    return false;
  }
}, [user]);

  const value = {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
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