'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export default function AuthDebug() {
  const { user, profile, session, isLoading } = useAuth();
  const [rawSessionInfo, setRawSessionInfo] = useState<any>(null);
  const [rawUserInfo, setRawUserInfo] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  const runDiagnostics = async () => {
    console.log('=== 인증 진단 시작 ===');
    
    try {
      // 1. 직접 세션 확인
      const { data: { session: directSession }, error: sessionError } = await supabase.auth.getSession();
      setRawSessionInfo({ session: directSession, error: sessionError });
      console.log('직접 세션 확인:', { session: directSession, error: sessionError });

      // 2. 직접 사용자 확인
      const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
      setRawUserInfo({ user: directUser, error: userError });
      console.log('직접 사용자 확인:', { user: directUser, error: userError });

      // 3. Supabase 연결 테스트
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      setConnectionTest({ data, error, connected: !error });
      console.log('연결 테스트:', { data, error, connected: !error });

      // 4. 로컬 스토리지 확인
      const storageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          storageKeys.push({
            key,
            hasValue: !!localStorage.getItem(key),
            valueLength: localStorage.getItem(key)?.length || 0
          });
        }
      }
      console.log('로컬 스토리지 키:', storageKeys);

    } catch (error) {
      console.error('진단 중 오류:', error);
    }
    
    console.log('=== 인증 진단 완료 ===');
  };

  const forceRefresh = async () => {
    console.log('강제 새로고침 시도...');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      console.log('세션 새로고침 결과:', { data, error });
    } catch (error) {
      console.error('세션 새로고침 오류:', error);
    }
  };

  const testProfileFetch = async () => {
    if (!user?.id) {
      console.log('사용자 ID가 없음');
      return;
    }
    
    console.log('프로필 직접 조회 테스트...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('프로필 조회 결과:', { data, error });
    } catch (error) {
      console.error('프로필 조회 오류:', error);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">인증 상태 진단</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={runDiagnostics}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          진단 실행
        </button>
        <button 
          onClick={forceRefresh}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          세션 새로고침
        </button>
        <button 
          onClick={testProfileFetch}
          className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
        >
          프로필 직접 조회
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">AuthProvider 상태</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              hasUser: !!user,
              hasProfile: !!profile,
              hasSession: !!session,
              isLoading,
              userId: user?.id,
              profileId: profile?.id,
              profileNickname: profile?.nick_name
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">직접 세션 확인</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              hasSession: !!rawSessionInfo?.session,
              userId: rawSessionInfo?.session?.user?.id,
              error: rawSessionInfo?.error
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">직접 사용자 확인</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              hasUser: !!rawUserInfo?.user,
              userId: rawUserInfo?.user?.id,
              email: rawUserInfo?.user?.email,
              error: rawUserInfo?.error
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">연결 테스트</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(connectionTest, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}