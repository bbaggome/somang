// /src/app/quote/mobile/step2/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';

export default function MobileQuoteStep2Page() {
  const router = useRouter();
  const { quoteData, updateQuoteData } = useQuote();
  const [purchaseTarget, setPurchaseTarget] = useState<string>(quoteData.purchaseTarget || '');
  const [age, setAge] = useState<string>(quoteData.age || '');

  // 컴포넌트 마운트 시 저장된 데이터로 초기화
  useEffect(() => {
    if (quoteData.purchaseTarget) setPurchaseTarget(quoteData.purchaseTarget);
    if (quoteData.age) setAge(quoteData.age);
  }, [quoteData]);

  const handleNext = () => {
    if (purchaseTarget && age) {
      // Context에 데이터 저장
      updateQuoteData({ 
        purchaseTarget: purchaseTarget, 
        age: age 
      });
      // URL 파라미터 없이 이동
      router.push('/quote/mobile/step3');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[500px] h-screen bg-white shadow-xl flex flex-col">
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
          <h1 className="text-lg font-bold text-gray-800">휴대폰 견적 받아보기</h1>
        </header>

        {/* 진행 상태 바 - 1/8 (12.5%) */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 transition-all duration-500 w-[12.5%]" />
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-800">
                누구의 폰을<br />구매 하시는건가요?
              </h2>
              
              <div className="mt-6 space-y-4">
                <label 
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    purchaseTarget === 'self' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <span className={purchaseTarget === 'self' ? 'font-bold text-blue-600' : ''}>본인</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    purchaseTarget === 'self' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    {purchaseTarget === 'self' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <input 
                    type="radio" 
                    name="purchaseTarget" 
                    value="self" 
                    checked={purchaseTarget === 'self'}
                    onChange={(e) => setPurchaseTarget(e.target.value)}
                    className="hidden"
                  />
                </label>

                <label 
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    purchaseTarget === 'other' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <span className={purchaseTarget === 'other' ? 'font-bold text-blue-600' : ''}>부모님/자녀 등</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    purchaseTarget === 'other' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    {purchaseTarget === 'other' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <input 
                    type="radio" 
                    name="purchaseTarget" 
                    value="other" 
                    checked={purchaseTarget === 'other'}
                    onChange={(e) => setPurchaseTarget(e.target.value)}
                    className="hidden"
                  />
                </label>
              </div>
            </section>

            <section className="mt-10 pb-6">
              <h3 className="text-xl font-bold text-gray-800">사용자 연령대를 선택해 주세요</h3>
              <p className="text-sm text-gray-500 mt-1">연령에 맞는 요금제 추천에 활용됩니다</p>
              
              <div className="mt-6 space-y-4">
                {[
                  { value: 'general', label: '일반 (만 35세~64세 이하)' },
                  { value: 'youth', label: '청년 (만 19세~34세 이하)' },
                  { value: 'teen', label: '청소년 (만 12세~18세 이하)' },
                  { value: 'kids', label: '키즈 (만 12세 이하)' },
                  { value: 'senior', label: '어르신 (만 65세 이상)' }
                ].map((ageOption) => (
                  <label 
                    key={ageOption.value}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      age === ageOption.value 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300'
                    }`}
                  >
                    <span className={age === ageOption.value ? 'font-bold text-blue-600' : ''}>{ageOption.label}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      age === ageOption.value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      {age === ageOption.value && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <input 
                      type="radio" 
                      name="age" 
                      value={ageOption.value} 
                      checked={age === ageOption.value}
                      onChange={(e) => setAge(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <button
            onClick={handleNext}
            disabled={!purchaseTarget || !age}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 active:scale-[0.98] ${
              purchaseTarget && age 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' 
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