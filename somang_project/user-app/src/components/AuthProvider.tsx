"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// 사용자 프로필 정보 타입 정의
interface UserProfile {
  id: string;
  role: string;
  name: string | null;
  nick_name: string | null;
  phone_number: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

// 인증 컨텍스트의 타입 정의
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
});

// 앱 전체를 감싸는 인증 상태를 제공할 프로바이더 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  console.log('AuthProvider 상태:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    hasSession: !!session, 
    isLoading,
    isClient 
  });

  // 클라이언트 사이드에서만 실행되도록 하는 useEffect
  useEffect(() => {
    console.log('클라이언트 사이드 설정');
    setIsClient(true);
  }, []);

  // 사용자 프로필 정보를 가져오는 함수 (재시도 로직 포함)
  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    console.log(`프로필 조회 시도 (${retryCount + 1}/4):`, userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('프로필 조회 에러:', error);
        // 새로 가입한 사용자의 경우 프로필이 아직 생성되지 않았을 수 있음
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log(`프로필 생성 대기 중... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
          return fetchUserProfile(userId, retryCount + 1);
        }
        console.error('프로필 조회 최종 실패:', error);
        return null;
      }

      console.log('프로필 조회 성공:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('프로필 조회 중 예외 발생:', error);
      return null;
    }
  };

  // 로컬 세션을 정리하는 함수
  const clearLocalSession = async () => {
    console.log('로컬 세션 정리 중...');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      console.log('로컬 세션 정리 완료');
    } catch (error) {
      console.error('로컬 세션 정리 오류:', error);
    }
  };

  useEffect(() => {
    if (!isClient) {
      console.log('클라이언트가 아직 준비되지 않음');
      return; // 클라이언트 사이드에서만 실행
    }
    
    console.log('AuthProvider useEffect 시작');
    let mounted = true;

    // 1. 컴포넌트 마운트 시, 서버에 직접 사용자 유효성을 확인합니다.
    const checkUser = async () => {
      console.log('=== 사용자 확인 시작 ===');
      try {
        // 먼저 로컬 세션을 확인
        console.log('로컬 세션 확인 중...');
        const { data: { session: localSession }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('로컬 세션 결과:', { 
          hasSession: !!localSession, 
          userId: localSession?.user?.id,
          error: sessionError 
        });
        
        if (!localSession || !mounted) {
          // 로컬 세션이 없으면 로그아웃 상태로 설정
          console.log('로컬 세션이 없음 - 로그아웃 상태로 설정');
          if (mounted) {
            setUser(null);
            setProfile(null);
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        // 서버에서 사용자 정보를 검증
        console.log('서버 사용자 검증 중...');
        const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
        
        console.log('서버 사용자 검증 결과:', { 
          hasUser: !!serverUser, 
          userId: serverUser?.id,
          error: userError 
        });
        
        if (userError || !serverUser || !mounted) {
          // 서버에서 사용자 정보를 찾을 수 없으면 로컬 세션 정리
          console.log('서버에서 사용자를 찾을 수 없습니다. 로컬 세션을 정리합니다.');
          if (mounted) {
            await clearLocalSession();
            setIsLoading(false);
          }
          return;
        }

        // 사용자가 존재하면 프로필 정보도 확인
        console.log('프로필 정보 확인 중...');
        const userProfile = await fetchUserProfile(serverUser.id);
        
        if (!userProfile || !mounted) {
          // 프로필이 없으면 (사용자가 데이터베이스에서 삭제됨) 로컬 세션 정리
          console.log('프로필을 찾을 수 없습니다. 로컬 세션을 정리합니다.');
          if (mounted) {
            await clearLocalSession();
            setIsLoading(false);
          }
          return;
        }

        // 모든 검증을 통과한 경우에만 사용자 정보 설정
        if (mounted) {
          console.log('모든 검증 통과 - 사용자 정보 설정');
          setUser(serverUser);
          setProfile(userProfile);
          setSession(localSession);
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('사용자 확인 중 오류 발생:', error);
        if (mounted) {
          await clearLocalSession();
          setIsLoading(false);
        }
      }
      console.log('=== 사용자 확인 완료 ===');
    };

    checkUser();

    // 2. 로그인/로그아웃 등 실시간 인증 상태 변경을 감지하는 리스너
    console.log('인증 상태 변경 리스너 설정');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== Auth state change ===', event, { 
          hasSession: !!session,
          userId: session?.user?.id 
        });
        
        if (!mounted) {
          console.log('컴포넌트가 언마운트됨 - 처리 중단');
          return;
        }

        if (event === 'SIGNED_OUT' || !session) {
          console.log('로그아웃 또는 세션 없음');
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('로그인 또는 토큰 갱신');
          const currentUser = session.user;
          
          // 서버에서 사용자 정보 재검증
          console.log('서버에서 사용자 정보 재검증...');
          const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !serverUser || !mounted) {
            console.log('인증 상태 변경 시 사용자 검증 실패');
            if (mounted) {
              await clearLocalSession();
              setIsLoading(false);
            }
            return;
          }

          // 프로필 정보 확인 (재시도 로직 포함)
          console.log('프로필 정보 재확인...');
          const userProfile = await fetchUserProfile(currentUser.id);
          
          if (!userProfile || !mounted) {
            console.log('인증 상태 변경 시 프로필 검증 실패');
            if (mounted) {
              await clearLocalSession();
              setIsLoading(false);
            }
            return;
          }

          if (mounted) {
            console.log('인증 상태 변경 - 사용자 정보 업데이트');
            setSession(session);
            setUser(currentUser);
            setProfile(userProfile);
            setIsLoading(false);
          }
        }
      }
    );

    // 3. 컴포넌트 언마운트 시 리스너를 정리합니다.
    return () => {
      console.log('AuthProvider 정리');
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isClient]); // isClient 의존성 추가

  const value = {
    user,
    profile,
    session,
    isLoading: isLoading || !isClient, // 클라이언트가 준비되지 않았으면 로딩 상태 유지
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 다른 컴포넌트에서 인증 상태를 쉽게 사용하기 위한 커스텀 Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}