'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { generateRandomNickname } from '@/lib/utils/nickname';
import type { Profile, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // 중복 요청 방지를 위한 ref들
  const fetchingProfile = useRef(false);
  const mounted = useRef(true);
  const authStateChangeCount = useRef(0);

  // 프로필 생성 함수 (랜덤 닉네임 포함)
  const createProfile = useCallback(async (userId: string, userEmail: string) => {
    try {
      const nickname = generateRandomNickname();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'user', // user-app은 항상 'user' 역할
          name: userEmail.split('@')[0], // 이메일 앞부분을 기본 이름으로 사용
          nick_name: nickname,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      return null;
    }
  }, []);

  // 프로필 조회 함수 (권한 검증 추가)
  const fetchProfile = useCallback(async (userId: string, userEmail: string) => {
    // 이미 프로필을 가져오는 중이면 대기
    if (fetchingProfile.current) {
      return null;
    }

    try {
      fetchingProfile.current = true;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 프로필이 없으면 생성
          const newProfile = await createProfile(userId, userEmail);
          return newProfile;
        }
        throw error;
      }

      // user-app에서는 'user' 역할만 허용
      if (data.role !== 'user') {
        console.warn('user-app에 부적절한 역할로 접근 시도:', data.role);
        // 강제 로그아웃
        await signOut();
        return null;
      }

      return data;
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      return null;
    } finally {
      fetchingProfile.current = false;
    }
  }, [createProfile]);

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      console.log('AuthProvider 로그아웃 시작');
      
      // 즉시 로컬 상태 초기화
      setUser(null);
      setProfile(null);
      
      // Supabase 로그아웃 시도
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase 로그아웃 에러:', error);
      }
      
      // 로컬 스토리지 정리 (user-token 키만)
      localStorage.removeItem('sb-user-token-auth-token');
      sessionStorage.clear();
      
      console.log('AuthProvider 로그아웃 완료');
    } catch (error) {
      console.error('AuthProvider 로그아웃 실패:', error);
      // 에러가 발생해도 상태는 초기화
      setUser(null);
      setProfile(null);
    }
  }, []);

  // 세션 처리 함수
  const handleSession = useCallback(async (session: any, isInitial = false) => {
    if (!mounted.current) return;

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      // 프로필 정보 로드
      const profileData = await fetchProfile(currentUser.id, currentUser.email || '');
      if (mounted.current) {
        setProfile(profileData);
      }
    } else {
      setProfile(null);
    }

    // 로딩 상태 해제
    if (mounted.current) {
      if (isInitial) {
        setIsInitializing(false);
      }
      setIsLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    mounted.current = true;
    
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        console.log('user-app 초기 세션 확인 시작');
        setIsInitializing(true);
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('user-app 초기 세션:', session?.user?.email || 'null');
        
        await handleSession(session, true);
        
      } catch (error) {
        console.error('초기 세션 확인 실패:', error);
        if (mounted.current) {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          setIsInitializing(false);
        }
      }
    };

    getInitialSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 이벤트 카운터 증가
      authStateChangeCount.current += 1;
      const currentCount = authStateChangeCount.current;
      
      console.log(`user-app Auth state changed (${currentCount}):`, event, session?.user?.email || 'null');
      
      // 초기화 완료 후에만 상태 변경 처리
      if (!isInitializing && mounted.current) {
        // 짧은 디바운스를 적용하여 중복 호출 방지
        setTimeout(async () => {
          // 최신 이벤트인지 확인
          if (currentCount === authStateChangeCount.current && mounted.current) {
            setIsLoading(true);
            await handleSession(session, false);
          }
        }, 100);
      }
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []); // 빈 의존성 배열로 마운트시에만 실행

  const value = {
    user,
    profile,
    isLoading,
    isInitializing,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
}