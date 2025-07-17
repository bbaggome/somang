// /biz-app/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface QuoteRequest {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'open' | 'closed' | 'expired';
  product_type: string;
  request_details: {
    purchaseTarget: string;
    age: string;
    currentCarrier: string;
    changeType: string;
    newCarrier?: string;
    dataUsage: string;
    deviceId: string;
    color: string;
    locations: string[];
  };
  user_profiles: {
    name: string;
    phone_number?: string;
  } | null;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: string;
  };
}

interface UserProfile {
  id: string;
  role: 'user' | 'owner' | 'admin';
  name: string;
  created_at: string;
  deleted_at?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      console.log('=== BIZ-APP 대시보드 인증 확인 ===');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('인증 오류:', error);
        throw error;
      }
      
      if (!user) {
        console.log('사용자 없음 - 로그인 페이지로 이동');
        router.push('/');
        return;
      }

      console.log('사용자 확인됨:', user.email);
      console.log('사용자 메타데이터:', user.user_metadata);
      setUser(user as User);

      // 프로필 확인 및 권한 검증
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, name, created_at, deleted_at')
        .eq('id', user.id)
        .is('deleted_at', null)
        .single();

      if (profileError) {
        console.error('프로필 조회 오류:', profileError);
        if (profileError.code === 'PGRST116') {
          setError('파트너 프로필이 존재하지 않습니다. 회원가입을 다시 진행해주세요.');
        } else {
          setError('사용자 프로필을 찾을 수 없습니다.');
        }
        return;
      }

      console.log('프로필 확인됨:', profile);

      // owner 권한 확인
      if (profile.role !== 'owner') {
        console.error('권한 없음:', profile.role);
        setError('대시보드 접근 권한이 없습니다. 파트너 계정으로 로그인해주세요.');
        return;
      }

      console.log('권한 확인 완료 - owner 권한');
      setUserProfile(profile);
      
      // 프로필 설정 후 견적 요청 로드
      await loadQuoteRequestsWithProfile(profile);
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      setError('인증 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로필 파라미터를 받는 버전
  const loadQuoteRequestsWithProfile = async (profile: UserProfile) => {
    try {
      console.log('견적 요청 로드 시작 (프로필 포함)');
      
      // 전달받은 profile로 권한 확인
      if (!profile || profile.role !== 'owner') {
        console.log('권한 없음 - 견적 요청 로드 중단');
        setError('견적 요청을 볼 권한이 없습니다.');
        return;
      }
      
      console.log('프로필 권한 확인됨:', profile.role);
      
      // 먼저 quote_requests만 로드
      const { data: quotesData, error: quotesError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('product_type', 'mobile_phone')
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('견적 요청 로드 오류:', quotesError);
        
        // 구체적인 오류 메시지 제공
        if (quotesError.code === '42501') {
          setError('데이터베이스 접근 권한이 없습니다. 관리자에게 문의하세요.');
        } else if (quotesError.code === 'PGRST301') {
          setError('RLS 정책으로 인해 데이터에 접근할 수 없습니다.');
        } else {
          setError(`견적 요청 로드 실패: ${quotesError.message}`);
        }
        return;
      }
      
      console.log('견적 요청 기본 데이터 로드 완료:', quotesData?.length || 0, '건');
      
      if (!quotesData || quotesData.length === 0) {
        setQuoteRequests([]);
        return;
      }
      
      // 사용자 프로필 정보 별도 로드 (profiles 테이블로 수정)
      const userIds = [...new Set(quotesData.map(quote => quote.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone_number')
        .in('id', userIds);
      
      if (profilesError) {
        console.warn('프로필 로드 오류:', profilesError);
        // 프로필 로드 실패해도 견적 요청은 표시 (프로필 없이)
      }
      
      console.log('프로필 데이터 로드 완료:', profilesData?.length || 0, '건');
      
      // 데이터 결합
      const transformedData = quotesData.map(quote => {
        const userProfile = profilesData?.find(profile => profile.id === quote.user_id);
        return {
          ...quote,
          user_profiles: userProfile ? {
            name: userProfile.name,
            phone_number: userProfile.phone_number
          } : { name: '고객', phone_number: null }
        };
      }) as QuoteRequest[];
      
      setQuoteRequests(transformedData);
      console.log('최종 변환된 데이터:', transformedData.length, '건');
      
    } catch (error: any) {
      console.error('견적 요청 로드 중 예외 발생:', error);
      setError(`견적 요청 로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 기존 함수는 상태 기반으로 작동
  const loadQuoteRequests = async () => {
    if (userProfile) {
      await loadQuoteRequestsWithProfile(userProfile);
    } else {
      console.log('userProfile이 없어서 견적 요청 로드를 건너뜁니다.');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('로그아웃 시작');
      
      // 로그아웃 전 상태 정리
      setUser(null);
      setUserProfile(null);
      setQuoteRequests([]);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('로그아웃 오류:', error);
      }
      
      // biz-app 전용 로컬 스토리지 정리
      localStorage.removeItem('sb-biz-token-auth-token');
      sessionStorage.clear();
      
      console.log('로그아웃 완료');
      router.push('/');
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      router.push('/');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', text: '진행중' },
      closed: { color: 'bg-gray-100 text-gray-800', text: '완료' },
      expired: { color: 'bg-red-100 text-red-800', text: '만료' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getCarrierText = (carrier: string) => {
    const carrierMap: { [key: string]: string } = {
      'skt': 'SKT',
      'kt': 'KT',
      'lgu': 'LGU+',
      'mvno': '알뜰폰'
    };
    return carrierMap[carrier] || carrier;
  };

  const getChangeTypeText = (changeType: string) => {
    const changeMap: { [key: string]: string } = {
      'port': '번호이동',
      'device_only': '기기변경',
      'new': '신규가입'
    };
    return changeMap[changeType] || changeType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">접근 권한 오류</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인 페이지로 이동
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 정상 대시보드
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">T-BRIDGE Partners</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  안녕하세요, {userProfile?.name || user?.user_metadata?.name || '파트너'}님
                </p>
                <p className="text-xs text-gray-400">
                  {userProfile?.role || 'owner'} 계정
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">견적 요청 관리</h2>
              <p className="text-gray-600">고객들의 휴대폰 견적 요청을 확인하고 응답하세요.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => router.push('/quote/manage')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                보낸 견적 관리
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 요청</p>
                <p className="text-2xl font-semibold text-gray-900">{quoteRequests.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">진행중</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quoteRequests.filter(req => req.status === 'open').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">완료</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quoteRequests.filter(req => req.status === 'closed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 견적 요청 리스트 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">최근 견적 요청</h3>
          </div>
          
          {quoteRequests.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">견적 요청이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">아직 고객들의 견적 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="divide-y divide-gray-200">
                {quoteRequests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {request.user_profiles?.name || '고객'}님의 견적 요청
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">현재 통신사:</span>
                        <p className="font-medium text-gray-900">
                          {getCarrierText(request.request_details.currentCarrier)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">변경 유형:</span>
                        <p className="font-medium text-gray-900">
                          {getChangeTypeText(request.request_details.changeType)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">희망 지역:</span>
                        <p className="font-medium text-gray-900">
                          {request.request_details.locations.join(', ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">데이터 사용량:</span>
                        <p className="font-medium text-gray-900">
                          {request.request_details.dataUsage}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      <button 
                        onClick={() => router.push(`/quote/send/${request.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        견적 보내기
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        상세보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}