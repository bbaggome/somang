import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

/**
 * 인증 상태에 따른 리디렉션 처리 훅
 */
export function useAuthRedirect(options: {
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: Array<'user' | 'owner' | 'admin'>;
}) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const { 
    requireAuth = true, 
    redirectTo = '/login',
    allowedRoles 
  } = options;

  useEffect(() => {
    if (isLoading) return;

    // 인증이 필요한 페이지인데 로그인하지 않은 경우
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // 인증이 필요하지 않은 페이지인데 이미 로그인한 경우
    if (!requireAuth && user) {
      router.push('/');
      return;
    }

    // 특정 역할이 필요한 경우
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, profile, isLoading, requireAuth, redirectTo, allowedRoles, router]);

  return { user, profile, isLoading };
}

/**
 * 로컬 스토리지 관리 훅
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`로컬 스토리지 읽기 오류 (${key}):`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`로컬 스토리지 저장 오류 (${key}):`, error);
    }
  };

  return [storedValue, setValue];
}