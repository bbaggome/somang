// src/hooks/useOptimizedAuth.ts
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseOptimizedAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  loadingTimeout?: number;
  skipInitialLoading?: boolean;
}

/**
 * 성능 최적화된 인증 훅
 * 탭 이동 시 로딩 상태를 최소화하고 빠른 응답을 제공
 */
export function useOptimizedAuth(options: UseOptimizedAuthOptions = {}) {
  const {
    requireAuth = true,
    redirectTo = '/login',
    loadingTimeout = 8000,
    skipInitialLoading = false
  } = options;

  const { user, profile, session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [localLoading, setLocalLoading] = useState(!skipInitialLoading);
  const redirectAttempted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateCheck = useRef<number>(0);

  // 실제 로딩 상태 (로컬 + 글로벌)
  const isLoading = localLoading || authLoading;

  // 빠른 상태 체크 함수
  const quickStateCheck = () => {
    const now = Date.now();
    
    // 1초 이내 중복 체크 방지
    if (now - lastStateCheck.current < 1000) {
      return;
    }
    
    lastStateCheck.current = now;
    
    // 인증이 완료된 상태라면 로컬 로딩 해제
    if (user && profile && !authLoading) {
      setLocalLoading(false);
      return;
    }
    
    // 인증이 필요하지만 사용자가 없다면 리디렉션
    if (requireAuth && !authLoading && !user && !redirectAttempted.current) {
      redirectAttempted.current = true;
      router.push(redirectTo);
      return;
    }
  };

  // 상태 변경 감지
  useEffect(() => {
    quickStateCheck();
  }, [user, profile, authLoading, requireAuth]);

  // 로딩 타임아웃 설정
  useEffect(() => {
    if (isLoading && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        console.warn('[useOptimizedAuth] 로딩 타임아웃');
        setLocalLoading(false);
        
        if (requireAuth && !user) {
          redirectAttempted.current = true;
          router.push(redirectTo);
        }
      }, loadingTimeout);
    }

    if (!isLoading && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, requireAuth, user, loadingTimeout]);

  // 페이지 가시성 변경 시 빠른 체크
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 탭이 활성화되면 빠른 상태 체크
        setTimeout(quickStateCheck, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 강제 리디렉션 함수
  const forceRedirect = () => {
    if (!redirectAttempted.current) {
      redirectAttempted.current = true;
      router.push(redirectTo);
    }
  };

  // 로딩 해제 함수
  const forceEndLoading = () => {
    setLocalLoading(false);
  };

  return {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!(user && profile),
    forceRedirect,
    forceEndLoading,
    redirectAttempted: redirectAttempted.current
  };
}

/**
 * 보호된 페이지용 간단한 훅
 */
export function useProtectedPage(redirectTo: string = '/login') {
  return useOptimizedAuth({
    requireAuth: true,
    redirectTo,
    loadingTimeout: 5000,
    skipInitialLoading: false
  });
}

/**
 * 공개 페이지용 훅 (로그인된 사용자는 메인으로)
 */
export function usePublicPage(redirectTo: string = '/') {
  return useOptimizedAuth({
    requireAuth: false,
    redirectTo,
    loadingTimeout: 3000,
    skipInitialLoading: true
  });
}