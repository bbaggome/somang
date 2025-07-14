// /src/app/quote/mobile/location-search/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Kakao Maps SDK의 타입 정의 (전역으로 사용)
declare global {
  interface Window {
    kakao: any;
  }
}

export default function LocationSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  // 상태 관리: SDK 준비, 로딩, 에러, 위치 데이터
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [myNeighborhood, setMyNeighborhood] = useState<string | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Kakao Maps SDK 동적 로딩 및 초기화
  useEffect(() => {
    // 스크립트가 이미 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      setIsSdkReady(true);
      return;
    }

    const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!kakaoApiKey) {
      setError("카카오 API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
      return;
    }

    // 이미 스크립트 태그가 있는지 확인하여 중복 추가 방지
    if (document.getElementById('kakao-maps-sdk')) return;

    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (window.kakao.maps.services) {
          setIsSdkReady(true);
        } else {
          setError("지도 서비스(라이브러리) 로딩에 실패했습니다.");
        }
      });
    };
    
    script.onerror = () => {
      setError("지도 SDK 스크립트를 불러오는 데 실패했습니다. 네트워크 연결 또는 API 키를 확인해주세요.");
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (선택적)
      const existingScript = document.getElementById('kakao-maps-sdk');
      if (existingScript) {
        // document.head.removeChild(existingScript);
      }
    };
  }, []);

  // 검색어 기반 장소 검색 (디바운싱 적용)
  const searchPlaces = useCallback((term: string) => {
    if (!isSdkReady || !term.trim()) {
      setSearchResults([]);
      return;
    }
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(term, (data: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    });
  }, [isSdkReady]);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchPlaces(searchTerm);
    }, 300); // 300ms 디바운스

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchPlaces]);


  // 동네 선택 핸들러
  const handleLocationSelect = (location: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existingLocations = params.get('locations')?.split(',').filter(Boolean) || [];
    
    if (existingLocations.length < 2 && !existingLocations.includes(location)) {
      const newLocations = [...existingLocations, location];
      params.set('locations', newLocations.join(','));
    }
    
    router.push(`/quote/mobile/step7?${params.toString()}`);
  };

  // 현재 위치 불러오기 핸들러
  const handleFetchCurrentLocation = () => {
    if (!isSdkReady) {
      setError("지도 서비스가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchTerm(''); 
    setSearchResults([]); 

    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.coord2Address(longitude, latitude, (result: any[], status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const addr = result[0].road_address ? result[0].road_address.address_name : result[0].address.address_name;
            setMyNeighborhood(addr);
            
            const ps = new window.kakao.maps.services.Places();
            ps.categorySearch('PO3', (data: any[], catStatus: any) => {
              if (catStatus === window.kakao.maps.services.Status.OK) {
                const nearby = [...new Set(data.map(p => p.address_name.split(' ').slice(0, 3).join(' ')))];
                setNearbyLocations(nearby.filter(loc => loc !== addr).slice(0, 9));
              }
              setIsLoading(false);
            }, { location: new window.kakao.maps.LatLng(latitude, longitude), radius: 2000 });
          } else {
            setError("현재 주소를 가져오지 못했습니다. 다시 시도해주세요.");
            setIsLoading(false);
          }
        });
      },
      (geoError) => {
        let errorMessage = '위치 정보를 가져오는 중 오류가 발생했습니다.';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED: errorMessage = '위치 정보 접근 권한이 거부되었습니다. 권한을 허용해주세요.'; break;
          case geoError.POSITION_UNAVAILABLE: errorMessage = '현재 위치 정보를 사용할 수 없습니다.'; break;
          case geoError.TIMEOUT: errorMessage = '위치 정보를 가져오는 데 시간이 초과되었습니다.'; break;
        }
        setError(errorMessage);
        setIsLoading(false);
      }
    );
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
        <header className="p-4 flex items-center justify-center relative flex-shrink-0">
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

        <main className="flex-grow overflow-y-auto p-6">
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-2">검색으로 찾기</h2>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="동, 읍, 면 단위로 검색"
                className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={handleFetchCurrentLocation} disabled={isLoading || !isSdkReady} className="w-full flex items-center justify-center text-blue-600 font-semibold py-3 mt-2 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {isLoading ? '위치 찾는 중...' : (isSdkReady ? '현재 위치 불러오기' : '지도 서비스 로딩 중...')}
            </button>
          </div>
          
          <div className="mt-4">
            {isLoading && (
              <div className="py-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                위치 정보를 불러오는 중...
              </div>
            )}
            {error && <div className="py-4 px-2 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>}
            
            {/* 검색 결과 표시 */}
            {searchResults.length > 0 && !isLoading && (
              <ul className="divide-y divide-gray-200">
                {searchResults.map(place => (
                  <li key={place.id} onClick={() => handleLocationSelect(place.road_address_name || place.address_name)} className="py-3 px-1 cursor-pointer hover:bg-gray-50">
                    <p className="font-medium">{place.place_name}</p>
                    <p className="text-sm text-gray-500">{place.road_address_name}</p>
                    <p className="text-xs text-gray-400">(지번) {place.address_name}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* 현재 위치 결과 표시 */}
            {myNeighborhood && !isLoading && !error && searchResults.length === 0 && (
              <>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">우리동네</h3>
                  <div onClick={() => handleLocationSelect(myNeighborhood)} className="py-3 px-1 cursor-pointer hover:bg-gray-50 font-medium text-blue-600">
                    {myNeighborhood}
                  </div>
                </div>
                {nearbyLocations.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">근처동네</h3>
                    <ul className="divide-y divide-gray-200">
                      {nearbyLocations.map(location => (
                        <li key={location} onClick={() => handleLocationSelect(location)} className="py-3 px-1 cursor-pointer hover:bg-gray-50">{location}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* 초기 상태 메시지 */}
            {!isLoading && !error && !myNeighborhood && searchResults.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p>검색하거나 현재 위치를 불러와<br/>동네를 설정해주세요.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
