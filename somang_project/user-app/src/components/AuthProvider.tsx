"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// 인증 컨텍스트의 타입 정의
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

// 앱 전체를 감싸는 인증 상태를 제공할 프로바이더 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 현재 세션을 가져와 상태를 설정합니다.
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    getSession();    

    // supabase의 인증 상태 변경(로그인, 로그아웃 등)을 실시간으로 감지합니다.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // 컴포넌트 언마운트 시 구독 해제 (리스너 정리)
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
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
