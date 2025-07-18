// /user-app/src/app/quote/requests/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

interface QuoteRequest {
  id: string;
  created_at: string;
  status: 'open' | 'closed' | 'expired';
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
  devices?: {
    device_name: string;
    storage_options: number[];
  };
  quotes_count?: number;
}

interface Quote {
  id: string;
  created_at: string;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected';
  request_id: string;
  quote_details: {
    device_price: number;
    monthly_fee: number;
    tco_24months: number;
    special_benefits: string[];
    installation_method: string;
    store_memo: string;
    contract_period: number;
    device_discount: number;
    plan_discount: number;
    additional_discount: number;
    activation_fee: number;
    delivery_fee: number;
  };
  stores?: {
    name: string;
    phone_number: string;
    base_address: string;
  };
  quote_requests?: {
    request_details: {
      deviceId: string;
    };
  };
  devices?: {
    device_name: string;
    storage_options: number[];
  };
}

export default function QuoteRequestsPage() {
  const { user, isLoading: authLoading, isInitializing } = useAuth();
  const router = useRouter();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'requests' | 'quotes'>('requests');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  // 중복 요청 방지
  const loadingQuotes = useRef(false);
  const loadingAllQuotes = useRef(false);
  const mounted = useRef(true);

  // 견적 요청 로드 함수
  const loadQuoteRequests = useCallback(async () => {
    if (!user || loadingQuotes.current) return;

    try {
      loadingQuotes.current = true;
      setLoading(true);
      setError(null);

      console.log('견적 요청 목록 로드 시작');

      // 사용자의 견적 요청 목록 로드
      const { data: requestsData, error: requestsError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_type', 'mobile_phone')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('견적 요청 로드 실패:', requestsError);
        throw requestsError;
      }

      console.log('견적 요청 데이터:', requestsData);

      // 컴포넌트가 여전히 마운트되어 있는지 확인
      if (!mounted.current) return;

      // 각 요청에 대한 추가 정보 로드
      const enrichedRequests = await Promise.all(
        (requestsData || []).map(async (request) => {
          try {
            // 디바이스 정보 로드
            let deviceData = null;
            if (request.request_details?.deviceId) {
              const { data: device } = await supabase
                .from('devices')
                .select('device_name, storage_options')
                .eq('id', request.request_details.deviceId)
                .single();
              deviceData = device;
            }

            // 해당 요청에 대한 견적 수 조회
            const { count } = await supabase
              .from('quotes')
              .select('*', { count: 'exact', head: true })
              .eq('request_id', request.id);

            return {
              ...request,
              devices: deviceData,
              quotes_count: count || 0
            };
          } catch (error) {
            console.error('견적 요청 상세 정보 로드 실패:', error);
            return {
              ...request,
              devices: null,
              quotes_count: 0
            };
          }
        })
      );

      if (mounted.current) {
        setQuoteRequests(enrichedRequests);
        console.log('견적 요청 목록 로드 완료');
      }

    } catch (error: any) {
      console.error('견적 요청 목록 로드 실패:', error);
      if (mounted.current) {
        setError('견적 요청 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      loadingQuotes.current = false;
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // 모든 견적 로드 함수 (Database Function 사용)
  const loadAllQuotes = useCallback(async () => {
    if (!user || loadingAllQuotes.current) return;

    try {
      loadingAllQuotes.current = true;
      setQuotesLoading(true);
      setError(null);

      console.log('모든 견적 로드 시작 (함수 사용)');

      // Database Function을 사용하여 사용자의 모든 견적 조회
      const { data: quotesData, error: quotesError } = await supabase
        .rpc('get_user_quotes', {
          user_id_param: user.id
        });

      if (quotesError) {
        console.error('견적 로드 실패:', quotesError);
        throw quotesError;
      }

      if (!mounted.current) return;

      console.log('견적 데이터 (함수 결과):', quotesData);

      // 함수 결과를 컴포넌트에서 사용할 형태로 변환
      const transformedQuotes = await Promise.all(
        (quotesData || []).map(async (quote: any) => {
          try {
            // 디바이스 정보 로드
            let deviceData = null;
            if (quote.request_details?.deviceId) {
              const { data: device } = await supabase
                .from('devices')
                .select('device_name, storage_options')
                .eq('id', quote.request_details.deviceId)
                .single();
              deviceData = device;
            }

            return {
              id: quote.quote_id,
              created_at: quote.quote_created_at,
              status: quote.quote_status,
              request_id: quote.request_id,
              quote_details: quote.quote_details,
              stores: {
                name: quote.store_name,
                phone_number: quote.store_phone_number,
                base_address: quote.store_base_address
              },
              quote_requests: {
                request_details: quote.request_details
              },
              devices: deviceData
            };
          } catch (error) {
            console.error('견적 데이터 변환 실패:', error);
            return {
              id: quote.quote_id,
              created_at: quote.quote_created_at,
              status: quote.quote_status,
              request_id: quote.request_id,
              quote_details: quote.quote_details,
              stores: {
                name: quote.store_name,
                phone_number: quote.store_phone_number,
                base_address: quote.store_base_address
              },
              quote_requests: {
                request_details: quote.request_details
              },
              devices: null
            };
          }
        })
      );

      if (mounted.current) {
        setAllQuotes(transformedQuotes);
        console.log('모든 견적 로드 완료:', transformedQuotes.length, '건');
      }

    } catch (error: any) {
      console.error('모든 견적 로드 실패:', error);
      if (mounted.current) {
        setError('견적을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      loadingAllQuotes.current = false;
      if (mounted.current) {
        setQuotesLoading(false);
      }
    }
  }, [user]);

  // 견적 상태 업데이트 함수
  const handleQuoteAction = async (quoteId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: action })
        .eq('id', quoteId);

      if (error) throw error;

      // 상태 업데이트
      setAllQuotes(quotes => quotes.map(quote => 
        quote.id === quoteId 
          ? { ...quote, status: action }
          : quote
      ));

      setShowQuoteModal(false);
      setSelectedQuote(null);

      const actionText = action === 'accepted' ? '수락' : '거절';
      alert(`견적을 ${actionText}했습니다.`);

    } catch (error: any) {
      console.error('견적 상태 업데이트 실패:', error);
      alert('견적 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 탭 변경 시 데이터 로드
  const handleTabChange = (tab: 'requests' | 'quotes') => {
    setSelectedTab(tab);
    if (tab === 'quotes' && allQuotes.length === 0) {
      loadAllQuotes();
    }
  };

  // 사용자 상태가 확정되면 데이터 로드
  useEffect(() => {
    mounted.current = true;
    
    // 초기화 완료 + 인증 로딩 완료 + 사용자 있음 조건에서만 실행
    if (!isInitializing && !authLoading && user) {
      console.log('견적 요청 목록 로드 조건 충족');
      loadQuoteRequests();
    }

    return () => {
      mounted.current = false;
    };
  }, [user, authLoading, isInitializing, loadQuoteRequests]);

  // 유틸리티 함수들
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', text: '진행중' },
      closed: { color: 'bg-gray-100 text-gray-800', text: '완료' },
      expired: { color: 'bg-red-100 text-red-800', text: '만료' },
      sent: { color: 'bg-blue-100 text-blue-800', text: '새 견적' },
      viewed: { color: 'bg-yellow-100 text-yellow-800', text: '확인됨' },
      accepted: { color: 'bg-green-100 text-green-800', text: '수락됨' },
      rejected: { color: 'bg-red-100 text-red-800', text: '거절됨' }
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

  // 로그인 필요 상태
  if (!isInitializing && !authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 초기화 중이거나 인증 로딩 중
  if (isInitializing || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isInitializing ? '초기화 중...' : '로그인 확인 중...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">견적 요청 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <header className="p-4 flex items-center justify-center relative flex-shrink-0 border-b border-gray-100">
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2" 
            aria-label="뒤로가기" 
            onClick={() => router.back()}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">나의 견적 요청</h1>
        </header>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('requests')}
            className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
              selectedTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            견적 요청 목록
          </button>
          <button
            onClick={() => handleTabChange('quotes')}
            className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
              selectedTab === 'quotes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            전체 견적 {/*({allQuotes.length})*/}
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 m-4">
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  if (selectedTab === 'requests') {
                    loadQuoteRequests();
                  } else {
                    loadAllQuotes();
                  }
                }}
                className="mt-2 text-red-600 underline text-sm"
              >
                다시 시도
              </button>
            </div>
          )}

          {selectedTab === 'requests' && (
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-2">견적 요청 목록</h2>
                <p className="text-sm text-gray-500">요청하신 견적의 진행 상황을 확인하세요.</p>
              </div>

              {quoteRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">견적 요청이 없습니다</h3>
                  <p className="text-gray-500 mb-6">아직 요청하신 견적이 없습니다.</p>
                  <button
                    onClick={() => router.push('/quote/mobile/step1')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    견적 요청하기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quoteRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/quote/requests/${request.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(request.created_at)}</p>
                      </div>

                      <div className="mb-3">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {request.devices?.device_name} {request.devices?.storage_options?.[0]}GB
                        </h3>
                        <p className="text-sm text-gray-600">
                          색상: {request.request_details.color === 'any' ? '색상무관' : request.request_details.color}
                        </p>
                        <p className="text-sm text-gray-600">
                          현재 통신사: {getCarrierText(request.request_details.currentCarrier)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">받은 견적:</span>
                          <span className={`text-sm font-medium ${
                            (request.quotes_count || 0) > 0 ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {request.quotes_count || 0}건
                          </span>
                        </div>
                        <div className="flex items-center text-blue-600">
                          <span className="text-sm font-medium">자세히 보기</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'quotes' && (
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-2">받은 견적</h2>
                <p className="text-sm text-gray-500">매장에서 보내준 모든 견적을 확인하세요.</p>
              </div>

              {quotesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">견적을 불러오는 중...</p>
                </div>
              ) : allQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">받은 견적이 없습니다</h3>
                  <p className="text-gray-500 mb-6">아직 매장에서 보내준 견적이 없습니다.</p>
                  <button
                    onClick={() => router.push('/quote/mobile/step1')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    견적 요청하기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allQuotes
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((quote) => (
                      <div 
                        key={quote.id} 
                        className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          quote.status === 'accepted' ? 'border-green-500 bg-green-50' :
                          quote.status === 'rejected' ? 'border-red-200 bg-red-50' :
                          'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedQuote(quote);
                          setShowQuoteModal(true);
                        }}
                      >
                        {/* 견적 헤더 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(quote.status)}
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(quote.created_at)}</p>
                        </div>

                        {/* 디바이스 정보 */}
                        <div className="mb-3">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {quote.devices?.device_name} {quote.devices?.storage_options?.[0]}GB
                          </h3>
                        </div>

                        {/* 매장 정보 */}
                        <div className="mb-3">
                          <h4 className="font-bold text-gray-900">{quote.stores?.name || '매장'}</h4>
                          <p className="text-sm text-gray-600">{quote.stores?.base_address}</p>
                        </div>

                        {/* 가격 정보 */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">기기 가격</p>
                            <p className="font-bold text-gray-900">
                              {formatCurrency(quote.quote_details.device_price)}원
                            </p>
                            {quote.quote_details.device_discount > 0 && (
                              <p className="text-xs text-green-600">
                                -{formatCurrency(quote.quote_details.device_discount)}원 할인
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">월 이용료</p>
                            <p className="font-bold text-gray-900">
                              {formatCurrency(quote.quote_details.monthly_fee)}원/월
                            </p>
                            {quote.quote_details.plan_discount > 0 && (
                              <p className="text-xs text-green-600">
                                -{formatCurrency(quote.quote_details.plan_discount)}원/월 할인
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 총 비용 */}
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">총 비용 ({quote.quote_details.contract_period}개월)</span>
                            <span className="text-lg font-bold text-blue-900">
                              {formatCurrency(quote.quote_details.tco_24months)}원
                            </span>
                          </div>
                        </div>

                        {/* 개통 방법 */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-500">개통 방법:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getInstallationMethodText(quote.quote_details.installation_method)}
                          </span>
                        </div>

                        {/* 특별 혜택 미리보기 */}
                        {quote.quote_details.special_benefits.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {quote.quote_details.special_benefits.slice(0, 3).map((benefit, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {benefit}
                                </span>
                              ))}
                              {quote.quote_details.special_benefits.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{quote.quote_details.special_benefits.length - 3}개
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        {quote.status === 'sent' || quote.status === 'viewed' ? (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuoteAction(quote.id, 'accepted');
                                }}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                              >
                                수락
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuoteAction(quote.id, 'rejected');
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                              >
                                거절
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-sm text-center text-gray-500">
                              {quote.status === 'accepted' ? '이 견적을 수락했습니다' : '이 견적을 거절했습니다'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
          <button
            onClick={() => router.push('/quote/mobile/step1')}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            + 새 견적 요청하기
          </button>
        </footer>
      </div>

      {/* 견적 상세 모달 */}
      {showQuoteModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex justify-center items-end">
          <div 
            className="absolute inset-0 bg-black opacity-60" 
            onClick={() => setShowQuoteModal(false)}
          />
          <div className="relative w-full max-w-[500px] bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            {/* 모달 핸들바 */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            
            {/* 디바이스 정보 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">
                {selectedQuote.devices?.device_name} {selectedQuote.devices?.storage_options?.[0]}GB
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                {getStatusBadge(selectedQuote.status)}
                <span className="text-sm text-gray-500">
                  {formatDate(selectedQuote.created_at)} 접수
                </span>
              </div>
            </div>

            {/* 매장 정보 */}
            <div className="mb-6">
              <h4 className="font-bold mb-2">매장 정보</h4>
              <p className="font-medium">{selectedQuote.stores?.name || '매장'}</p>
              <p className="text-gray-600 text-sm">{selectedQuote.stores?.base_address}</p>
              <p className="text-gray-600 text-sm">{selectedQuote.stores?.phone_number}</p>
            </div>

            {/* 상세 가격 정보 */}
            <div className="mb-6">
              <h4 className="font-bold mb-3">상세 견적</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">기기 가격</span>
                  <span className="font-medium">{formatCurrency(selectedQuote.quote_details.device_price)}원</span>
                </div>
                {selectedQuote.quote_details.device_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>기기 할인</span>
                    <span>-{formatCurrency(selectedQuote.quote_details.device_discount)}원</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">월 이용료</span>
                  <span className="font-medium">{formatCurrency(selectedQuote.quote_details.monthly_fee)}원/월</span>
                </div>
                {selectedQuote.quote_details.plan_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>요금제 할인</span>
                    <span>-{formatCurrency(selectedQuote.quote_details.plan_discount)}원/월</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">개통비</span>
                  <span className="font-medium">{formatCurrency(selectedQuote.quote_details.activation_fee)}원</span>
                </div>
                {selectedQuote.quote_details.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송비</span>
                    <span className="font-medium">{formatCurrency(selectedQuote.quote_details.delivery_fee)}원</span>
                  </div>
                )}
                {selectedQuote.quote_details.additional_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>추가 할인</span>
                    <span>-{formatCurrency(selectedQuote.quote_details.additional_discount)}원</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>총 비용 ({selectedQuote.quote_details.contract_period}개월)</span>
                  <span className="text-blue-600">{formatCurrency(selectedQuote.quote_details.tco_24months)}원</span>
                </div>
              </div>
            </div>

            {/* 개통 방법 */}
            <div className="mb-6">
              <h4 className="font-bold mb-2">개통 방법</h4>
              <p className="text-gray-700">
                {getInstallationMethodText(selectedQuote.quote_details.installation_method)}
              </p>
            </div>

            {/* 특별 혜택 */}
            {selectedQuote.quote_details.special_benefits.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold mb-3">특별 혜택</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedQuote.quote_details.special_benefits.map((benefit, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 매장 메모 */}
            {selectedQuote.quote_details.store_memo && (
              <div className="mb-6">
                <h4 className="font-bold mb-3">매장 메모</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedQuote.quote_details.store_memo}</p>
                </div>
              </div>
            )}

            {/* 모달 액션 버튼 */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
              {(selectedQuote.status === 'sent' || selectedQuote.status === 'viewed') && (
                <>
                  <button
                    onClick={() => handleQuoteAction(selectedQuote.id, 'rejected')}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleQuoteAction(selectedQuote.id, 'accepted')}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    수락
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}