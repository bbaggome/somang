// /user-app/src/app/quote/requests/[requestId]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
}

interface Quote {
  id: string;
  created_at: string;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected';
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
  stores?: {
    name: string;
    phone_number: string;
    base_address: string;
  };
}

export default function QuoteRequestDetailPage() {
  const { user, isLoading: authLoading, isInitializing } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  // 중복 요청 방지
  const loadingData = useRef(false);
  const mounted = useRef(true);

  // 견적 요청 상세 정보 로드 (Database Function 사용)
  const loadQuoteRequestDetail = useCallback(async () => {
    if (!user || !requestId || loadingData.current) return;

    try {
      loadingData.current = true;
      setLoading(true);
      setError(null);

      console.log('견적 요청 상세 정보 로드 시작 (함수 사용):', requestId);

      // 견적 요청 정보 로드
      const { data: requestData, error: requestError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', user.id)
        .single();

      if (requestError) {
        console.error('견적 요청 로드 실패:', requestError);
        throw requestError;
      }

      // 디바이스 정보 로드
      let deviceData = null;
      if (requestData.request_details?.deviceId) {
        const { data: device } = await supabase
          .from('devices')
          .select('device_name, storage_options')
          .eq('id', requestData.request_details.deviceId)
          .single();
        deviceData = device;
      }

      if (!mounted.current) return;

      setQuoteRequest({
        ...requestData,
        devices: deviceData
      });

      // Database Function을 사용하여 해당 요청의 견적들 조회
      const { data: quotesData, error: quotesError } = await supabase
        .rpc('get_quote_request_details', {
          request_id_param: requestId
        });

      if (quotesError) {
        console.error('견적 로드 실패:', quotesError);
        throw quotesError;
      }

      if (!mounted.current) return;

      console.log('견적 데이터 (함수 결과):', quotesData);

      // 함수 결과를 컴포넌트에서 사용할 형태로 변환
      const transformedQuotes = (quotesData || []).map((quote: any) => ({
        id: quote.quote_id,
        created_at: quote.quote_created_at,
        status: quote.quote_status,
        quote_details: quote.quote_details,
        stores: {
          name: quote.store_name,
          phone_number: quote.store_phone_number,
          base_address: quote.store_base_address
        }
      }));

      setQuotes(transformedQuotes);

      // 견적을 확인했다는 표시로 상태 업데이트 (viewed로 변경)
      const viewedQuotes = transformedQuotes.filter((q: any) => q.status === 'sent');
      if (viewedQuotes.length > 0) {
        await Promise.all(
          viewedQuotes.map((quote: any) => 
            supabase
              .from('quotes')
              .update({ status: 'viewed' })
              .eq('id', quote.id)
          )
        );

        // 로컬 상태 업데이트
        setQuotes(prevQuotes => 
          prevQuotes.map(quote => 
            quote.status === 'sent' 
              ? { ...quote, status: 'viewed' }
              : quote
          )
        );
      }

      console.log('견적 요청 상세 정보 로드 완료');

    } catch (error: any) {
      console.error('데이터 로드 실패:', error);
      if (mounted.current) {
        setError('견적 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      loadingData.current = false;
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [user, requestId]);

  // 견적 상태 업데이트 함수
  const handleQuoteAction = async (quoteId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: action })
        .eq('id', quoteId);

      if (error) throw error;

      // 상태 업데이트
      setQuotes(quotes.map(quote => 
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

  // 사용자 상태가 확정되면 데이터 로드
  useEffect(() => {
    mounted.current = true;
    
    // 초기화 완료 + 인증 로딩 완료 + 사용자 있음 조건에서만 실행
    if (!isInitializing && !authLoading && user && requestId) {
      console.log('견적 상세 정보 로드 조건 충족');
      loadQuoteRequestDetail();
    }

    return () => {
      mounted.current = false;
    };
  }, [user, authLoading, isInitializing, requestId, loadQuoteRequestDetail]);

  // 유틸리티 함수들
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', text: '새 견적' },
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
            <p className="text-gray-600">견적 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quoteRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl flex items-center justify-center">
          <div className="text-center p-6">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error || '견적 요청을 찾을 수 없습니다.'}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  loadQuoteRequestDetail();
                }}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => router.back()}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                돌아가기
              </button>
            </div>
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
          <h1 className="text-lg font-bold text-gray-800">받은 견적</h1>
        </header>

        {/* 요청 정보 */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {quoteRequest.devices?.device_name} {quoteRequest.devices?.storage_options?.[0]}GB
              </h2>
              <p className="text-sm text-gray-500">{formatDate(quoteRequest.created_at)} 요청</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">색상:</span>
              <p className="font-medium">{quoteRequest.request_details.color === 'any' ? '색상무관' : quoteRequest.request_details.color}</p>
            </div>
            <div>
              <span className="text-gray-500">희망 지역:</span>
              <p className="font-medium">{quoteRequest.request_details.locations.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">받은 견적 ({quotes.length}건)</h3>
              {quotes.length > 0 && (
                <p className="text-sm text-gray-500">최저가부터 정렬</p>
              )}
            </div>

            {quotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 받은 견적이 없습니다</h3>
                <p className="text-gray-500">매장에서 견적을 보내주면 여기에 표시됩니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes
                  .sort((a, b) => a.quote_details.tco_24months - b.quote_details.tco_24months)
                  .map((quote, index) => (
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
                          {index === 0 && quote.status !== 'rejected' && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                              최저가
                            </span>
                          )}
                          {getStatusBadge(quote.status)}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(quote.created_at)}</p>
                      </div>

                      {/* 매장 정보 */}
                      <div className="mb-3">
                        <h4 className="font-bold text-gray-900">{quote.stores?.name || '매장'}</h4>
                        <p className="text-sm text-gray-600">{quote.stores?.base_address}</p>
                        <p className="text-sm text-gray-600">{quote.stores?.phone_number}</p>
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">개통 방법:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {getInstallationMethodText(quote.quote_details.installation_method)}
                        </span>
                      </div>

                      {/* 특별 혜택 미리보기 */}
                      {quote.quote_details.special_benefits.length > 0 && (
                        <div className="mt-2">
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
                        <div className="mt-3 pt-3 border-t border-gray-200">
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
                        <div className="mt-3 pt-3 border-t border-gray-200">
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
        </main>
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
            
            {/* 매장 정보 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{selectedQuote.stores?.name || '매장'}</h3>
              <p className="text-gray-600">{selectedQuote.stores?.base_address}</p>
              <p className="text-gray-600">{selectedQuote.stores?.phone_number}</p>
              <div className="mt-2">
                {getStatusBadge(selectedQuote.status)}
              </div>
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