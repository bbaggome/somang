// /src/app/quote/mobile/step5/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';

export default function MobileQuoteStep5Page() {
  const router = useRouter();
  const { quoteData, updateQuoteData } = useQuote();
  const [dataUsage, setDataUsage] = useState<string>(quoteData.dataUsage || '');

  // 컴포넌트 마운트 시 저장된 데이터로 초기화
  useEffect(() => {
    if (quoteData.dataUsage) setDataUsage(quoteData.dataUsage);
  }, [quoteData]);

  const handleNext = () => {
    if (dataUsage) {
      // Context에 데이터 저장
      updateQuoteData({ dataUsage: dataUsage as any });
      // URL 파라미터 없이 이동
      router.push('/quote/mobile/step6');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const dataOptions = [
    {
      value: 'unlimited',
      title: '데이터 무제한',
      description: '마음껏 사용해요'
    },
    {
      value: '50gb_plus',
      title: '50GB 이상',
      description: '매일 1시간 이상 영상을 자주 시청해요'
    },
    {
      value: '10gb_plus',
      title: '10GB 이상',
      description: '음악을 자주 들어요'
    },
    {
      value: '9gb_under',
      title: '9GB 이하',
      description: '웹 서핑과 카톡 위주로 사용해요'
    },
    {
      value: '5gb_under',
      title: '5GB 이하',
      description: '거의 사용하지 않고 WIFI 이용해요'
    }
  ];

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

        {/* 진행 상태 바 - 4/8 (50%) */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 transition-all duration-500 w-1/2" />
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-800">
                한달 데이터 사용량은<br />어떻게 되시나요?
              </h2>
              <p className="mt-2 text-gray-500">의무요금제 사용 후, 최적의 요금제를 추천해 드려요</p>
              
              <div className="mt-8 space-y-4 pb-6">
                {dataOptions.map((option) => (
                  <label 
                    key={option.value}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      dataUsage === option.value 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 flex-shrink-0 ${
                      dataUsage === option.value 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {dataUsage === option.value && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className={`font-bold text-gray-800 ${dataUsage === option.value ? 'text-blue-600' : ''}`}>
                        {option.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                    <input 
                      type="radio" 
                      name="dataUsage" 
                      value={option.value} 
                      checked={dataUsage === option.value}
                      onChange={(e) => setDataUsage(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100 shadow-lg flex items-center justify-between">
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
            disabled={!dataUsage}
            className={`flex-grow ml-4 py-4 rounded-xl font-bold text-lg transition-all duration-200 active:scale-[0.98] ${
              dataUsage 
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