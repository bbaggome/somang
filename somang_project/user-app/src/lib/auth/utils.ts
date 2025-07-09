import { supabase } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/auth';

/**
 * 사용자 프로필을 가져오는 함수 (재시도 로직 포함)
 */
export async function fetchUserProfile(
  userId: string, 
  retryCount = 0,
  maxRetries = 3
): Promise<UserProfile | null> {
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[fetchUserProfile] ${message}`, data || '');
    }
  };

  debugLog(`조회 시도 (${retryCount + 1}/${maxRetries + 1}):`, userId);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      debugLog('조회 에러:', error);
      
      // 새로 가입한 사용자의 경우 프로필이 아직 생성되지 않았을 수 있음
      if (error.code === 'PGRST116' && retryCount < maxRetries) {
        debugLog(`생성 대기 중... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchUserProfile(userId, retryCount + 1, maxRetries);
      }
      
      console.error('[fetchUserProfile] 최종 실패:', error);
      return null;
    }

    debugLog('조회 성공:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('[fetchUserProfile] 예외 발생:', error);
    return null;
  }
}

/**
 * 세션 정리 함수
 */
export async function clearSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
    if (process.env.NODE_ENV === 'development') {
      console.log('[clearSession] 세션 정리 완료');
    }
  } catch (error) {
    console.error('[clearSession] 세션 정리 오류:', error);
  }
}

/**
 * 사용자 권한 확인 함수
 */
export function hasPermission(
  userRole: UserProfile['role'], 
  requiredRole: UserProfile['role']
): boolean {
  const roleHierarchy: Record<UserProfile['role'], number> = {
    'user': 1,
    'owner': 2,
    'admin': 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * 에러 메시지 변환 함수
 */
export function getAuthErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'session_exchange_failed': '로그인 처리 중 오류가 발생했습니다.',
    'callback_error': '인증 처리 중 오류가 발생했습니다.',
    'no_code': '인증 코드가 없습니다.',
    'no_user_session': '사용자 세션을 생성할 수 없습니다.',
    'callback_exception': '로그인 처리 중 예외가 발생했습니다.',
  };

  return errorMessages[error] || '로그인에 실패했습니다. 다시 시도해주세요.';
}