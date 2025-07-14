// /src/app/quote/mobile/step1/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MobileQuoteStep1Page() {
  const router = useRouter();
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const handleStartClick = () => {
    setShowBottomSheet(true);
  };

  const handleCloseSheet = () => {
    setShowBottomSheet(false);
  };

  const handleConfirm = () => {
    router.push('/quote/mobile/step2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <header className="p-4 flex items-center justify-center relative flex-shrink-0">
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

        {/* 메인 컨텐츠 */}
        <main className="flex-grow overflow-y-auto px-6 pt-8 pb-28">
          <section className="text-center">
            <p className="text-blue-600 font-bold">휴대폰 신규/기변/번호이동</p>
            <h2 className="text-3xl font-black text-gray-800 mt-1">
              휴대폰 견적 받아보기<br />START!
            </h2>

            {/* 일러스트 영역 */}
            <div className="mt-8 relative h-48 flex items-center justify-center">
              <div className="text-6xl">📱💰✨</div>
            </div>
          </section>

          <section className="mt-12 text-center">
            <p className="text-gray-600">T-BRIDGE의 휴대폰 견적 받기는 이렇게 진행돼요!</p>

            <div className="mt-8 p-6 bg-gray-50 rounded-2xl text-left space-y-6">
              {/* 타임라인 아이템들 */}
              <div className="relative">
                <div className="flex items-start">
                  <div className="z-10 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">견적요청</h4>
                    <p className="text-sm text-gray-500 mt-1">견적을 받기 위해 몇 가지 질문에 답하기!</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-start">
                  <div className="z-10 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">견적수신</h4>
                    <p className="text-sm text-gray-500 mt-1">매장에서 보낸 견적을 확인하고 비교하기!</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-start">
                  <div className="z-10 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">상담진행</h4>
                    <p className="text-sm text-gray-500 mt-1">맘에 드는 매장과 채팅 상담 시작하기!</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-start">
                  <div className="z-10 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">가입신청</h4>
                    <p className="text-sm text-gray-500 mt-1">상담이 만족스러웠다면 개통을 위한 가입신청서 작성 및 접수하기!</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-lg flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="text-sm font-medium">
                휴대폰 개통 후 견적 내용과 개통 내용이 일치하는지 <span className="font-bold">반드시 확인</span>하시기 바랍니다!
              </p>
            </div>
          </section>
        </main>

        {/* 하단 버튼 */}
        <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
          <button
            onClick={handleStartClick}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition"
          >
            시작하기
          </button>
        </footer>
      </div>

      {/* Bottom Sheet 모달 */}
      {showBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-end">
          <div className={`w-full max-w-[500px] bg-white rounded-t-2xl p-6 transform transition-transform duration-300 ${showBottomSheet ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="text-center mb-6">
              <span className="text-4xl">👆</span>
              <h3 className="text-xl font-bold mt-4">채팅을 시작하기 전 꼭 읽어주세요!</h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div>
                <h4 className="font-bold">1. 고객 후기 확인하기</h4>
                <p className="text-sm text-gray-600 mt-1">다른 고객들의 후기를 읽고 매장에 대한 신뢰도를 확인해 보세요.</p>
              </div>
              
              <div>
                <h4 className="font-bold">2. 사전승낙마크 확인하기</h4>
                <p className="text-sm text-gray-600 mt-1">사전승낙마크는 이동통신사와 정한 기준을 통과한 매장에만 부여되는 신뢰의 표시예요.</p>
              </div>
              
              <div>
                <h4 className="font-bold">3. 개통 후 확인하기</h4>
                <p className="text-sm text-gray-600 mt-1">
                  개통 후 수신받는 개통내역 안내문자나 고객센터 앱을 통하여 아래의 항목이 일치하는지 반드시 확인하세요!<br />
                  <span className="text-blue-600 font-semibold">개통한 기기 · 할부금과 기간 · 요금제 · 할인 유형(공시지원금 or 선택약정)</span>
                </p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={handleCloseSheet}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
              >
                뒤로가기
              </button>
              <button
                onClick={handleConfirm}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}