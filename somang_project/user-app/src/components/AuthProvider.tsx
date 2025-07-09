"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile, AuthContextType } from "@/types/auth";

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
});

// 로그 레벨 설정
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === "development" ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;

// 개발 환경에서만 로그 출력하는 함수 (레벨별 구분)
const log = {
  error: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) {
      console.error(`[AuthProvider] ${message}`, data || "");
    }
  },
  warn: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) {
      console.warn(`[AuthProvider] ${message}`, data || "");
    }
  },
  info: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) {
      console.log(`[AuthProvider] ${message}`, data || "");
    }
  },
  debug: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      console.log(`[AuthProvider] ${message}`, data || "");
    }
  },
};

// 앱 전체를 감싸는 인증 상태를 제공할 프로바이더 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // 중복 요청 방지를 위한 ref
  const isInitializing = useRef(false);
  const profileFetchAttempts = useRef(new Map<string, number>());
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityCheck = useRef<number>(0);

  // 사용자 프로필 정보를 가져오는 함수 (재시도 로직 포함)
  const fetchUserProfile = useCallback(
    async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
      log.debug(`프로필 조회 시도 (${retryCount + 1}/4):`, userId);

      // 동일한 사용자에 대해 최대 재시도 횟수 체크
      const attempts = profileFetchAttempts.current.get(userId) || 0;
      if (attempts >= 4) {
        log.warn(`사용자 ${userId}에 대한 최대 재시도 횟수 초과`);
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          log.debug("프로필 조회 에러:", error);
          // 새로 가입한 사용자의 경우 프로필이 아직 생성되지 않았을 수 있음
          if (error.code === "PGRST116" && retryCount < 3) {
            log.info(`프로필 생성 대기 중... (${retryCount + 1}/3)`);
            profileFetchAttempts.current.set(userId, attempts + 1);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 대기
            return fetchUserProfile(userId, retryCount + 1);
          }
          log.error("프로필 조회 최종 실패:", error);
          return null;
        }

        log.info("프로필 조회 성공");
        // 성공 시 재시도 카운터 리셋
        profileFetchAttempts.current.delete(userId);
        return data as UserProfile;
      } catch (error) {
        log.error("프로필 조회 중 예외 발생:", error);
        return null;
      }
    },
    []
  );

  // 로컬 세션을 정리하는 함수
  const clearLocalSession = useCallback(async () => {
    log.info("로컬 세션 정리 중...");
    try {
      setUser(null);
      setProfile(null);
      setSession(null);
      setInitError(null);
      // 재시도 카운터도 리셋
      profileFetchAttempts.current.clear();
      log.info("로컬 세션 정리 완료");
    } catch (error) {
      log.error("로컬 세션 정리 오류:", error);
    }
  }, []);

  // 강제로 로딩 상태를 해제하는 함수 (타임아웃용)
  const forceEndLoading = useCallback(() => {
    log.warn("강제 로딩 상태 해제 (타임아웃)");
    setIsLoading(false);
    if (!user && !session) {
      setInitError("인증 초기화 시간 초과");
    }
  }, [user, session]);

  // 빠른 세션 검증 (탭 이동 시 사용)
  const quickSessionCheck = useCallback(async (): Promise<boolean> => {
    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error || !currentSession) {
        return false;
      }

      // 세션 만료 체크
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = currentSession.expires_at || 0;

      if (expiresAt <= now) {
        log.info("세션 만료됨");
        return false;
      }

      // 기존 세션과 비교
      if (session?.access_token !== currentSession.access_token) {
        log.info("세션 토큰 변경됨");
        setSession(currentSession);
      }

      return true;
    } catch (error) {
      log.error("빠른 세션 검증 오류:", error);
      return false;
    }
  }, [session]);

  // 인증 상태를 업데이트하는 함수
  const updateAuthState = useCallback(
    async (
      session: Session | null,
      skipLoading = false,
      isQuickCheck = false
    ) => {
      // 빠른 체크 모드에서는 기존 상태가 있으면 스킵
      if (isQuickCheck && user && profile) {
        const isValid = await quickSessionCheck();
        if (isValid) {
          log.debug("빠른 체크 - 기존 상태 유지");
          return;
        }
      }

      // 이미 초기화 중이면 중복 실행 방지
      if (isInitializing.current && !isQuickCheck) {
        log.debug("이미 초기화 중 - 중복 실행 방지");
        return;
      }

      if (!isQuickCheck) {
        isInitializing.current = true;
      }

      if (!skipLoading && !isQuickCheck) {
        setIsLoading(true);
      }

      // 로딩 타임아웃 설정 (5초로 단축)
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      if (!isQuickCheck) {
        loadingTimeout.current = setTimeout(forceEndLoading, 5000);
      }

      log.info("인증 상태 업데이트 시작:", {
        hasSession: !!session,
        userId: session?.user?.id,
        isQuickCheck,
      });

      try {
        if (!session) {
          log.info("세션 없음 - 로그아웃 상태로 설정");
          await clearLocalSession();
          setIsLoading(false);
          return;
        }

        // 빠른 체크 모드가 아닐 때만 서버 검증
        if (!isQuickCheck) {
          // 서버에서 사용자 정보를 검증
          const {
            data: { user: serverUser },
            error: userError,
          } = await supabase.auth.getUser();

          log.debug("서버 사용자 검증 결과:", {
            hasUser: !!serverUser,
            userId: serverUser?.id,
            error: userError,
          });

          if (userError || !serverUser) {
            log.warn("서버에서 사용자를 찾을 수 없습니다.");
            await clearLocalSession();
            setIsLoading(false);
            return;
          }

          // 사용자가 존재하면 프로필 정보도 확인
          const userProfile = await fetchUserProfile(serverUser.id);

          if (!userProfile) {
            log.warn("프로필을 찾을 수 없습니다.");
            // 프로필이 없어도 사용자 정보는 설정 (새 가입자의 경우)
            setUser(serverUser);
            setSession(session);
            setProfile(null);
            setIsLoading(false);
            return;
          }

          // 모든 검증을 통과한 경우에만 사용자 정보 설정
          log.info(
            `인증 상태 업데이트 완료: ${
              userProfile.nick_name || serverUser.email
            }`
          );
          setUser(serverUser);
          setProfile(userProfile);
        }

        setSession(session);
        setIsLoading(false);
      } catch (error) {
        log.error("인증 상태 업데이트 중 오류 발생:", error);
        setInitError(
          error instanceof Error ? error.message : "인증 초기화 실패"
        );
        if (!isQuickCheck) {
          await clearLocalSession();
        }
        setIsLoading(false);
      } finally {
        if (!isQuickCheck) {
          isInitializing.current = false;
        }
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
          loadingTimeout.current = null;
        }
      }
    },
    [
      fetchUserProfile,
      clearLocalSession,
      forceEndLoading,
      quickSessionCheck,
      user,
      profile,
    ]
  );

  // 페이지 가시성 변경 감지 (탭 간 이동 처리) - 최적화
  useEffect(() => {
    if (!isClient) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();

        // 마지막 체크로부터 5초 이내면 스킵 (너무 빈번한 체크 방지)
        if (now - lastVisibilityCheck.current < 5000) {
          log.debug("최근에 체크했음 - 스킵");
          return;
        }

        lastVisibilityCheck.current = now;
        log.info("페이지가 다시 활성화됨 - 빠른 세션 상태 확인");

        try {
          // 현재 세션 상태 빠른 확인
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            log.error("세션 확인 중 오류:", error);
            if (!user) {
              // 기존 사용자 정보가 없을 때만 정리
              await clearLocalSession();
              setIsLoading(false);
            }
            return;
          }

          // 세션이 없거나 만료된 경우
          if (!currentSession) {
            log.info("세션이 없거나 만료됨");
            await clearLocalSession();
            setIsLoading(false);
            return;
          }

          // 세션 만료 체크
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = currentSession.expires_at || 0;

          if (expiresAt <= now) {
            log.info("세션 만료됨");
            await clearLocalSession();
            setIsLoading(false);
            return;
          }

          // 빠른 업데이트 (서버 검증 스킵)
          await updateAuthState(currentSession, true, true);
        } catch (error) {
          log.error("페이지 활성화 시 세션 확인 오류:", error);
          // 에러가 발생해도 기존 상태 유지
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isClient, updateAuthState, clearLocalSession, user]);

  // 클라이언트 사이드에서만 실행되도록 하는 useEffect
  useEffect(() => {
    log.debug("클라이언트 사이드 설정");
    setIsClient(true);
  }, []);

// 초기 세션 확인
useEffect(() => {
  if (!isClient) {
    log.debug('클라이언트가 아직 준비되지 않음');
    return;
  }
  
  log.debug('초기 세션 확인 시작');
  let mounted = true;

  const checkInitialSession = async () => {
    try {
      log.info('=== 초기 세션 확인 ===');
      
      // 로컬 세션 확인
      const { data: { session: localSession }, error: sessionError } = await supabase.auth.getSession();
      
      log.debug('로컬 세션 결과:', { 
        hasSession: !!localSession, 
        userId: localSession?.user?.id,
        error: sessionError 
      });
      
      if (mounted) {
        if (!localSession) {
          log.info('세션 없음 - 로그아웃 상태로 즉시 설정');
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsLoading(false);
        } else {
          // 세션이 있는 경우 updateAuthState 호출
          // updateAuthState 함수를 직접 호출하는 대신 내부 로직 구현
          try {
            setIsLoading(true);
            
            // 세션 정보 설정
            setSession(localSession);
            
            // 사용자 정보 검증
            const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !serverUser) {
              log.warn('서버에서 사용자를 찾을 수 없습니다.');
              await clearLocalSession();
              setIsLoading(false);
              return;
            }
            
            setUser(serverUser);
            
            // 프로필 정보 가져오기
            const userProfile = await fetchUserProfile(serverUser.id);
            
            if (userProfile) {
              setProfile(userProfile);
              log.info(`인증 상태 초기화 완료: ${userProfile.nick_name || serverUser.email}`);
            } else {
              log.warn('프로필을 찾을 수 없습니다 (새 사용자일 수 있음)');
              setProfile(null);
            }
            
            setIsLoading(false);
          } catch (error) {
            log.error('세션 업데이트 중 오류:', error);
            if (mounted) {
              await clearLocalSession();
              setIsLoading(false);
            }
          }
        }
      }
      
    } catch (error) {
      log.error('초기 세션 확인 중 오류 발생:', error);
      if (mounted) {
        setIsLoading(false);
        setInitError('세션 확인 중 오류가 발생했습니다.');
      }
    }
    log.info('=== 초기 세션 확인 완료 ===');
  };

  // 초기 세션 확인을 약간 지연시켜 hydration 문제 방지
  const timeoutId = setTimeout(checkInitialSession, 100);

  return () => {
    mounted = false;
    clearTimeout(timeoutId);
  };
}, [isClient, fetchUserProfile, clearLocalSession]); // 의존성 수정

  // 인증 상태 변경 리스너
  useEffect(() => {
    if (!isClient) {
      return;
    }

    log.debug("인증 상태 변경 리스너 등록");

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 중요한 상태 변경만 로그 출력
        if (event !== "TOKEN_REFRESHED") {
          log.info(`Auth state change: ${event}`, {
            hasSession: !!session,
            userId: session?.user?.id,
          });
        }

        if (event === "SIGNED_OUT" || !session) {
          log.info("로그아웃 이벤트");
          await clearLocalSession();
          setIsLoading(false);
          return;
        }

        if (event === "SIGNED_IN") {
          log.info("로그인 이벤트 - 상태 업데이트 시작");
          await updateAuthState(session);
        } else if (event === "TOKEN_REFRESHED") {
          // 토큰 갱신 시에는 기존 상태를 유지하면서 세션만 업데이트
          log.debug("토큰 갱신");
          setSession(session);
        }
      }
    );

    return () => {
      log.debug("인증 리스너 정리");
      authListener.subscription.unsubscribe();
    };
  }, [isClient, updateAuthState, clearLocalSession]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  // 디버깅을 위한 상태 로그 (개발 환경에서만, 빈도 조절)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const timer = setTimeout(() => {
        log.debug("현재 인증 상태:", {
          hasUser: !!user,
          hasProfile: !!profile,
          hasSession: !!session,
          isLoading,
          isClient,
          userId: user?.id,
          profileNickname: profile?.nick_name,
          initError,
        });
      }, 1000); // 1초 지연으로 빈번한 로그 방지

      return () => clearTimeout(timer);
    }
  }, [user, profile, session, isLoading, isClient, initError]);

  const value = {
    user,
    profile,
    session,
    isLoading: isLoading || !isClient, // 클라이언트가 준비되지 않았으면 로딩 상태 유지
  };

  // 에러가 있는 경우 에러 화면 표시
  if (initError && !isLoading && isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            인증 초기화 오류
          </h2>
          <p className="text-red-700 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 다른 컴포넌트에서 인증 상태를 쉽게 사용하기 위한 커스텀 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
