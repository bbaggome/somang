// src/lib/utils/hydration.ts

import { useEffect, useState } from 'react';

/**
 * 클라이언트 마운트 상태를 확인하는 훅
 * Hydration 불일치 방지용
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

/**
 * Hydration 안전한 날짜 포맷 함수
 */
export function useSafeDate() {
  const isMounted = useIsMounted();

  const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
    if (!isMounted) {
      // SSR에서는 기본 형식만 반환
      return new Date(dateString).toLocaleDateString();
    }

    // 클라이언트에서는 상세한 형식 사용
    return new Date(dateString).toLocaleDateString('ko-KR', options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!isMounted) {
      return new Date(dateString).toLocaleDateString();
    }

    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24시간 형식으로 고정하여 일관성 유지
    });
  };

  const formatTime = (date?: Date) => {
    if (!isMounted) {
      return '로딩 중...';
    }

    const targetDate = date || new Date();
    return targetDate.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return {
    isMounted,
    formatDate,
    formatDateTime,
    formatTime
  };
}

/**
 * Hydration 안전한 조건부 렌더링 컴포넌트
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hydration 안전한 로컬 스토리지 훅
 */
export function useSafeLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const isMounted = useIsMounted();
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (!isMounted) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`로컬 스토리지 읽기 오류 (${key}):`, error);
    }
  }, [key, isMounted]);

  const setValue = (value: T | ((val: T) => T)) => {
    if (!isMounted) return;

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

/**
 * 브라우저 환경에서만 실행되는 함수
 */
export function runOnClient(fn: () => void) {
  useEffect(() => {
    fn();
  }, []);
}

/**
 * Hydration 안전한 브라우저 정보 훅
 */
export function useBrowserInfo() {
  const isMounted = useIsMounted();
  const [browserInfo, setBrowserInfo] = useState({
    userAgent: '',
    language: '',
    timeZone: ''
  });

  useEffect(() => {
    if (!isMounted) return;

    setBrowserInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }, [isMounted]);

  return browserInfo;
}