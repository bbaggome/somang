// /src/app/quote/mobile/step7/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MobileQuoteStep7Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['영천동']);
  
  // 예시 지역 목록 (실제로는 API나 DB에서 가져와야 함)
  const availableLocations = ['반송동', '석우동', '청계동', '오산동', '송정동', '장전동'];

  const handleAddLocation = () => {
    if (selectedLocations.length < 2) {
      // 아직 선택되지 않은 지역 중 첫 번째를 추가
      const newLocation = availableLocations.find(loc => !selectedLocations.includes(loc));
      if (newLocation) {
        setSelectedLocations([...selectedLocations, newLocation]);
      }
    }
  };

  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(selectedLocations.filter(loc => loc !== location));
  };

  const handleNext = () => {
    if (selectedLocations.length > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('locations', selectedLocations.join(','));
      router.push(`/quote/mobile/step8?${params.toString()}`);
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

        {/* 진행 상태 바 - 100% */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 w-full transition-all duration-500" />
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-grow overflow-y-auto p-6 pb-24">
          <section>
            <h2 className="text-2xl font-bold text-gray-800">
              견적을 받아볼 동네를<br />선택해주세요!
            </h2>
            <p className="mt-2 text-gray-500">(최대 2곳 선택가능)</p>

            <div className="mt-8 space-y-4">
              {/* 선택된 지역들 */}
              {selectedLocations.map((location) => (
                <div 
                  key={location}
                  className="w-full flex items-center justify-between p-4 border-2 border-blue-500 rounded-lg text-blue-600 font-bold bg-blue-50"
                >
                  <span>{location}</span>
                  <button 
                    onClick={() => handleRemoveLocation(location)}
                    className="text-gray-400 hover:text-red-500 transition"
                    aria-label="지역 제거"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* 지역 추가 버튼 */}
              {selectedLocations.length < 2 && (
                <button 
                  onClick={handleAddLocation}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg text-gray-400 hover:bg-gray-50 transition"
                >
                  <span>동네를 선택해 주세요</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* 안내 메시지 */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 선택한 지역의 매장들로부터 견적을 받아보실 수 있습니다. 
                더 많은 선택지를 원하신다면 인근 지역도 함께 선택해보세요!
              </p>
            </div>
          </section>
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
            disabled={selectedLocations.length === 0}
            className={`flex-grow ml-4 py-4 rounded-xl font-bold text-lg transition ${
              selectedLocations.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            다음
          </button>
        </footer>
      </div>
    </div>
  );
}