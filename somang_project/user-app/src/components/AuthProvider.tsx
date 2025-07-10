'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

  // 프로필 생성 함수 (랜덤 닉네임 포함)
  const createProfile = async (userId: string, userEmail: string) => {
    try {
      const nickname = generateRandomNickname();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'user',
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
  };

  // 프로필 조회 함수
  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
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

      return data;
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      return null;
    }
  };

  // 로그아웃 함수
  const signOut = async () => {
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
      
      // 로컬 스토리지 정리
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('AuthProvider 로그아웃 완료');
    } catch (error) {
      console.error('AuthProvider 로그아웃 실패:', error);
      // 에러가 발생해도 상태는 초기화
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        console.log('초기 세션 확인 시작');
        setIsInitializing(true);
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('초기 세션:', session?.user?.email || 'null');
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id, session.user.email || '');
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
      } catch (error) {
        console.error('초기 세션 확인 실패:', error);
        setUser(null);
        setProfile(null);
      } finally {
        // 초기화 완료
        setIsLoading(false);
        setIsInitializing(false);
        console.log('초기 세션 확인 완료');
      }
    };

    getInitialSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'null');
      
      // 초기화가 완료된 후에만 상태 변경 처리
      if (!isInitializing) {
        setIsLoading(true);
      }
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id, session.user.email || '');
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      // 초기화가 완료된 후에만 로딩 상태 해제
      if (!isInitializing) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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