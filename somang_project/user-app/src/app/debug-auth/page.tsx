'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export default function DebugAuthPage() {
  const { user, profile, session, isLoading } = useAuth();
  const [rawSessionInfo, setRawSessionInfo] = useState<any>(null);
  const [rawUserInfo, setRawUserInfo] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any[]>([]);

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
          const value = localStorage.getItem(key);
          storageKeys.push({
            key,
            hasValue: !!value,
            valueLength: value?.length || 0,
            preview: value ? value.substring(0, 100) + '...' : null
          });
        }
      }
      setStorageInfo(storageKeys);
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
      
      // 새로고침 후 진단 재실행
      setTimeout(runDiagnostics, 1000);
    } catch (error) {
      console.error('세션 새로고침 오류:', error);
    }
  };

  const testProfileFetch = async () => {
    const userId = user?.id || rawUserInfo?.user?.id;
    if (!userId) {
      console.log('사용자 ID가 없음');
      alert('사용자 ID가 없습니다.');
      return;
    }
    
    console.log('프로필 직접 조회 테스트..., 사용자 ID:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('프로필 조회 결과:', { data, error });
      alert(`프로필 조회 결과: ${error ? '실패 - ' + error.message : '성공 - ' + data.nick_name}`);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      alert('프로필 조회 중 오류 발생: ' + error);
    }
  };

  const clearAllStorage = () => {
    if (confirm('모든 로컬 스토리지를 삭제하시겠습니까?')) {
      localStorage.clear();
      alert('로컬 스토리지가 삭제되었습니다. 페이지를 새로고침하세요.');
    }
  };

  useEffect(() => {
    // 페이지 로드 시 자동으로 진단 실행
    const timer = setTimeout(runDiagnostics, 500);
    return () => clearTimeout(timer);
  }, []);

  // 실시간 상태 변화 모니터링
  useEffect(() => {
    console.log('AuthProvider 상태 변화:', {
      hasUser: !!user,
      hasProfile: !!profile,
      hasSession: !!session,
      isLoading,
      timestamp: new Date().toISOString()
    });
  }, [user, profile, session, isLoading]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 인증 상태 진단 도구</h1>
      
      <div className="space-y-2 mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={runDiagnostics}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🔄 진단 실행
          </button>
          <button 
            onClick={forceRefresh}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            🔁 세션 새로고침
          </button>
          <button 
            onClick={testProfileFetch}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            👤 프로필 직접 조회
          </button>
          <button 
            onClick={clearAllStorage}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            🗑️ 스토리지 삭제
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          💡 브라우저 개발자 도구 콘솔을 열어서 상세 로그를 확인하세요.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AuthProvider 상태 */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <h3 className="font-bold mb-2 text-blue-800">📋 AuthProvider 상태</h3>
          <div className="text-xs bg-white p-2 rounded border overflow-auto">
            <pre>
              {JSON.stringify({
                hasUser: !!user,
                hasProfile: !!profile,
                hasSession: !!session,
                isLoading,
                userId: user?.id,
                userEmail: user?.email,
                profileId: profile?.id,
                profileNickname: profile?.nick_name,
                profileRole: profile?.role,
                sessionAccessToken: session?.access_token ? '✅ 있음' : '❌ 없음',
                sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : '없음'
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* 직접 세션 확인 */}
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-bold mb-2 text-green-800">🔑 직접 세션 확인</h3>
          <div className="text-xs bg-white p-2 rounded border overflow-auto">
            <pre>
              {JSON.stringify({
                hasSession: !!rawSessionInfo?.session,
                userId: rawSessionInfo?.session?.user?.id,
                userEmail: rawSessionInfo?.session?.user?.email,
                accessToken: rawSessionInfo?.session?.access_token ? '✅ 있음' : '❌ 없음',
                expiresAt: rawSessionInfo?.session?.expires_at ? 
                  new Date(rawSessionInfo.session.expires_at * 1000).toLocaleString() : '없음',
                error: rawSessionInfo?.error?.message || '없음'
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* 직접 사용자 확인 */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-bold mb-2 text-yellow-800">👤 직접 사용자 확인</h3>
          <div className="text-xs bg-white p-2 rounded border overflow-auto">
            <pre>
              {JSON.stringify({
                hasUser: !!rawUserInfo?.user,
                userId: rawUserInfo?.user?.id,
                email: rawUserInfo?.user?.email,
                provider: rawUserInfo?.user?.app_metadata?.provider,
                lastSignIn: rawUserInfo?.user?.last_sign_in_at ? 
                  new Date(rawUserInfo.user.last_sign_in_at).toLocaleString() : '없음',
                error: rawUserInfo?.error?.message || '없음'
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* 연결 테스트 */}
        <div className="bg-purple-50 border border-purple-200 p-4 rounded">
          <h3 className="font-bold mb-2 text-purple-800">🌐 Supabase 연결 테스트</h3>
          <div className="text-xs bg-white p-2 rounded border overflow-auto">
            <pre>
              {JSON.stringify({
                connected: connectionTest?.connected ? '✅ 연결됨' : '❌ 연결 실패',
                error: connectionTest?.error?.message || '없음',
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* 로컬 스토리지 정보 */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded lg:col-span-2">
          <h3 className="font-bold mb-2 text-gray-800">💾 로컬 스토리지 상태</h3>
          <div className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {storageInfo.length > 0 ? (
              <pre>{JSON.stringify(storageInfo, null, 2)}</pre>
            ) : (
              <p className="text-gray-500">Supabase 관련 로컬 스토리지 항목이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 권장 조치 */}
      <div className="mt-6 bg-orange-50 border border-orange-200 p-4 rounded">
        <h3 className="font-bold mb-2 text-orange-800">🔧 문제 해결 권장 조치</h3>
        <ul className="text-sm space-y-1 text-orange-700">
          <li>1. AuthProvider 상태가 모두 null이고 isLoading이 true라면 → 세션 새로고침 버튼 클릭</li>
          <li>2. 직접 세션/사용자 확인에서 정보가 있는데 AuthProvider에서 null이라면 → AuthProvider 코드 문제</li>
          <li>3. 연결 테스트가 실패한다면 → 환경 변수나 네트워크 문제 확인</li>
          <li>4. 로컬 스토리지에 세션 정보가 없다면 → 다시 로그인 필요</li>
          <li>5. 모든 방법이 실패한다면 → 스토리지 삭제 후 다시 로그인</li>
        </ul>
      </div>
    </div>
  );
}