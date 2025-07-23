// /src/app/quote/mobile/step8/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useQuote } from '@/context/QuoteContext';
import { supabase } from '@/lib/supabase/client';
import type { QuoteRequestDetails } from '@/types/quote';
import type { Device } from '@/types';

export default function MobileQuoteStep8Page() {
  const router = useRouter();
  const { user } = useAuth();
  const { quoteData, resetQuoteData } = useQuote();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<Device | null>(null);
  const hasCheckedData = useRef(false); // 데이터 검증을 한 번만 실행하기 위한 ref

  // Context에서 데이터 가져오기
  const requestData: QuoteRequestDetails = {
    purchaseTarget: quoteData.purchaseTarget || 'self',
    age: quoteData.age || 'general',
    currentCarrier: quoteData.currentCarrier || 'skt',
    changeType: quoteData.changeType || 'device_only',
    newCarrier: quoteData.newCarrier,
    dataUsage: quoteData.dataUsage || 'unlimited',
    deviceId: quoteData.deviceId || '',
    color: quoteData.color || 'any',
    locations: quoteData.locations || []
  };

  // 데이터 유효성 검사 (한 번만 실행)
  useEffect(() => {
    if (hasCheckedData.current) return; // 이미 검사했으면 skip
    
    hasCheckedData.current = true;
    
    console.log('Quote data validation:', quoteData);
    console.log('Request data:', requestData);
    
    // 필수 데이터 검증
    const isDataValid = 
      requestData.purchaseTarget && 
      requestData.age &&
      requestData.currentCarrier &&
      requestData.changeType &&
      requestData.dataUsage &&
      requestData.deviceId && 
      requestData.color &&
      requestData.locations.length > 0;

    if (!isDataValid) {
      console.log('데이터 유효성 검사 실패:', {
        purchaseTarget: !!requestData.purchaseTarget,
        age: !!requestData.age,
        currentCarrier: !!requestData.currentCarrier,
        changeType: !!requestData.changeType,
        dataUsage: !!requestData.dataUsage,
        deviceId: !!requestData.deviceId,
        color: !!requestData.color,
        locations: requestData.locations.length
      });
      
      alert('견적 정보가 불완전합니다. 처음부터 다시 시작해주세요.');
      resetQuoteData();
      router.replace('/quote/mobile/step1');
    }
  }, [quoteData, requestData, resetQuoteData, router]); // 의존성 추가

  // 디바이스 정보 로드
  useEffect(() => {
    if (requestData.deviceId && requestData.deviceId !== '') {
      loadDeviceInfo(requestData.deviceId);
    }
  }, [requestData.deviceId]);

  const loadDeviceInfo = async (deviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (error) throw error;
      setDeviceInfo(data);
    } catch (error) {
      console.error('디바이스 정보 로드 실패:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    console.log('견적 요청 시작:', {
      user_id: user.id,
      user_email: user.email,
      requestData
    });

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .insert({
          user_id: user.id,
          product_type: 'mobile_phone',
          request_details: requestData,
          status: 'open'
        })
        .select(); // 삽입된 데이터를 반환받기 위해 추가

      if (error) {
        console.error('Supabase 에러 상세:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('견적 요청 성공:', data);

      // 성공 시 Context 데이터 초기화
      resetQuoteData();
      setShowConfirmModal(true);
    } catch (error) {
      console.error('견적 요청 실패:', error);
      
      // 에러 타입별로 다른 메시지 표시
      let errorMessage = '견적 요청 중 오류가 발생했습니다.';
      
      const errorWithCode = error as Error & { code?: string };
      if (errorWithCode.code === '42501') {
        errorMessage = '권한이 없습니다. 로그인 상태를 확인해주세요.';
      } else if (errorWithCode.code === '23503') {
        errorMessage = '사용자 정보를 찾을 수 없습니다.';
      } else if (error instanceof Error && error.message) {
        errorMessage = `오류: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleConfirmAndRedirect = () => {
    setShowConfirmModal(false);
    router.push('/');
  };

  // 표시용 텍스트 변환 함수들
  const getAgeText = (age: string) => {
    const ageMap: { [key: string]: string } = {
      'general': '일반(만 35세~64세 이하)',
      'youth': '청년(만 19세~34세 이하)',
      'teen': '청소년(만 12세~18세 이하)',
      'kids': '키즈(만 12세 이하)',
      'senior': '어르신(만 65세 이상)'
    };
    return ageMap[age] || age;
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

  // 데이터 검증 중이거나 리다이렉트 중일 때는 로딩 표시
  if (!hasCheckedData.current) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[500px] h-screen bg-white shadow-xl flex flex-col">
        {/* 헤더 */}
        <header className="p-4 flex items-center justify-center relative flex-shrink-0 border-b border-gray-100">
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2" 
            aria-label="뒤로가기" 
            onClick={handleBack}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">휴대폰 견적 받아보기</h1>
        </header>

        {/* 진행 상태 바 - 8/8 (100%) */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 w-full transition-all duration-500" />
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 pb-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 leading-snug">
                입력하신 정보가 맞다면,<br />이제 견적을 받아볼까요?
              </h2>
              <p className="mt-2 text-gray-500 text-sm">
                견적을 요청하시면, 매장 방문 개통부터 택배와 퀵으로 받을 수 있는 비대면 개통 견적까지 모두 받아볼 수 있어요!
              </p>

              {/* 요청 정보 요약 */}
              <div className="mt-8 p-5 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">구매 대상</span>
                  <span className="font-bold text-gray-800 text-right">
                    {requestData.purchaseTarget === 'self' ? '본인' : '부모님/자녀 등'} - {getAgeText(requestData.age)}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">현재 이용 내역</span>
                  <span className="font-bold text-gray-800 text-right">
                    {getCarrierText(requestData.currentCarrier)}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">희망 통신사</span>
                  <span className="font-bold text-gray-800 text-right">
                    {requestData.changeType === 'device_only' 
                      ? `${getCarrierText(requestData.currentCarrier)} (${getChangeTypeText(requestData.changeType)})`
                      : `${getCarrierText(requestData.newCarrier || '')} (${getChangeTypeText(requestData.changeType)})`
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">구매 모델</span>
                  <span className="font-bold text-gray-800 text-right">
                    {deviceInfo 
                      ? `${deviceInfo.device_name} ${deviceInfo.storage_options[0]}GB | ${requestData.color === 'any' ? '색상무관' : requestData.color}`
                      : '로딩 중...'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">견적 받을 동네</span>
                  <span className="font-bold text-gray-800 text-right">
                    {requestData.locations.join(', ')}
                  </span>
                </div>
              </div>

              {/* 주의사항 */}
              <div className="mt-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-lg flex items-center">
                  <span className="text-xl mr-3">⚠️</span>
                  <p className="text-sm font-medium">
                    휴대폰 개통 후 견적 내용과 개통 내용이 일치하는지 <span className="font-bold">반드시 확인</span>하시기 바랍니다!
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <div className="text-center mb-4">
            <div className="inline-flex items-center bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
              <span className="mr-2">⚠️</span>
              잠깐! 견적 요청 후 일주일간 수정 및 재등록이 불가능하니 신중히 선택해주세요!
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              className="w-1/3 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              뒤로가기
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-2/3 py-4 rounded-xl font-bold transition-all duration-200 active:scale-[0.98] ${
                loading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? '처리 중...' : '견적 요청하기'}
            </button>
          </div>
        </footer>
      </div>

      {/* Bottom Sheet 완료 모달 - step1과 동일한 스타일 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-end">
          {/* 배경 오버레이 - 어둡게 처리 */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ease-out ${
              showConfirmModal ? 'opacity-60' : 'opacity-0'
            }`}
            onClick={handleConfirmAndRedirect}
          />
          
          {/* 모달 컨텐츠 */}
          <div 
            className={`relative w-full max-w-[500px] bg-white rounded-t-2xl p-6 transform transition-all duration-300 ease-out ${
              showConfirmModal 
                ? 'translate-y-0 opacity-100 animate-slideUp' 
                : 'translate-y-full opacity-0 animate-slideDown'
            }`}
          >
            {/* 상단 핸들바 */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            
            <div className="text-center mb-6">
              <div className="mb-4">
                <svg className="w-16 h-16 text-blue-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">견적 요청이 완료되었습니다.</h3>
              <p className="text-gray-600 mb-6">
                매장들이 곧 견적을 보내드릴 예정입니다.<br />알림을 확인해주세요!
              </p>
            </div>
            
            <button
              onClick={handleConfirmAndRedirect}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}