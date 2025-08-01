// /src/app/quote/mobile/step7/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';

export default function MobileQuoteStep7Page() {
  const router = useRouter();
  const { quoteData, updateQuoteData } = useQuote();
  const [selectedLocations, setSelectedLocations] = useState<string[]>(quoteData.locations || []);

  // 컴포넌트 마운트 시 저장된 데이터로 초기화
  useEffect(() => {
    if (quoteData.locations && quoteData.locations.length > 0) {
      setSelectedLocations(quoteData.locations);
    }
  }, [quoteData]);

  const handleAddLocationClick = () => {
    // Context 데이터를 유지하면서 검색 페이지로 이동
    router.push('/quote/mobile/location-search');
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    const newLocations = selectedLocations.filter(loc => loc !== locationToRemove);
    setSelectedLocations(newLocations);
    
    // Context에 즉시 업데이트
    updateQuoteData({ locations: newLocations });
  };

  const handleNext = () => {
    if (selectedLocations.length > 0) {
      // Context에 데이터 저장
      updateQuoteData({ locations: selectedLocations });
      // URL 파라미터 없이 이동
      router.push('/quote/mobile/step8');
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
          <h1 className="text-lg font-bold text-gray-800">우리동네 설정</h1>
        </header>

        {/* 진행 상태 바 - 6/8 (75%) */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 transition-all duration-500 w-3/4"></div>
        </div>
        
        {/* 메인 컨텐츠 */}
        <main className="flex-grow overflow-y-auto p-6 pb-24 flex flex-col">
          <section className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800">
              견적을 받아볼 동네를<br />선택해주세요.
            </h2>
            <p className="mt-2 text-gray-500">(최대 2곳 선택가능)</p>

            <div className="mt-8 space-y-3">
              {/* 선택된 지역 표시 */}
              {selectedLocations.map((location) => (
                <div 
                  key={location}
                  className="w-full flex items-center justify-between p-4 border-2 border-blue-500 rounded-lg text-blue-600 font-bold bg-blue-50"
                >
                  <span>{location}</span>
                  <button 
                    onClick={() => handleRemoveLocation(location)}
                    className="text-gray-400 hover:text-red-500 transition"
                    aria-label={`${location} 제거`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* 동네 추가하기 버튼 */}
              {selectedLocations.length < 2 && (
                <button
                  onClick={handleAddLocationClick}
                  className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  동네 추가하기
                </button>
              )}
            </div>
            
            <div className="mt-auto pt-8">
               <p className="text-sm text-gray-500">
                Tip. 우리동네에 매장이 없다면 주변 번화가로 변경해보세요
              </p>
            </div>
          </section>
        </main>
        
        {/* 하단 버튼 */}
        <footer className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleNext}
            disabled={selectedLocations.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition ${
              selectedLocations.length > 0
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