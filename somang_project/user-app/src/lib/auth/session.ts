// src/lib/auth/session.ts
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface SessionValidationResult {
  isValid: boolean;
  session: Session | null;
  shouldRefresh: boolean;
  error?: string;
}

/**
 * 세션의 유효성을 검증하는 함수
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[validateSession] 세션 조회 오류:', error);
      return {
        isValid: false,
        session: null,
        shouldRefresh: false,
        error: error.message
      };
    }

    if (!session) {
      return {
        isValid: false,
        session: null,
        shouldRefresh: false,
        error: 'No session found'
      };
    }

    // 세션 만료 시간 확인 (5분 여유를 둠)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const shouldRefresh = (expiresAt - now) < 300; // 5분 미만 남았으면 갱신

    // 사용자 정보 재검증
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        isValid: false,
        session: null,
        shouldRefresh: false,
        error: 'User validation failed'
      };
    }

    return {
      isValid: true,
      session,
      shouldRefresh,
    };
  } catch (error) {
    console.error('[validateSession] 예외 발생:', error);
    return {
      isValid: false,
      session: null,
      shouldRefresh: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 세션을 강제로 새로고침하는 함수
 */
export async function refreshSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[refreshSession] 세션 새로고침 오류:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('[refreshSession] 예외 발생:', error);
    return null;
  }
}

/**
 * 세션 상태를 안전하게 복원하는 함수
 */
export async function restoreSession(): Promise<Session | null> {
  try {
    // 1단계: 기본 세션 확인
    const validation = await validateSession();
    
    if (validation.isValid && validation.session) {
      // 세션이 유효하지만 갱신이 필요한 경우
      if (validation.shouldRefresh) {
        console.log('[restoreSession] 세션 갱신 필요');
        const refreshedSession = await refreshSession();
        return refreshedSession || validation.session;
      }
      
      return validation.session;
    }

    // 2단계: 세션이 유효하지 않으면 새로고침 시도
    console.log('[restoreSession] 세션 무효 - 새로고침 시도');
    const refreshedSession = await refreshSession();
    
    if (refreshedSession) {
      // 새로고침된 세션 재검증
      const revalidation = await validateSession();
      return revalidation.isValid ? refreshedSession : null;
    }

    return null;
  } catch (error) {
    console.error('[restoreSession] 예외 발생:', error);
    return null;
  }
}

/**
 * 로컬 스토리지에서 세션 정보를 강제로 정리하는 함수
 */
export function clearLocalSessionData(): void {
  try {
    // Supabase 관련 로컬 스토리지 항목들을 모두 삭제
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('[clearLocalSessionData] 로컬 세션 데이터 정리 완료:', keysToRemove);
  } catch (error) {
    console.error('[clearLocalSessionData] 오류:', error);
  }
}

/**
 * 브라우저 탭 활성화 시 세션 상태를 확인하고 복원하는 함수
 */
export async function handleTabActivation(): Promise<{
  session: Session | null;
  shouldUpdateState: boolean;
  action: 'maintain' | 'refresh' | 'logout';
}> {
  try {
    const restoredSession = await restoreSession();
    
    if (!restoredSession) {
      return {
        session: null,
        shouldUpdateState: true,
        action: 'logout'
      };
    }
    
    return {
      session: restoredSession,
      shouldUpdateState: true,
      action: 'refresh'
    };
  } catch (error) {
    console.error('[handleTabActivation] 오류:', error);
    return {
      session: null,
      shouldUpdateState: true,
      action: 'logout'
    };
  }
}

/**
 * 세션 만료 시간을 확인하는 함수
 */
export function getSessionTimeInfo(session: Session | null): {
  isExpired: boolean;
  expiresIn: number; // 초 단위
  shouldRefresh: boolean;
} {
  if (!session || !session.expires_at) {
    return {
      isExpired: true,
      expiresIn: 0,
      shouldRefresh: false
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  const expiresIn = expiresAt - now;
  
  return {
    isExpired: expiresIn <= 0,
    expiresIn: Math.max(0, expiresIn),
    shouldRefresh: expiresIn < 300 && expiresIn > 0 // 5분 미만 남았을 때
  };
}