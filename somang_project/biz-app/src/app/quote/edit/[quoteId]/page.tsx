// /biz-app/src/app/quote/edit/[quoteId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface QuoteDetails {
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
}

interface Quote {
  id: string;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected';
  quote_details: QuoteDetails;
  created_at: string;
}

interface QuoteRequest {
  id: string;
  request_details: {
    deviceId: string;
    color: string;
    locations: string[];
  };
  profiles?: {
    name: string;
    phone_number?: string;
  };
}

interface Device {
  device_name: string;
  storage_options: number[];
}

export default function QuoteEditPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.quoteId as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 견적 상세 정보 (수정 가능)
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    device_price: 0,
    monthly_fee: 0,
    activation_fee: 30000,
    device_discount: 0,
    plan_discount: 0,
    additional_discount: 0,
    tco_24months: 0,
    special_benefits: [],
    contract_period: 24,
    installation_method: 'visit',
    delivery_fee: 0,
    store_memo: ''
  });

  useEffect(() => {
    if (quoteId) {
      loadQuoteData();
    }
  }, [quoteId]);

  // TCO 자동 계산
  useEffect(() => {
    calculateTCO();
  }, [
    quoteDetails.device_price,
    quoteDetails.monthly_fee,
    quoteDetails.activation_fee,
    quoteDetails.device_discount,
    quoteDetails.plan_discount,
    quoteDetails.additional_discount,
    quoteDetails.delivery_fee,
    quoteDetails.contract_period
  ]);

  const loadQuoteData = async () => {
    try {
      setLoading(true);
      
      // 견적 정보 로드
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('견적 로드 실패:', quoteError);
        throw quoteError;
      }

      console.log('견적 데이터:', quoteData);
      setQuote(quoteData);
      setQuoteDetails(quoteData.quote_details);

      // 견적 요청 정보 로드
      const { data: requestData, error: requestError } = await supabase
        .from('quote_requests')
        .select('id, request_details, user_id')
        .eq('id', quoteData.request_id)
        .single();

      if (requestError) {
        console.error('견적 요청 로드 실패:', requestError);
        throw requestError;
      }

      // 프로필 정보 로드
      let profileData = null;
      if (requestData.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone_number')
          .eq('id', requestData.user_id)
          .single();
        profileData = profile;
      }

      setQuoteRequest({
        ...requestData,
        profiles: profileData ?? undefined
      });
    // 타입 오류 방지: profiles가 null일 경우 undefined로 처리
    // profiles: { name: any; phone_number: any; } | null 타입 → { name: string; phone_number?: string | undefined; } | undefined 타입으로 변환
    // 이미 위에서 profileData ?? undefined로 처리했으므로 별도 추가 작업 필요 없음
      // 디바이스 정보 로드
      if (requestData.request_details?.deviceId) {
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('device_name, storage_options')
          .eq('id', requestData.request_details.deviceId)
          .single();

        if (deviceError) {
          console.error('디바이스 로드 실패:', deviceError);
        } else {
          setDevice(deviceData);
        }
      }

    } catch (error: any) {
      console.error('데이터 로드 실패:', error);
      setError('견적 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTCO = () => {
    const {
      device_price,
      monthly_fee,
      activation_fee,
      device_discount,
      plan_discount,
      additional_discount,
      delivery_fee,
      contract_period
    } = quoteDetails;

    const totalDeviceCost = Math.max(0, device_price - device_discount);
    const totalPlanCost = (monthly_fee - plan_discount) * contract_period;
    const totalCost = totalDeviceCost + totalPlanCost + activation_fee + delivery_fee - additional_discount;

    setQuoteDetails(prev => ({
      ...prev,
      tco_24months: Math.max(0, totalCost)
    }));
  };

  const handleInputChange = (field: keyof QuoteDetails, value: any) => {
    setQuoteDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBenefitToggle = (benefit: string) => {
    setQuoteDetails(prev => ({
      ...prev,
      special_benefits: prev.special_benefits.includes(benefit)
        ? prev.special_benefits.filter(b => b !== benefit)
        : [...prev.special_benefits, benefit]
    }));
  };

  const handleSubmit = async () => {
    if (!quote) {
      setError('견적 정보가 없습니다.');
      return;
    }

    // 견적이 수락되었거나 거절된 경우 수정 불가
    if (quote.status === 'accepted' || quote.status === 'rejected') {
      setError('수락되었거나 거절된 견적은 수정할 수 없습니다.');
      return;
    }

    // 유효성 검사
    if (quoteDetails.device_price <= 0) {
      setError('기기 가격을 입력해주세요.');
      return;
    }
    if (quoteDetails.monthly_fee <= 0) {
      setError('월 이용료를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          quote_details: quoteDetails,
          status: 'sent' // 수정 후 다시 전송 상태로
        })
        .eq('id', quoteId);

      if (error) {
        console.error('견적 수정 실패:', error);
        throw error;
      }

      alert('견적이 성공적으로 수정되었습니다!');
      router.back();

    } catch (error: any) {
      console.error('견적 수정 실패:', error);
      setError('견적 수정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">견적 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !quote || !quoteRequest || !device) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-6">{error || '견적 정보를 찾을 수 없습니다.'}</p>
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

  const canEdit = quote.status === 'sent' || quote.status === 'viewed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-xl font-bold text-gray-900">견적서 수정</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                요청자: {quoteRequest.profiles?.name || '고객'}님
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(quote.created_at)} 전송
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 수정 불가 알림 */}
        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="flex-shrink-0 w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">수정 제한</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {quote.status === 'accepted' ? '수락된 견적은 수정할 수 없습니다.' : '거절된 견적은 수정할 수 없습니다.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 요청 정보 요약 */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-bold mb-4">견적 요청 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">요청 기기:</span>
              <p className="font-medium">{device.device_name} {device.storage_options[0]}GB</p>
            </div>
            <div>
              <span className="text-gray-500">희망 색상:</span>
              <p className="font-medium">{quoteRequest.request_details.color === 'any' ? '색상무관' : quoteRequest.request_details.color}</p>
            </div>
            <div>
              <span className="text-gray-500">희망 지역:</span>
              <p className="font-medium">{quoteRequest.request_details.locations.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* 견적서 수정 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-6">견적 상세 정보</h2>
          
          <div className="space-y-8">
            {/* 기본 가격 정보 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">기본 가격</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기기 가격 (원) *
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.device_price}
                    onChange={(e) => handleInputChange('device_price', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1200000"
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월 이용료 (원) *
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.monthly_fee}
                    onChange={(e) => handleInputChange('monthly_fee', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="65000"
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    개통비 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.activation_fee}
                    onChange={(e) => handleInputChange('activation_fee', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label='개통비'
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    약정 기간 (개월)
                  </label>
                  <select
                    value={quoteDetails.contract_period}
                    onChange={(e) => handleInputChange('contract_period', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="약정 기간"
                    disabled={!canEdit}
                  >
                    <option value={24}>24개월</option>
                    <option value={12}>12개월</option>
                    <option value={36}>36개월</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 할인 정보 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">할인 혜택</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기기 할인 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.device_discount}
                    onChange={(e) => handleInputChange('device_discount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="200000"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요금제 할인 (월/원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.plan_discount}
                    onChange={(e) => handleInputChange('plan_discount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10000"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 할인 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.additional_discount}
                    onChange={(e) => handleInputChange('additional_discount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50000"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </section>

            {/* 개통 방법 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">개통 방법</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    개통 방식
                  </label>
                  <select
                    value={quoteDetails.installation_method}
                    onChange={(e) => handleInputChange('installation_method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="개통 방식"
                    disabled={!canEdit}
                  >
                    <option value="visit">매장 방문</option>
                    <option value="delivery">택배 발송</option>
                    <option value="pickup">퀵 배송</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배송비 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.delivery_fee}
                    onChange={(e) => handleInputChange('delivery_fee', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="배송비"
                    disabled={!canEdit || quoteDetails.installation_method === 'visit'}
                  />
                </div>
              </div>
            </section>

            {/* 특별 혜택 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">특별 혜택</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  '무료 액세서리',
                  '무료 보험',
                  '데이터 추가 제공',
                  '통화료 할인',
                  '멤버십 혜택',
                  '가족 할인',
                  '학생 할인',
                  '경로 할인'
                ].map(benefit => (
                  <label key={benefit} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quoteDetails.special_benefits.includes(benefit)}
                      onChange={() => handleBenefitToggle(benefit)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={!canEdit}
                    />
                    <span className="ml-2 text-sm text-gray-700">{benefit}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 매장 메모 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">매장 메모</h3>
              <textarea
                value={quoteDetails.store_memo}
                onChange={(e) => handleInputChange('store_memo', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="고객에게 전달할 추가 메시지나 조건이 있으면 입력해주세요..."
                disabled={!canEdit}
              />
            </section>

            {/* TCO 요약 */}
            <section className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4 text-blue-900">총 비용 요약 (TCO)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">기기 비용:</span>
                  <p className="font-bold text-blue-900">
                    {formatCurrency(Math.max(0, quoteDetails.device_price - quoteDetails.device_discount))}원
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">요금제 비용:</span>
                  <p className="font-bold text-blue-900">
                    {formatCurrency((quoteDetails.monthly_fee - quoteDetails.plan_discount) * quoteDetails.contract_period)}원
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">기타 비용:</span>
                  <p className="font-bold text-blue-900">
                    {formatCurrency(quoteDetails.activation_fee + quoteDetails.delivery_fee)}원
                  </p>
                </div>
                <div className="border-l-2 border-blue-300 pl-4">
                  <span className="text-blue-700">총 비용:</span>
                  <p className="font-bold text-xl text-blue-900">
                    {formatCurrency(quoteDetails.tco_24months)}원
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            {canEdit && (
              <button
                onClick={handleSubmit}
                disabled={submitting || quoteDetails.device_price <= 0 || quoteDetails.monthly_fee <= 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '수정 중...' : '견적서 수정'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}