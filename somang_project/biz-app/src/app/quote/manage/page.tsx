// /biz-app/src/app/quote/manage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface Quote {
  id: string;
  request_id: string;
  store_id: string;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected';
  created_at: string;
  quote_details: {
    device_price: number;
    monthly_fee: number;
    activation_fee: number;
    device_discount: number;
    plan_discount: number;
    additional_discount: number;
    tco_24months: number;
    special_benefits: string[];
    contract_period: number;
    installation_method: 'visit' | 'delivery' | 'pickup';
    delivery_fee: number;
    store_memo: string;
  };
  quote_requests?: {
    id: string;
    created_at: string;
    request_details: {
      deviceId: string;
      locations: string[];
    };
    profiles?: {
      name: string;
      phone_number?: string;
    };
  };
  devices?: {
    device_name: string;
    storage_options: number[];
  };
}

interface Store {
  id: string;
  name: string;
}

export default function QuoteManagePage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      // 현재 사용자의 매장 정보 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // 매장 정보 로드
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();

      if (storeError) {
        console.error('매장 정보 로드 실패:', storeError);
        setError('매장 정보를 찾을 수 없습니다.');
        return;
      }

      setStore(storeData);

      // 견적 목록 로드 (기본 정보만)
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('견적 로드 실패:', quotesError);
        setError('견적 목록을 불러올 수 없습니다.');
        return;
      }

      console.log('견적 데이터:', quotesData);

      // 각 견적에 대한 추가 정보 로드
      const enrichedQuotes = await Promise.all(
        (quotesData || []).map(async (quote) => {
          try {
            // 견적 요청 정보 로드
            const { data: requestData } = await supabase
              .from('quote_requests')
              .select('id, created_at, request_details, user_id')
              .eq('id', quote.request_id)
              .single();

            let profileData = null;
            let deviceData = null;

            // 프로필 정보 로드
            if (requestData?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('name, phone_number')
                .eq('id', requestData.user_id)
                .single();
              profileData = profile;
            }

            // 디바이스 정보 로드
            if (requestData?.request_details?.deviceId) {
              const { data: device } = await supabase
                .from('devices')
                .select('device_name, storage_options')
                .eq('id', requestData.request_details.deviceId)
                .single();
              deviceData = device;
            }

            return {
              ...quote,
              quote_requests: requestData ? {
                ...requestData,
                profiles: profileData
              } : null,
              devices: deviceData
            };
          } catch (error) {
            console.error('견적 상세 정보 로드 실패:', error);
            return quote;
          }
        })
      );

      setQuotes(enrichedQuotes);

    } catch (error: any) {
      console.error('견적 로드 실패:', error);
      setError('견적 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', text: '전송됨' },
      viewed: { color: 'bg-yellow-100 text-yellow-800', text: '확인됨' },
      accepted: { color: 'bg-green-100 text-green-800', text: '수락됨' },
      rejected: { color: 'bg-red-100 text-red-800', text: '거절됨' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getInstallationMethodText = (method: string) => {
    const methodMap = {
      visit: '매장 방문',
      delivery: '택배 발송',
      pickup: '퀵 배송'
    };
    return methodMap[method as keyof typeof methodMap] || method;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredQuotes = selectedStatus === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.status === selectedStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">견적 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md hover:bg-gray-100"
                aria-label="뒤로가기"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">견적 관리</h1>
            </div>
            <span className="text-sm text-gray-500">
              {store?.name || '매장'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 및 통계 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">보낸 견적 목록</h2>
            
            {/* 상태 필터 */}
            <div className="flex space-x-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="견적 상태 필터"
              >
                <option value="all">전체</option>
                <option value="sent">전송됨</option>
                <option value="viewed">확인됨</option>
                <option value="accepted">수락됨</option>
                <option value="rejected">거절됨</option>
              </select>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">총 견적</p>
              <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">전송됨</p>
              <p className="text-2xl font-bold text-blue-600">
                {quotes.filter(q => q.status === 'sent').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">수락됨</p>
              <p className="text-2xl font-bold text-green-600">
                {quotes.filter(q => q.status === 'accepted').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">거절됨</p>
              <p className="text-2xl font-bold text-red-600">
                {quotes.filter(q => q.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        {/* 견적 목록 */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">견적이 없습니다</h3>
            <p className="text-gray-500">
              {selectedStatus === 'all' ? '아직 보낸 견적이 없습니다.' : '해당 상태의 견적이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-lg shadow p-6">
                {/* 견적 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {quote.quote_requests?.profiles?.name || '고객'}님의 견적
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(quote.created_at)} 전송
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(quote.status)}
                    <button
                      onClick={() => router.push(`/quote/edit/${quote.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      수정
                    </button>
                  </div>
                </div>

                {/* 기기 정보 */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">요청 기기</h4>
                  <p className="text-sm text-gray-600">
                    {quote.devices?.device_name} {quote.devices?.storage_options?.[0]}GB
                  </p>
                  <p className="text-sm text-gray-500">
                    희망 지역: {quote.quote_requests?.request_details?.locations?.join(', ') || '정보 없음'}
                  </p>
                </div>

                {/* 견적 상세 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">기기 가격</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(quote.quote_details.device_price)}원
                    </p>
                    {quote.quote_details.device_discount > 0 && (
                      <p className="text-sm text-green-600">
                        -{formatCurrency(quote.quote_details.device_discount)}원 할인
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">월 이용료</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(quote.quote_details.monthly_fee)}원/월
                    </p>
                    {quote.quote_details.plan_discount > 0 && (
                      <p className="text-sm text-green-600">
                        -{formatCurrency(quote.quote_details.plan_discount)}원/월 할인
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">개통 방법</p>
                    <p className="font-medium text-gray-900">
                      {getInstallationMethodText(quote.quote_details.installation_method)}
                    </p>
                    {quote.quote_details.delivery_fee > 0 && (
                      <p className="text-sm text-gray-600">
                        배송비: {formatCurrency(quote.quote_details.delivery_fee)}원
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">총 비용 ({quote.quote_details.contract_period}개월)</p>
                    <p className="font-bold text-lg text-blue-600">
                      {formatCurrency(quote.quote_details.tco_24months)}원
                    </p>
                  </div>
                </div>

                {/* 특별 혜택 */}
                {quote.quote_details.special_benefits && quote.quote_details.special_benefits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">특별 혜택</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.quote_details.special_benefits.map((benefit, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 매장 메모 */}
                {quote.quote_details.store_memo && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">매장 메모</p>
                    <p className="text-sm text-gray-700">{quote.quote_details.store_memo}</p>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => router.push(`/quote/edit/${quote.id}`)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    견적 수정
                  </button>
                  <button
                    onClick={() => window.open(`/quote/view/${quote.id}`, '_blank')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    미리보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}