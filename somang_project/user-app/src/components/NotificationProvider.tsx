// user-app/src/components/NotificationProvider.tsx (단순화된 로직)
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
  isLoading: boolean;
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
  }, [isSupported, user]);

  // 구독 상태 확인 (user_id로만 확인)
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user || !isSupported) return;
    
    setIsLoading(true);
    try {
      // user_id로 구독 정보 조회 (is_active가 true인 것만)
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .select('id, is_active, endpoint')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('구독 상태 확인:', { 
        hasActiveSubscription: !!data, 
        error 
      });
      
      setIsSubscribed(!!data && !error);
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

  // Push 구독 (user_id로만 확인해서 INSERT 또는 UPDATE)
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported || permission !== 'granted') {
      console.error('Subscribe failed - prerequisites not met:', {
        hasUser: !!user,
        isSupported,
        permission
      });
      return false;
    }

    try {
      setIsLoading(true);
      console.log('Starting subscription process for user:', user.id);
      
      const subscriptionData = await subscribeToPush();
      if (!subscriptionData) {
        console.error('Failed to get subscription data');
        return false;
      }

      console.log('Got subscription data, checking existing subscription...');

      // user_id로 기존 구독 조회 (is_active 상관없이 모든 레코드)
      const { data: existingSubscription, error: checkError } = await supabase
        .from('user_push_subscriptions')
        .select('id, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('기존 구독 확인:', { 
        hasExisting: !!existingSubscription, 
        isActive: existingSubscription?.is_active,
        checkError 
      });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('기존 구독 확인 실패:', checkError);
        return false;
      }

      let result;
      
      if (existingSubscription) {
        // 기존 구독이 있으면 UPDATE (endpoint와 키 정보 업데이트 + 활성화)
        console.log('Updating existing subscription with ID:', existingSubscription.id);
        const { data, error } = await supabase
          .from('user_push_subscriptions')
          .update({
            endpoint: subscriptionData.endpoint,
            p256dh_key: subscriptionData.keys.p256dh,
            auth_key: subscriptionData.keys.auth,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
          .select()
          .single();

        result = { data, error, operation: 'UPDATE' };
      } else {
        // 기존 구독이 없으면 INSERT (새 구독 생성)
        console.log('Creating new subscription...');
        const { data, error } = await supabase
          .from('user_push_subscriptions')
          .insert({
            user_id: user.id,
            endpoint: subscriptionData.endpoint,
            p256dh_key: subscriptionData.keys.p256dh,
            auth_key: subscriptionData.keys.auth,
            is_active: true
          })
          .select()
          .single();

        result = { data, error, operation: 'INSERT' };
      }

      console.log('구독 처리 결과:', {
        operation: result.operation,
        success: !result.error,
        error: result.error
      });

      if (result.error) {
        console.error('Failed to save subscription:', result.error);
        return false;
      }

      console.log('Subscription saved successfully');
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, permission]);

  // Push 구독 해제 (user_id로 찾아서 is_active를 false로 UPDATE)
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      console.log('Starting unsubscribe for user:', user.id);
      
      // 1. 브라우저에서 구독 해제
      try {
        const browserUnsubscribed = await unsubscribeFromPush();
        console.log('Browser unsubscribe result:', browserUnsubscribed);
      } catch (pushError) {
        console.warn('Browser unsubscribe failed:', pushError);
      }

      // 2. 서버에서 해당 사용자의 구독을 is_active = false로 UPDATE
      console.log('Deactivating subscription in database...');
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      console.log('Server update result:', {
        success: !error,
        updatedCount: data?.length || 0,
        error
      });

      if (error) {
        console.error('Database update failed:', error);
        return false;
      }

      if (data && data.length === 0) {
        console.warn('No subscriptions were updated - user might not have any subscriptions');
      }

      setIsSubscribed(false);
      return true;

    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    } finally {
      setIsLoading(false);
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