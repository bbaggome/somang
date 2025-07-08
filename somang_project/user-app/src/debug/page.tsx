'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [localStorageInfo, setLocalStorageInfo] = useState<any>({});

  const checkAllInfo = async () => {
    console.log('=== 디버그 정보 수집 ===');
    
    // 1. 세션 정보 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('세션 정보:', { session, error: sessionError });
    setSessionInfo({ session, error: sessionError });

    // 2. 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('사용자 정보:', { user, error: userError });
    setUserInfo({ user, error: userError });

    // 3. 로컬 스토리지 확인
    const localStorageData: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        const value = localStorage.getItem(key);
        localStorageData[key] = value ? JSON.parse(value) : null;
      }
    }
    console.log('로컬 스토리지:', localStorageData);
    setLocalStorageInfo(localStorageData);
  };

  const clearAll = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setSessionInfo(null);
    setUserInfo(null);
    setLocalStorageInfo({});
  };

  const testKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('카카오 로그인 에러:', error);
    }
  };

  useEffect(() => {
    checkAllInfo();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase 디버그 정보</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={checkAllInfo}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          정보 새로고침
        </button>
        <button 
          onClick={clearAll}
          className="bg-red-500 text-white px-4 py-2 rounded mr-2"
        >
          모든 정보 삭제
        </button>
        <button 
          onClick={testKakaoLogin}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          카카오 로그인 테스트
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">세션 정보</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">사용자 정보</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded md:col-span-2">
          <h2 className="font-bold mb-2">로컬 스토리지</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(localStorageInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded md:col-span-2">
          <h2 className="font-bold mb-2">환경 변수</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
              HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              CURRENT_URL: typeof window !== 'undefined' ? window.location.href : 'N/A'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}