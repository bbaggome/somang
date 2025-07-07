'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// client.ts에서 supabase 객체를 직접 import 합니다.
import { supabase } from '@/lib/supabase/client';

// 아이콘 SVG 컴포넌트들
const MailIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);
const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
);

export default function BizLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * 이메일/비밀번호를 사용하여 로그인을 처리하는 함수
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Supabase의 이메일/비밀번호 로그인 함수를 호출합니다.
    // createClient() 호출 없이 import한 supabase 객체를 바로 사용합니다.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 로그인 실패 시 에러 메시지를 설정합니다.
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      console.error('Login Error:', error.message);
    } else {
      // 로그인 성공 시, 파트너용 대시보드 페이지로 이동합니다.
      router.push('/dashboard');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* 왼쪽: 브랜딩 및 홍보 섹션 */}
      <div className="w-full md:w-1/2 bg-blue-600 flex flex-col justify-center items-center p-8 md:p-12 text-white">
        <div className="max-w-md text-center md:text-left">
          <h1 className="text-2xl font-black mb-4">T-BRIDGE Partners</h1>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            검증된 고객과<br />가장 빠르게 만나보세요.
          </h2>
          <p className="text-lg text-blue-100">
            T-Bridge는 수많은 잠재 고객과 판매점 파트너를 연결하여 새로운 비즈니스 기회를 창출합니다. 지금 바로 파트너가 되어 성장을 경험하세요.
          </p>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 섹션 */}
      <div className="w-full md:w-1/2 flex flex-grow items-start md:items-center justify-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <h3 className="text-3xl font-bold text-gray-800 mb-2">파트너 로그인</h3>
          <p className="text-gray-500 mb-8">사업자 회원으로 로그인해주세요.</p>
          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><MailIcon /></span>
                <input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-4 mt-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70">
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="text-center mt-8">
            <p className="text-gray-600">
              아직 파트너가 아니신가요?
              <Link href="/signup" className="font-bold text-blue-600 hover:underline ml-2">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
