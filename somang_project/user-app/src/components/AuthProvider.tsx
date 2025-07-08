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
    // 1. 컴포넌트 마운트 시, 서버에 직접 사용자 유효성을 확인합니다.
    const checkUser = async () => {
      // getSession() 대신 getUser()를 사용하여 서버에 직접 사용자 정보를 요청합니다.
      // 사용자가 DB에서 삭제되었다면 user는 null이 됩니다.
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // 사용자 정보를 가져온 후 세션 정보도 함께 설정합니다.
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      setIsLoading(false);
    };

    checkUser();

    // 2. 로그인/로그아웃 등 실시간 인증 상태 변경을 감지하는 리스너는 그대로 유지합니다.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // 3. 컴포넌트 언마운트 시 리스너를 정리합니다.
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
