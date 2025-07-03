'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function MainPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 끝나고, 유저 정보가 없으면 로그인 페이지로 리디렉션
    if (!isLoading && !user) {
      router.push('/login'); // 로그인 페이지로 리디렉션
    }
  }, [user, isLoading, router]);

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
      <h1 className='text-3xl font-bold'>
        {user.email} 로그인 성공! 메인 페이지입니다 !
      </h1>
      <p className='mt-4'>사용자 이메일: {user.email}</p>
    </div>
  );
}
