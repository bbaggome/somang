// /src/app/quote/mobile/location-search/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';

// Kakao Maps SDK의 타입 정의
interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  category_group_code?: string;
  category_name?: string;
  distance?: string;
}

interface KakaoAddressResult {
  address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
  };
  road_address?: {
    address_name: string;
  };
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    kakao: {
      maps: {
        services: {
          Geocoder: new () => {
            coord2Address(
              lng: number,
              lat: number,
              callback: (result: KakaoAddressResult[], status: string) => void
            ): void;
          };
          Places: new () => {
            keywordSearch(
              keyword: string,
              callback: (data: KakaoPlace[], status: string) => void,
              options?: { radius?: number; x?: string; y?: string }
            ): void;
          };
          Status: {
            OK: string;
          };
        };
      };
    };
  }
}

export default function LocationSearchPage() {
  const router = useRouter();
  const { quoteData, updateQuoteData } = useQuote();
  const [searchTerm, setSearchTerm] = useState('');

  // 상태 관리
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLocating, setIsAutoLocating] = useState(false); // 자동 위치 조회 상태 추가
  const [error, setError] = useState<string | null>(null);
  
  const [myNeighborhood, setMyNeighborhood] = useState<{
    display: string;
    full: string;
  } | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<{
    display: string;
    full: string;
  }[]>([]);
  const [searchResults, setSearchResults] = useState<{
    id: string;
    display: string;
    full: string;
    name?: string;
  }[]>([]);

  // WebView 환경 감지 (상단으로 이동)
  const isWebView = typeof window !== 'undefined' && 
    typeof navigator !== 'undefined' && 
    navigator.userAgent.includes('ReactNativeWebView');

  // 주소를 "시/도 구/군 동" 형식으로 변환하고 동 단위인지 확인하는 함수
  const formatAddressForDong = (address: string): { display: string; full: string; isDong: boolean } => {
    if (!address) return { display: address, full: address, isDong: false };
    
    const parts = address.split(' ').filter(Boolean);
    
    // 동/읍/면이 포함된 부분을 찾아서 그 레벨까지 추출
    for (let i = 0; i < parts.length; i++) {
      if (/[동읍면]$/.test(parts[i])) {
        // 시/도 구/군 동 형태로 추출 (최소 3단계)
        const dongLevel = Math.max(i + 1, 3);
        if (parts.length >= dongLevel) {
          const display = parts.slice(0, dongLevel).join(' ');
          return { display, full: address, isDong: true };
        }
      }
    }
    
    // 동/읍/면이 없으면 구/군 레벨까지만 표시
    if (parts.length >= 3) {
      const display = parts.slice(0, 3).join(' ');
      return { display, full: address, isDong: false };
    }
    
    return { display: address, full: address, isDong: false };
  };

  // 장소가 동네(행정구역)인지 판단하는 함수
  const isNeighborhoodPlace = (place: KakaoPlace): boolean => {
    // 카테고리 그룹 코드가 행정구역 관련인지 확인
    if (place.category_group_code === 'AD5') return true; // 행정구역
    
    // 카테고리명에 동/읍/면이 포함되어 있는지 확인
    const categoryName = place.category_name || '';
    if (categoryName.includes('행정동') || categoryName.includes('법정동')) return true;
    
    // 장소명이 동/읍/면으로 끝나는지 확인
    const placeName = place.place_name || '';
    if (/[동읍면]$/.test(placeName)) return true;
    
    // 주소에서 동 단위 추출이 가능한지 확인
    const roadAddress = place.road_address_name || '';
    const jibunAddress = place.address_name || '';
    
    const roadFormatted = formatAddressForDong(roadAddress);
    const jibunFormatted = formatAddressForDong(jibunAddress);
    
    return roadFormatted.isDong || jibunFormatted.isDong;
  };

  // Kakao Maps SDK 동적 로딩 및 초기화
  useEffect(() => {
    const initializeKakaoMaps = () => {
      if (window.kakao?.maps?.services) {
        setIsSdkReady(true);
        return;
      }

      const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_API_KEY;
      
      if (!kakaoApiKey) {
        setError("카카오 JavaScript API 키가 설정되지 않았습니다.");
        return;
      }

      const existingScript = document.getElementById('kakao-maps-sdk');
      if (existingScript) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'kakao-maps-sdk';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services&autoload=false`;
      script.async = true;
      
      script.onload = () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => {
            if (window.kakao.maps.services) {
              setIsSdkReady(true);
              setError(null);
            } else {
              setError("지도 서비스를 불러올 수 없습니다.");
            }
          });
        } else {
          setError("지도 라이브러리를 불러올 수 없습니다.");
        }
      };
      
      script.onerror = () => {
        setError("카카오 지도 스크립트 로딩에 실패했습니다. API 키를 확인해주세요.");
      };

      document.head.appendChild(script);
    };

    const timer = setTimeout(initializeKakaoMaps, 100);
    return () => clearTimeout(timer);
  }, []);

  // 네이티브 위치 정보 응답 처리
  useEffect(() => {
    if (isWebView) {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = event.data;
          console.log('📱 React Native로부터 메시지 받음:', data);
          
          if (data.type === 'native-location-success') {
            console.log('📍 네이티브 위치 정보 성공:', data.latitude, data.longitude);
            processLocationCoordinates(data.latitude, data.longitude);
          } else if (data.type === 'native-location-error') {
            console.error('❌ 네이티브 위치 정보 실패:', data.error);
            setError(data.error);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('메시지 처리 오류:', error);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isWebView, isSdkReady]);

  // 위치 좌표를 받아서 주소로 변환하는 공통 함수
  const processLocationCoordinates = (latitude: number, longitude: number) => {
    if (!isSdkReady) {
      setError("지도 서비스가 아직 준비되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.coord2Address(longitude, latitude, (result: KakaoAddressResult[], status: string) => {
        console.log('네이티브 위치 Geocoding 결과:', status, result);
        
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          const addressData = result[0];
          console.log('네이티브 위치 주소 데이터:', addressData);
          
          // 지번 주소를 우선으로 사용 (행정동 정보가 더 정확함)
          let primaryAddress = '';
          
          if (addressData.address && addressData.address.address_name) {
            primaryAddress = addressData.address.address_name;
            console.log('네이티브 위치 지번 주소 사용:', primaryAddress);
          } else if (addressData.road_address && addressData.road_address.address_name) {
            primaryAddress = addressData.road_address.address_name;
            console.log('네이티브 위치 도로명 주소 사용:', primaryAddress);
          }

          if (primaryAddress) {
            // 주소에서 동 정보 추출
            console.log('네이티브 위치 원본 주소:', primaryAddress);
            const formatted = formatAddressForDong(primaryAddress);
            console.log('네이티브 위치 포맷팅된 주소:', formatted);
            
            if (formatted.display) {
              setMyNeighborhood(formatted);
              
              // 근처 지역 검색을 위해 Places 검색 사용
              const ps = new window.kakao.maps.services.Places();
              
              // 주변 지역을 키워드 검색으로 찾기 (구/군 단위로 검색)
              const addressParts = formatted.display.split(' ');
              const searchQuery = addressParts.length >= 2 ? `${addressParts[1]} 동` : `${addressParts[0]} 동`;
              console.log('네이티브 위치 근처 지역 검색:', searchQuery);
              
              ps.keywordSearch(searchQuery, (data: KakaoPlace[], catStatus: string) => {
                console.log('네이티브 위치 근처 지역 검색 결과:', catStatus, data);
                
                if (catStatus === window.kakao.maps.services.Status.OK && data.length > 0) {
                  const nearbyFormatted = data
                    .filter(place => {
                      // 행정동인지 확인
                      const placeName = place.place_name || '';
                      const placeAddress = place.address_name || '';
                      
                      // 동으로 끝나는 장소만 필터링
                      return /[동읍면]$/.test(placeName) || /[동읍면]/.test(placeAddress);
                    })
                    .map(place => {
                      const placeAddress = place.address_name || '';
                      return formatAddressForDong(placeAddress);
                    })
                    .filter(location => 
                      location && 
                      location.isDong && // 동 단위인 것만
                      location.display !== formatted.display && // 현재 위치와 다른 것만
                      location.display.includes(addressParts[0]) && // 같은 시/도
                      (addressParts.length >= 2 ? location.display.includes(addressParts[1]) : true) // 같은 구/군
                    )
                    .filter((location, index, arr) => 
                      // 중복 제거
                      arr.findIndex(l => l && l.display === location!.display) === index
                    )
                    .slice(0, 9);
                  
                  console.log('네이티브 위치 필터링된 근처 지역:', nearbyFormatted);
                  setNearbyLocations(nearbyFormatted);
                } else {
                  // 검색 결과가 없으면 빈 배열 설정
                  setNearbyLocations([]);
                }
                setIsLoading(false);
              }, { 
                location: new window.kakao.maps.LatLng(latitude, longitude), 
                radius: 5000 // 5km로 확장
              });
            } else {
              console.error('네이티브 위치 주소 파싱 실패:', primaryAddress);
              setError("주소 형식을 인식할 수 없습니다.");
              setIsLoading(false);
            }
          } else {
            console.error('네이티브 위치 주소 정보 없음');
            setError("주소 정보를 처리할 수 없습니다.");
            setIsLoading(false);
          }
        } else {
          console.error('네이티브 위치 Geocoding 실패:', status);
          setError("현재 주소를 가져오지 못했습니다. 다시 시도해주세요.");
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('네이티브 위치 Geocoding 오류:', error);
      setError("주소 변환 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // 페이지 로드 시 자동으로 현재 위치 가져오기
  useEffect(() => {
    if (isSdkReady && !myNeighborhood && !isAutoLocating) {
      console.log('SDK 준비 완료');
      
      // 모든 환경에서 자동 위치 조회 비활성화
      // 사용자가 버튼을 클릭해야만 위치 권한 요청 가능
      console.log('🔒 자동 위치 조회 비활성화 - 사용자 상호작용 필요');
      
      // 기존에 권한이 있는 경우에만 자동 조회 (HTTPS 환경에서만)
      if (!isWebView && window.location.protocol === 'https:' && navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            console.log('✅ 위치 권한 이미 허용됨 - 자동 조회 시작');
            handleAutoFetchCurrentLocation();
          } else {
            console.log('❌ 위치 권한 없음 - 사용자가 버튼을 클릭해야 함');
          }
        }).catch(() => {
          console.log('⚠️ 권한 API 사용 불가 - 자동 조회 스킵');
        });
      }
    }
  }, [isSdkReady]);

  // 자동 현재 위치 가져오기 함수 (페이지 로드 시 실행)
  const handleAutoFetchCurrentLocation = () => {
    if (!isSdkReady) {
      console.log('SDK가 아직 준비되지 않음');
      return;
    }

    if (!navigator.geolocation) {
      console.log('위치 정보가 지원되지 않음');
      return;
    }

    setIsAutoLocating(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 자동 조회시에는 타임아웃을 짧게
      maximumAge: 300000
    };

    console.log('자동 Geolocation 요청 시작...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('자동 위치 획득 성공:', latitude, longitude);
        
        try {
          const geocoder = new window.kakao.maps.services.Geocoder();

          geocoder.coord2Address(longitude, latitude, (result: KakaoAddressResult[], status: string) => {
            console.log('자동 Geocoding 결과:', status, result);
            
            if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
              const addressData = result[0];
              console.log('자동 주소 데이터:', addressData);
              
              // 지번 주소를 우선으로 사용 (행정동 정보가 더 정확함)
              let primaryAddress = '';
              
              if (addressData.address && addressData.address.address_name) {
                primaryAddress = addressData.address.address_name;
                console.log('자동 지번 주소 사용:', primaryAddress);
              } else if (addressData.road_address && addressData.road_address.address_name) {
                primaryAddress = addressData.road_address.address_name;
                console.log('자동 도로명 주소 사용:', primaryAddress);
              }

              if (primaryAddress) {
                // 주소에서 동 정보 추출
                console.log('자동 원본 주소:', primaryAddress);
                const formatted = formatAddressForDong(primaryAddress);
                console.log('자동 포맷팅된 주소:', formatted);
                
                if (formatted.display) {
                  
                  setMyNeighborhood(formatted);
                  
                  // 근처 지역 검색을 위해 Places 검색 사용
                  const ps = new window.kakao.maps.services.Places();
                  
                  // 주변 지역을 키워드 검색으로 찾기 (구/군 단위로 검색)
                  const addressParts = formatted.display.split(' ');
                  const searchQuery = addressParts.length >= 2 ? `${addressParts[1]} 동` : `${addressParts[0]} 동`;
                  console.log('자동 근처 지역 검색:', searchQuery);
                  
                  ps.keywordSearch(searchQuery, (data: KakaoPlace[], catStatus: string) => {
                    console.log('자동 근처 지역 검색 결과:', catStatus, data);
                    
                    if (catStatus === window.kakao.maps.services.Status.OK && data.length > 0) {
                      const nearbyFormatted = data
                        .filter(place => {
                          // 행정동인지 확인
                          const placeName = place.place_name || '';
                          const placeAddress = place.address_name || '';
                          
                          // 동으로 끝나는 장소만 필터링
                          return /[동읍면]$/.test(placeName) || /[동읍면]/.test(placeAddress);
                        })
                        .map(place => {
                          const placeAddress = place.address_name || '';
                          return formatAddressForDong(placeAddress);
                        })
                        .filter(location => 
                          location && 
                          location.isDong && // 동 단위인 것만
                          location.display !== formatted.display && // 현재 위치와 다른 것만
                          location.display.includes(addressParts[0]) && // 같은 시/도
                          (addressParts.length >= 2 ? location.display.includes(addressParts[1]) : true) // 같은 구/군
                        )
                        .filter((location, index, arr) => 
                          // 중복 제거
                          arr.findIndex(l => l && l.display === location!.display) === index
                        )
                        .slice(0, 9);
                      
                      console.log('자동 필터링된 근처 지역:', nearbyFormatted);
                      setNearbyLocations(nearbyFormatted);
                    } else {
                      // 검색 결과가 없으면 빈 배열 설정
                      setNearbyLocations([]);
                    }
                    setIsAutoLocating(false);
                  }, { 
                    location: new window.kakao.maps.LatLng(latitude, longitude), 
                    radius: 5000 // 5km로 확장
                  });
                } else {
                  console.error('자동 주소 파싱 실패:', primaryAddress);
                  setIsAutoLocating(false);
                }
              } else {
                console.error('자동 주소 정보 없음');
                setIsAutoLocating(false);
              }
            } else {
              console.error('자동 Geocoding 실패:', status);
              setIsAutoLocating(false);
            }
          });
        } catch (error) {
          console.error('자동 Geocoding 오류:', error);
          setIsAutoLocating(false);
        }
      },
      (geoError) => {
        console.log('자동 Geolocation 오류 (무시됨):', geoError);
        // 자동 조회 실패는 조용히 처리 (에러 메시지 표시하지 않음)
        setIsAutoLocating(false);
      },
      options
    );
  };

  // 검색어 기반 장소 검색 (동 단위만 필터링)
  const searchPlaces = useCallback((term: string) => {
    if (!isSdkReady || !term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const ps = new window.kakao.maps.services.Places();
      
      // 먼저 일반 키워드 검색
      ps.keywordSearch(term, (data: KakaoPlace[], status: string) => {
        console.log(`🔍 "${term}" 검색 결과:`, status, data.length, '개');
        console.log('검색된 장소들:', data.map(p => ({ name: p.place_name, address: p.address_name, road: p.road_address_name })));
        
        if (status === window.kakao.maps.services.Status.OK) {
          const processedResults = data
            .filter(place => {
              // 1. 동네인지 확인
              const isNeighborhood = isNeighborhoodPlace(place);
              console.log(`🏘️ ${place.place_name} 동네인가?`, isNeighborhood);
              if (!isNeighborhood) return false;
              
              // 2. 주소에서 동 단위 추출 가능한지 확인
              const roadAddress = place.road_address_name || '';
              const jibunAddress = place.address_name || '';
              
              const roadFormatted = formatAddressForDong(roadAddress);
              const jibunFormatted = formatAddressForDong(jibunAddress);
              
              console.log(`🗺️ ${place.place_name} 주소 분석:`, {
                jibun: jibunAddress,
                road: roadAddress,
                jibunFormatted,
                roadFormatted
              });
              
              return roadFormatted.isDong || jibunFormatted.isDong;
            })
            .map(place => {
              // 지번 주소를 우선으로 사용 (행정동 정보가 더 정확함)
              const jibunAddress = place.address_name || '';
              const roadAddress = place.road_address_name || '';
              
              const jibunFormatted = formatAddressForDong(jibunAddress);
              const roadFormatted = formatAddressForDong(roadAddress);
              
              // 동 단위가 추출되는 주소를 우선 사용 (지번 주소 우선)
              const primaryFormatted = jibunFormatted.isDong ? jibunFormatted : roadFormatted;
              
              return {
                id: place.id,
                display: primaryFormatted.display,
                full: primaryFormatted.full,
                name: place.place_name
              };
            })
            // 중복 제거 (동 단위로 그룹핑)
            .filter((place, index, arr) => 
              arr.findIndex(p => p.display === place.display) === index
            );
          
          console.log('🎯 최종 처리된 결과:', processedResults);
          
          // 추가 검색 수행 (더 넓은 범위로 검색)
          if (term.length >= 2) {
            const searchQueries = [];
            
            // 1. "동" 키워드 추가 검색
            if (!term.includes('동')) {
              searchQueries.push(`${term}동`);
            }
            
            // 2. 주요 시/군 + 검색어 조합 (화성시 오산동 등을 찾기 위해)
            const majorCities = ['경기 화성시', '경기 수원시', '경기 용인시', '경기 성남시', '경기 안양시'];
            majorCities.forEach(city => {
              if (!term.includes('동')) {
                searchQueries.push(`${city} ${term}동`);
              } else {
                searchQueries.push(`${city} ${term}`);
              }
            });
            
            console.log('🔍 추가 검색 쿼리들:', searchQueries);
            
            let additionalResults: typeof processedResults = [];
            let completedSearches = 0;
            
            const handleAdditionalSearch = () => {
              completedSearches++;
              if (completedSearches === searchQueries.length) {
                // 모든 추가 검색 완료
                const combinedResults = [...processedResults, ...additionalResults]
                  .filter((place, index, arr) => 
                    arr.findIndex(p => p.display === place.display) === index
                  );
                
                console.log('🎯 모든 검색 완료 후 최종 결과:', combinedResults);
                setSearchResults(combinedResults);
              }
            };
            
            searchQueries.forEach(query => {
              ps.keywordSearch(query, (dongData: KakaoPlace[], dongStatus: string) => {
                console.log(`🔍 "${query}" 추가 검색 결과:`, dongStatus, dongData.length, '개');
                
                if (dongStatus === window.kakao.maps.services.Status.OK) {
                  const queryResults = dongData
                    .filter(place => isNeighborhoodPlace(place))
                    .map(place => {
                      const jibunAddress = place.address_name || '';
                      const roadAddress = place.road_address_name || '';
                      
                      const jibunFormatted = formatAddressForDong(jibunAddress);
                      const roadFormatted = formatAddressForDong(roadAddress);
                      
                      const primaryFormatted = jibunFormatted.isDong ? jibunFormatted : roadFormatted;
                      
                      return {
                        id: `${query}-${place.id}`,
                        display: primaryFormatted.display,
                        full: primaryFormatted.full,
                        name: place.place_name
                      };
                    })
                    .filter(place => 
                      // 이미 있는 결과와 중복되지 않는 것만 추가
                      !processedResults.some(existing => existing.display === place.display) &&
                      !additionalResults.some(existing => existing.display === place.display)
                    );
                  
                  additionalResults = [...additionalResults, ...queryResults];
                  console.log(`"${query}" 검색에서 추가된 결과:`, queryResults);
                }
                
                handleAdditionalSearch();
              });
            });
          } else {
            setSearchResults(processedResults);
          }
        } else {
          setSearchResults([]);
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [isSdkReady]);

  // 검색어 디바운싱
  useEffect(() => {
    const handler = setTimeout(() => {
      searchPlaces(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchPlaces]);

  // 동네 선택 핸들러
  const handleLocationSelect = (location: string) => {
    const existingLocations = quoteData.locations || [];
    
    if (existingLocations.length < 2 && !existingLocations.includes(location)) {
      const newLocations = [...existingLocations, location];
      // Context에 데이터 저장
      updateQuoteData({ locations: newLocations });
    }
    
    // step7으로 돌아가기 (URL 파라미터 없이)
    router.push('/quote/mobile/step7');
  };

  // 수동 현재 위치 불러오기 핸들러 (버튼 클릭 시)
  const handleManualFetchCurrentLocation = () => {
    if (!isSdkReady) {
      setError("지도 서비스가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 모바일 앱(WebView) 환경에서는 네이티브 위치 정보 사용
    if (isWebView) {
      console.log('📱 모바일 앱 환경 - 네이티브 위치 정보 요청');
      console.log('🔍 window.ReactNativeWebView 존재:', !!window.ReactNativeWebView);
      setIsLoading(true);
      setError(null);
      setSearchTerm(''); 
      setSearchResults([]);
      setMyNeighborhood(null);
      setNearbyLocations([]);
      
      // React Native로 위치 정보 요청 메시지 전송
      if (window.ReactNativeWebView) {
        const message = JSON.stringify({
          type: 'request-native-location'
        });
        console.log('📤 React Native로 메시지 전송:', message);
        window.ReactNativeWebView.postMessage(message);
      } else {
        console.error('❌ window.ReactNativeWebView가 없습니다!');
        setError('모바일 앱과 통신할 수 없습니다.');
        setIsLoading(false);
      }
      return;
    }

    // 일반 브라우저 환경에서는 기존 Geolocation API 사용
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchTerm(''); 
    setSearchResults([]);
    setMyNeighborhood(null);
    setNearbyLocations([]);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    };

    console.log('수동 Geolocation 요청 시작...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('수동 위치 획득 성공:', latitude, longitude);
        
        try {
          const geocoder = new window.kakao.maps.services.Geocoder();

          geocoder.coord2Address(longitude, latitude, (result: KakaoAddressResult[], status: string) => {
            console.log('수동 Geocoding 결과:', status, result);
            
            if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
              const addressData = result[0];
              console.log('수동 주소 데이터:', addressData);
              
              // 지번 주소를 우선으로 사용 (행정동 정보가 더 정확함)
              let primaryAddress = '';
              
              if (addressData.address && addressData.address.address_name) {
                primaryAddress = addressData.address.address_name;
                console.log('수동 지번 주소 사용:', primaryAddress);
              } else if (addressData.road_address && addressData.road_address.address_name) {
                primaryAddress = addressData.road_address.address_name;
                console.log('수동 도로명 주소 사용:', primaryAddress);
              }

              if (primaryAddress) {
                // 주소에서 동 정보 추출
                console.log('수동 원본 주소:', primaryAddress);
                const formatted = formatAddressForDong(primaryAddress);
                console.log('수동 포맷팅된 주소:', formatted);
                
                if (formatted.display) {
                  
                  setMyNeighborhood(formatted);
                  
                  // 근처 지역 검색을 위해 Places 검색 사용
                  const ps = new window.kakao.maps.services.Places();
                  
                  // 주변 지역을 키워드 검색으로 찾기 (구/군 단위로 검색)
                  const addressParts = formatted.display.split(' ');
                  const searchQuery = addressParts.length >= 2 ? `${addressParts[1]} 동` : `${addressParts[0]} 동`;
                  console.log('수동 근처 지역 검색:', searchQuery);
                  
                  ps.keywordSearch(searchQuery, (data: KakaoPlace[], catStatus: string) => {
                    console.log('수동 근처 지역 검색 결과:', catStatus, data);
                    
                    if (catStatus === window.kakao.maps.services.Status.OK && data.length > 0) {
                      const nearbyFormatted = data
                        .filter(place => {
                          // 행정동인지 확인
                          const placeName = place.place_name || '';
                          const placeAddress = place.address_name || '';
                          
                          // 동으로 끝나는 장소만 필터링
                          return /[동읍면]$/.test(placeName) || /[동읍면]/.test(placeAddress);
                        })
                        .map(place => {
                          const placeAddress = place.address_name || '';
                          return formatAddressForDong(placeAddress);
                        })
                        .filter(location => 
                          location && 
                          location.isDong && // 동 단위인 것만
                          location.display !== formatted.display && // 현재 위치와 다른 것만
                          location.display.includes(addressParts[0]) && // 같은 시/도
                          (addressParts.length >= 2 ? location.display.includes(addressParts[1]) : true) // 같은 구/군
                        )
                        .filter((location, index, arr) => 
                          // 중복 제거
                          arr.findIndex(l => l && l.display === location!.display) === index
                        )
                        .slice(0, 9);
                      
                      console.log('수동 필터링된 근처 지역:', nearbyFormatted);
                      setNearbyLocations(nearbyFormatted);
                    } else {
                      // 검색 결과가 없으면 빈 배열 설정
                      setNearbyLocations([]);
                    }
                    setIsLoading(false);
                  }, { 
                    location: new window.kakao.maps.LatLng(latitude, longitude), 
                    radius: 5000 // 5km로 확장
                  });
                } else {
                  console.error('수동 주소 파싱 실패:', primaryAddress);
                  setError("주소 형식을 인식할 수 없습니다.");
                  setIsLoading(false);
                }
              } else {
                console.error('수동 주소 정보 없음');
                setError("주소 정보를 처리할 수 없습니다.");
                setIsLoading(false);
              }
            } else {
              console.error('수동 Geocoding 실패:', status);
              setError("현재 주소를 가져오지 못했습니다. 다시 시도해주세요.");
              setIsLoading(false);
            }
          });
        } catch (error) {
          console.error('수동 Geocoding 오류:', error);
          setError("주소 변환 중 오류가 발생했습니다.");
          setIsLoading(false);
        }
      },
      (geoError) => {
        console.error('수동 Geolocation 오류:', geoError);
        let errorMessage = '위치 정보를 가져오는 중 오류가 발생했습니다.';
        
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = '현재 위치 정보를 사용할 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.';
            break;
          case geoError.TIMEOUT:
            errorMessage = '위치 정보를 가져오는 데 시간이 초과되었습니다. 다시 시도해주세요.';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      options
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
                placeholder="동 이름으로 검색 (예: 역삼동, 강남)"
                className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button 
              onClick={handleManualFetchCurrentLocation} 
              disabled={isLoading || !isSdkReady} 
              className="w-full flex items-center justify-center text-blue-600 font-semibold py-3 mt-2 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isLoading ? '위치 찾는 중...' : (isSdkReady ? '현재 위치 불러오기' : '지도 서비스 로딩 중...')}
            </button>
          </div>
          
          <div className="mt-4">
            {/* 자동 위치 조회 로딩 상태 */}
            {isAutoLocating && (
              <div className="py-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                현재 위치를 자동으로 가져오는 중...
              </div>
            )}
            
            {/* 수동 로딩 상태 */}
            {isLoading && (
              <div className="py-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                위치 정보를 불러오는 중...
              </div>
            )}
            
            {/* 에러 상태 */}
            {error && (
              <div className="py-4 px-4 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
                >
                  페이지 새로고침
                </button>
              </div>
            )}
            
            {/* 검색 결과 표시 */}
            {searchResults.length > 0 && !isLoading && !isAutoLocating && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">검색 결과</h3>
                <ul className="divide-y divide-gray-200">
                  {searchResults.map(place => (
                    <li 
                      key={place.id} 
                      onClick={() => handleLocationSelect(place.display)} 
                      className="py-3 px-1 cursor-pointer hover:bg-gray-50 rounded"
                    >
                      <p className="font-medium text-gray-900">{place.display}</p>
                      {place.full !== place.display && (
                        <p className="text-xs text-gray-400">{place.full}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 현재 위치 결과 표시 */}
            {myNeighborhood && !isLoading && !isAutoLocating && !error && searchResults.length === 0 && (
              <>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">우리동네</h3>
                  <div 
                    onClick={() => handleLocationSelect(myNeighborhood.display)} 
                    className="py-3 px-2 cursor-pointer hover:bg-blue-50 rounded font-medium text-blue-600"
                  >
                    📍 {myNeighborhood.display}
                  </div>
                </div>
                
                {nearbyLocations.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">근처동네</h3>
                    <ul className="divide-y divide-gray-200">
                      {nearbyLocations.map((location, index) => (
                        <li 
                          key={`${location.display}-${index}`} 
                          onClick={() => handleLocationSelect(location.display)} 
                          className="py-3 px-2 cursor-pointer hover:bg-gray-50 rounded"
                        >
                          {location.display}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* 초기 상태 메시지 */}
            {!isLoading && !isAutoLocating && !error && !myNeighborhood && searchResults.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-4">🏘️</div>
                <p>동 이름을 검색하거나<br/>현재 위치를 불러와주세요.</p>
                <p className="text-xs mt-2">예: 역삼동, 강남, 홍대</p>
                {!isSdkReady && (
                  <p className="text-xs mt-2 text-yellow-600">
                    지도 서비스 로딩 중...
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}