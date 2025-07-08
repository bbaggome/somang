'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function MainPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 끝나고, 유저 정보가 없으면 로그인 페이지로 리디렉션
    if (!isLoading && !user) {
      router.push('/login'); // 로그인 페이지로 리디렉션
    }
  }, [user, isLoading, router]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 로딩 중이거나 리디렉션 중일 때 보여줄 화면
  if (isLoading || !user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Loading...</p>
      </div>
    );
  }

  // 로그인된 사용자에게만 보여줄 실제 메인 페이지 내용
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <div className='absolute top-4 right-4'>
        <button
          onClick={handleLogout}
          className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors'
        >
          로그아웃
        </button>
      </div>

      <h1 className='text-3xl font-bold mb-6'>
        환영합니다, {profile?.nick_name || '사용자'}님!
      </h1>
      <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
        <h2 className='text-xl font-semibold mb-4'>프로필 정보</h2>
        <div className='space-y-2'>
          <p><span className='font-medium'>닉네임:</span> {profile?.nick_name || '정보 없음'}</p>
          <p><span className='font-medium'>이메일:</span> {profile?.email || user.email}</p>
          <p><span className='font-medium'>이름:</span> {profile?.name || '정보 없음'}</p>
          <p><span className='font-medium'>역할:</span> {profile?.role || '정보 없음'}</p>
          <p><span className='font-medium'>가입일:</span> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '정보 없음'}</p>
        </div>
        {profile?.avatar_url && (
          <div className='mt-4 text-center'>
            <img 
              src={profile.avatar_url} 
              alt='프로필 이미지' 
              className='w-20 h-20 rounded-full mx-auto object-cover'
            />
          </div>
        )}
      </div>
    </div>
  );
}