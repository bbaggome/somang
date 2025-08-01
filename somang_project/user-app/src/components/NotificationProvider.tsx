// user-app/src/components/NotificationProvider.tsx (단순화된 로직)
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
// Service Worker 기반 Push 알림 대신 기본 브라우저 알림만 사용

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
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 기본 브라우저 알림 지원 (서비스 워커 없이)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'Notification' in window;
      setIsSupported(supported);
      setPermission(supported ? Notification.permission : 'denied');
      console.log('NotificationProvider - 기본 알림 지원 여부:', supported);
    }
  }, []);

  // 간단한 알림 권한 체크만
  useEffect(() => {
    if (isSupported && typeof window !== 'undefined') {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      setIsSubscribed(currentPermission === 'granted');
      console.log('현재 알림 권한 상태:', currentPermission);
    }
  }, [isSupported, user]);

  // 기본 브라우저 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('권한 요청 전 상태:', Notification.permission);
      
      const newPermission = await Notification.requestPermission();
      console.log('권한 요청 후 상태:', newPermission);
      
      // 상태를 즉시 업데이트
      setPermission(newPermission);
      setIsSubscribed(newPermission === 'granted');
      
      // 약간의 지연을 두어 상태 업데이트가 확실히 반영되도록 함
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return newPermission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 간단한 알림 활성화
  const subscribe = useCallback(async (): Promise<boolean> => {
    // 실시간으로 현재 권한 상태 확인
    const currentPermission = typeof window !== 'undefined' ? Notification.permission : 'denied';
    
    if (!user || !isSupported || currentPermission !== 'granted') {
      console.error('Subscribe failed - prerequisites not met:', {
        hasUser: !!user,
        isSupported,
        currentPermission
      });
      return false;
    }

    try {
      setIsLoading(true);
      console.log('브라우저 알림 활성화');
      
      // localStorage에 알림 설정 저장
      localStorage.setItem('user-wants-notifications', 'true');
      
      // 상태를 실시간 권한 상태로 업데이트
      setPermission(currentPermission);
      setIsSubscribed(true);
      
      // storage 이벤트 발생시키기 (같은 탭에서도 감지되도록)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user-wants-notifications',
        newValue: 'true',
        oldValue: 'false',
        storageArea: localStorage
      }));
      
      // 간단한 알림 테스트
      new Notification('T-BRIDGE', {
        body: '알림이 활성화되었습니다!',
        icon: '/next.svg'
      });
      
      console.log('✅ 알림 구독 완료');
      return true;
    } catch (error) {
      console.error('Notification activation failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  // 간단한 알림 비활성화
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      console.log('브라우저 알림 비활성화');
      
      // localStorage에서 알림 설정 제거
      localStorage.removeItem('user-wants-notifications');
      
      // storage 이벤트 발생시키기 (같은 탭에서도 감지되도록)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user-wants-notifications',
        newValue: null,
        oldValue: 'true',
        storageArea: localStorage
      }));
      
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