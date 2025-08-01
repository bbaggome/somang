// /src/app/quote/mobile/step4/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';

export default function MobileQuoteStep4Page() {
  const router = useRouter();
  const { quoteData, updateQuoteData } = useQuote();
  const [changeType, setChangeType] = useState<'port' | 'device_only' | 'new' | ''>(quoteData.changeType || '');
  const [newCarrier, setNewCarrier] = useState<'skt' | 'kt' | 'lgu' | 'mvno' | ''>(quoteData.newCarrier || '');
  const currentCarrier = quoteData.currentCarrier || '';

  // 컴포넌트 마운트 시 저장된 데이터로 초기화
  useEffect(() => {
    if (quoteData.changeType) setChangeType(quoteData.changeType);
    if (quoteData.newCarrier) setNewCarrier(quoteData.newCarrier);
  }, [quoteData]);

  const handleNext = () => {
    if (changeType && (changeType === 'device_only' || newCarrier)) {
      // Context에 데이터 저장
      updateQuoteData({ 
        changeType: changeType as 'port' | 'device_only' | 'new',
        newCarrier: changeType !== 'device_only' ? newCarrier as 'skt' | 'kt' | 'lgu' | 'mvno' : undefined
      });
      // URL 파라미터 없이 이동
      router.push('/quote/mobile/step5');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
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

        {/* 진행 상태 바 - 3/8 (37.5%) */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 transition-all duration-500 w-[37.5%]" />
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-grow overflow-y-auto p-6 pb-24">
          <section>
            <h2 className="text-2xl font-bold text-gray-800">
              현재 이용중인 통신사를<br />변경할 의향이 있으신가요?
            </h2>
            
            <div className="mt-8 space-y-4">
              {[
                { value: 'port', label: '네 (번호이동)' },
                { value: 'device_only', label: '아니오 (기기변경)' },
                { value: 'new', label: '신규가입' }
              ].map((option) => (
                <label 
                  key={option.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    changeType === option.value 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 ${
                    changeType === option.value 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {changeType === option.value && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={changeType === option.value ? 'font-bold text-blue-600' : ''}>
                    {option.label}
                  </span>
                  <input 
                    type="radio" 
                    name="changeType" 
                    value={option.value} 
                    checked={changeType === option.value}
                    onChange={(e) => {
                      setChangeType(e.target.value as 'port' | 'device_only' | 'new');
                      setNewCarrier(''); // Reset new carrier selection
                    }}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* 번호이동 또는 신규가입 선택시 새로운 통신사 선택 */}
          {(changeType === 'port' || changeType === 'new') && (
            <section className="mt-10 transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-800">
                {changeType === 'port' ? '변경을 원하는' : '가입을 원하는'} 통신사를 선택해 주세요!
              </h3>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { value: 'skt', label: 'SKT' },
                  { value: 'kt', label: 'KT' },
                  { value: 'lgu', label: 'LGU+' },
                  { value: 'mvno', label: '알뜰폰' }
                ].filter(option => changeType === 'new' || option.value !== currentCarrier) // 번호이동시 현재 통신사 제외
                .map((option) => (
                  <label 
                    key={option.value}
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      newCarrier === option.value 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-2 ${
                      newCarrier === option.value 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {newCarrier === option.value && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`font-medium text-sm ${newCarrier === option.value ? 'text-blue-600 font-bold' : ''}`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="newCarrier" 
                      value={option.value} 
                      checked={newCarrier === option.value}
                      onChange={(e) => setNewCarrier(e.target.value as 'skt' | 'kt' | 'lgu' | 'mvno')}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* 하단 버튼 */}
        <footer className="p-4 bg-white border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            disabled={!changeType || (changeType !== 'device_only' && !newCarrier)}
            className={`flex-grow ml-4 py-4 rounded-xl font-bold text-lg transition ${
              changeType && (changeType === 'device_only' || newCarrier)
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            다음
          </button>
        </footer>
      </div>
    </div>
  );
}