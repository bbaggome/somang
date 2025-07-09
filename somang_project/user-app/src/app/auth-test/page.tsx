// src/app/auth-test/page.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthTestPage() {
  const { user, profile, session, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToMain = () => {
    router.push('/');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">인증 상태 테스트</h1>
      
      <div className="space-y-4 mb-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">현재 상태</h2>
          <p><strong>로딩 중:</strong> {isLoading ? 'YES' : 'NO'}</p>
          <p><strong>사용자:</strong> {user ? `${user.email} (${user.id})` : 'NO'}</p>
          <p><strong>프로필:</strong> {profile ? `${profile.nick_name} (${profile.role})` : 'NO'}</p>
          <p><strong>세션:</strong> {session ? 'YES' : 'NO'}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-bold mb-2">예상 동작</h2>
          {!isLoading && user && profile && (
            <p className="text-green-600">✅ 로그인 완료 - 메인 페이지 접근 가능</p>
          )}
          {!isLoading && !user && (
            <p className="text-red-600">❌ 로그인 필요 - 로그인 페이지로 이동 필요</p>
          )}
          {!isLoading && user && !profile && (
            <p className="text-yellow-600">⏳ 프로필 생성 중...</p>
          )}
          {isLoading && (
            <p className="text-blue-600">🔄 인증 상태 확인 중...</p>
          )}
        </div>
      </div>

      <div className="space-x-4">
        <button 
          onClick={handleGoToMain}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          메인 페이지로
        </button>
        <button 
          onClick={handleGoToLogin}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          로그인 페이지로
        </button>
        <button 
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          로그아웃
        </button>
      </div>

      <div className="mt-8 bg-gray-50 p-4 rounded">
        <h2 className="font-bold mb-2">상세 정보</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({ 
            user: user ? { id: user.id, email: user.email } : null,
            profile,
            session: session ? { expires_at: session.expires_at } : null,
            isLoading 
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}