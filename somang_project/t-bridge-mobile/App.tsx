import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Linking, Platform, BackHandler } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Location from 'expo-location';
import { supabase } from './src/lib/supabase';

function AppContent() {
  const [user, setUser] = React.useState<any>(null);  
  const [webUrl, setWebUrl] = React.useState<string>('http://192.168.0.123:50331/login'); // HTTP로 다시 변경 (SSL 인증서 문제)
  const insets = useSafeAreaInsets();
  const webViewRef = React.useRef<WebView>(null);

  // 네이티브 위치 정보 요청 처리 함수
  const handleLocationRequest = async () => {
    try {
      console.log('📍 네이티브 위치 정보 요청 시작...');
      console.log('📍 Location 모듈 상태:', !!Location);
      
      // 현재 권한 상태 확인
      let { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      console.log('📍 현재 권한 상태:', existingStatus);
      
      let finalStatus = existingStatus;
      
      // 권한이 없으면 요청
      if (existingStatus !== 'granted') {
        console.log('📍 위치 권한 요청 중...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
        console.log('📍 권한 요청 결과:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.error('❌ 위치 권한이 거부되었습니다');
        
        // WebView에 에러 메시지 전송
        const errorScript = `
          (function() {
            console.log('❌ 네이티브에서 위치 권한 거부됨');
            
            // 메시지 이벤트 직접 발생시키기
            const event = new MessageEvent('message', {
              data: {
                type: 'native-location-error',
                error: '위치 권한이 거부되었습니다. 앱 설정에서 위치 권한을 허용해주세요.'
              }
            });
            
            window.dispatchEvent(event);
            
            // 백업용 - postMessage도 함께 호출
            if (window.postMessage) {
              window.postMessage({
                type: 'native-location-error',
                error: '위치 권한이 거부되었습니다. 앱 설정에서 위치 권한을 허용해주세요.'
              }, '*');
            }
            
            console.log('❌ 네이티브 위치 권한 오류 전송 완료');
          })();
        `;
        webViewRef.current?.injectJavaScript(errorScript);
        return;
      }

      console.log('✅ 위치 권한 획득, 현재 위치 조회 시작...');
      
      // 현재 위치 조회
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const { latitude, longitude } = location.coords;
      console.log('📍 네이티브 위치 조회 성공:', latitude, longitude);

      // WebView에 위치 정보 전송 및 직접 처리
      const locationScript = `
        (function() {
          console.log('🚀 JavaScript 실행 시작 - 위치 정보 전송');
          console.log('📍 네이티브 → WebView 위치 정보 전송:', ${latitude}, ${longitude});
          
          // React Native 통신 확인
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'debug', 
              message: 'JavaScript 주입 실행됨 - 위치: ' + ${latitude} + ', ' + ${longitude}
            }));
          }
          
          // 직접 카카오 API 호출해서 주소 변환 시도
          const processLocationDirectly = async () => {
            try {
              console.log('🗺️ 카카오 API 직접 호출 시작');
              
              // React 컴포넌트의 함수가 있으면 먼저 시도 (더 안정적)
              if (typeof window.processLocationCoordinates === 'function') {
                console.log('🚀 React processLocationCoordinates 함수 우선 호출');
                window.processLocationCoordinates(${latitude}, ${longitude});
                return; // React 함수가 성공적으로 호출되면 여기서 종료
              }
              
              console.log('⚠️ React 함수 없음 - 직접 카카오 SDK 로드 시도');
              
              // 카카오 SDK 강제 로드 (React 컴포넌트가 실패한 경우)
              const loadKakaoSDK = () => {
                return new Promise((resolve, reject) => {
                  // 이미 있으면 바로 사용
                  if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                    resolve(true);
                    return;
                  }
                  
                  // 스크립트가 없으면 추가
                  if (!document.getElementById('kakao-maps-sdk')) {
                    const script = document.createElement('script');
                    script.id = 'kakao-maps-sdk';
                    script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=2fe616056f4156a5ba0e3260f3f4c7b0&libraries=services&autoload=false';
                    script.async = false;
                    
                    script.onload = () => {
                      if (window.kakao && window.kakao.maps) {
                        window.kakao.maps.load(() => {
                          if (window.kakao.maps.services) {
                            resolve(true);
                          } else {
                            reject(new Error('Services not loaded'));
                          }
                        });
                      } else {
                        reject(new Error('Kakao maps not loaded'));
                      }
                    };
                    
                    script.onerror = () => reject(new Error('Script load failed'));
                    document.head.appendChild(script);
                  }
                });
              };
              
              // SDK 로드 시도
              await loadKakaoSDK();
              console.log('✅ 카카오 SDK 강제 로드 완료');
              
              // React 컴포넌트에 SDK 준비 상태 알림
              if (typeof window.setSdkReady === 'function') {
                window.setSdkReady(true);
              }
              
              // Kakao Maps SDK가 로드될 때까지 대기
              let attempts = 0;
              const maxAttempts = 30; // 3초 대기
              
              const waitForKakao = () => {
                return new Promise((resolve, reject) => {
                  const checkKakao = () => {
                    attempts++;
                    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                      console.log('✅ 카카오 SDK 발견됨');
                      resolve(true);
                    } else if (attempts >= maxAttempts) {
                      console.log('❌ 카카오 SDK 대기 시간 초과');
                      reject(new Error('Kakao SDK timeout'));
                    } else {
                      console.log('⏳ 카카오 SDK 대기 중... (' + attempts + '/' + maxAttempts + ')');
                      setTimeout(checkKakao, 100);
                    }
                  };
                  checkKakao();
                });
              };
              
              await waitForKakao();
              
              console.log('🗺️ 카카오 Geocoder 생성');
              const geocoder = new window.kakao.maps.services.Geocoder();
              
              geocoder.coord2Address(${longitude}, ${latitude}, (result, status) => {
                console.log('🗺️ 카카오 Geocoding 결과:', status, result);
                
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                  const addressData = result[0];
                  let primaryAddress = '';
                  
                  if (addressData.address && addressData.address.address_name) {
                    primaryAddress = addressData.address.address_name;
                  } else if (addressData.road_address && addressData.road_address.address_name) {
                    primaryAddress = addressData.road_address.address_name;
                  }
                  
                  console.log('🎉 주소 변환 성공:', primaryAddress);
                  
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'debug',
                      message: '주소 변환 성공: ' + primaryAddress
                    }));
                  }
                  
                  // React 컴포넌트의 함수들 직접 호출
                  if (typeof window.processLocationCoordinates === 'function') {
                    console.log('🚀 React processLocationCoordinates 함수 직접 호출');
                    window.processLocationCoordinates(${latitude}, ${longitude});
                  } else {
                    console.log('❌ processLocationCoordinates 함수 없음');
                    
                    // 함수가 없으면 DOM 조작으로 fallback
                    setTimeout(() => {
                      // 로딩 상태 해제
                      if (typeof window.setLocationLoading === 'function') {
                        window.setLocationLoading(false);
                      }
                      
                      const loadingButtons = document.querySelectorAll('button');
                      loadingButtons.forEach(btn => {
                        if (btn.textContent && btn.textContent.includes('위치 찾는 중')) {
                          btn.textContent = '현재 위치 불러오기';
                          btn.disabled = false;
                        }
                      });
                      
                      // 로딩 스피너 제거
                      const spinners = document.querySelectorAll('[class*="animate-spin"]');
                      spinners.forEach(spinner => {
                        const parent = spinner.closest('div');
                        if (parent && parent.textContent && parent.textContent.includes('위치')) {
                          parent.style.display = 'none';
                        }
                      });
                    }, 500);
                  }
                  
                } else {
                  console.error('❌ 카카오 Geocoding 실패:', status);
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'debug',
                      message: '주소 변환 실패: ' + status
                    }));
                  }
                  
                  // 실패 시 에러 상태로 변경
                  if (typeof window.setLocationError === 'function') {
                    window.setLocationError('주소 변환에 실패했습니다. 다시 시도해주세요.');
                  } else {
                    setTimeout(() => {
                      const loadingButtons = document.querySelectorAll('button');
                      loadingButtons.forEach(btn => {
                        if (btn.textContent && btn.textContent.includes('위치 찾는 중')) {
                          btn.textContent = '현재 위치 불러오기';
                          btn.disabled = false;
                        }
                      });
                    }, 500);
                  }
                }
              });
              
            } catch (error) {
              console.error('❌ 직접 카카오 API 호출 오류:', error);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug',
                  message: '직접 API 호출 오류: ' + error.message
                }));
              }
              
              // 오류 시 상태 복구
              if (typeof window.setLocationError === 'function') {
                window.setLocationError('위치 정보 처리 중 오류가 발생했습니다.');
              } else {
                setTimeout(() => {
                  const loadingButtons = document.querySelectorAll('button');
                  loadingButtons.forEach(btn => {
                    if (btn.textContent && btn.textContent.includes('위치 찾는 중')) {
                      btn.textContent = '현재 위치 불러오기';
                      btn.disabled = false;
                    }
                  });
                }, 500);
              }
            }
          };
          
          // 직접 처리 시작
          processLocationDirectly();
          
          // 기존 메시지 전송 방법들도 유지
          try {
            // 방법 1: MessageEvent 직접 발생
            console.log('📍 방법 1: MessageEvent 직접 발생');
            const event = new MessageEvent('message', {
              data: {
                type: 'native-location-success',
                latitude: ${latitude},
                longitude: ${longitude}
              }
            });
            window.dispatchEvent(event);
            console.log('📍 방법 1 완료');
            
            // 방법 2: postMessage 사용
            console.log('📍 방법 2: postMessage 사용');
            if (window.postMessage) {
              window.postMessage({
                type: 'native-location-success',
                latitude: ${latitude},
                longitude: ${longitude}
              }, '*');
              console.log('📍 방법 2 완료');
            }
            
            // 방법 3: 글로벌 변수로 전달
            console.log('📍 방법 3: 글로벌 변수 설정');
            window.__NATIVE_LOCATION_DATA__ = {
              type: 'native-location-success',
              latitude: ${latitude},
              longitude: ${longitude}
            };
            
            // 방법 4: document 이벤트
            console.log('📍 방법 4: document 이벤트');
            const docEvent = new MessageEvent('message', {
              data: {
                type: 'native-location-success',
                latitude: ${latitude},
                longitude: ${longitude}
              }
            });
            document.dispatchEvent(docEvent);
            console.log('📍 방법 4 완료');
            
          } catch (error) {
            console.error('❌ 메시지 전송 오류:', error);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug',
                message: '메시지 전송 오류: ' + error.message
              }));
            }
          }
          
          console.log('✅ JavaScript 실행 완료');
        })();
      `;
      console.log('📍 JavaScript 주입 시작');
      webViewRef.current?.injectJavaScript(locationScript);
      console.log('📍 JavaScript 주입 완료');

    } catch (error) {
      console.error('❌ 네이티브 위치 조회 실패:', error);
      console.error('❌ 오류 타입:', typeof error);
      console.error('❌ 오류 상세:', JSON.stringify(error, null, 2));
      
      let errorMessage = '알 수 없는 오류';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      // WebView에 에러 메시지 전송
      const errorScript = `
        (function() {
          console.error('❌ 네이티브 위치 오류:', '${errorMessage}');
          
          // 메시지 이벤트 직접 발생시키기
          const event = new MessageEvent('message', {
            data: {
              type: 'native-location-error',
              error: '위치 정보를 가져오는 중 오류가 발생했습니다: ${errorMessage}'
            }
          });
          
          window.dispatchEvent(event);
          
          // 백업용 - postMessage도 함께 호출
          if (window.postMessage) {
            window.postMessage({
              type: 'native-location-error',
              error: '위치 정보를 가져오는 중 오류가 발생했습니다: ${errorMessage}'
            }, '*');
          }
          
          console.log('❌ 네이티브 위치 일반 오류 전송 완료');
        })();
      `;
      webViewRef.current?.injectJavaScript(errorScript);
    }
  };

  React.useEffect(() => {
    // 현재 세션 확인
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      console.log('현재 세션:', session?.user?.email || '로그인 안됨');
      
      // 로그인 상태에 따라 URL 변경 (WebView는 계속 유지)
      if (session?.user) {
        console.log('로그인된 사용자 - 메인 페이지로 이동');
        setWebUrl('http://192.168.0.123:50331/');
      } else {
        console.log('로그인 안됨 - 로그인 페이지 유지');
        setWebUrl('http://192.168.0.123:50331/login');
      }
    };
    
    checkSession();

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      console.log('세션 변경:', session?.user?.email || '로그아웃됨');
      
      // 세션 변경 시 URL 업데이트
      if (session?.user) {
        console.log('로그인 성공 - 메인 페이지로 이동');
        setWebUrl('http://192.168.0.123:50331/');
      } else {
        console.log('로그아웃 - 로그인 페이지로 이동');
        setWebUrl('http://192.168.0.123:50331/login');
      }
    });

    // 앱이 포그라운드로 돌아올 때 세션 체크
    const interval = setInterval(checkSession, 1000); // 1초마다 체크

    // Deep Link 리스너
    const urlHandler = ({ url }: { url: string }) => {
      console.log('Deep Link 받음:', url);
      if (url.includes('auth/callback')) {
        // URL에서 세션 정보 추출
        const fragment = url.split('#')[1];
        if (fragment) {
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Deep Link에서 토큰 발견');
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    };

    // URL 리스너 등록
    const urlSubscription = Linking.addEventListener('url', urlHandler);

    // Android 뒤로가기 버튼 처리
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true; // 기본 뒤로가기 동작 차단
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      urlSubscription.remove();
      backHandler.remove();
    };
  }, []);

  // 완전한 WebView 앱 - 네이티브 화면 없음
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: webUrl }}
        style={[styles.webview, {
          marginTop: Platform.OS === 'android' ? 0 : 0, // SafeAreaView가 처리
          marginBottom: Platform.OS === 'android' ? 0 : 0, // SafeAreaView가 처리
        }]}
        originWhitelist={['*']}
        // 외부 링크 처리 - 카카오 로그인도 WebView 내부에서 처리
        onShouldStartLoadWithRequest={(request) => {
          console.log('요청 URL:', request.url);
          
          // 모든 요청을 WebView에서 처리 (완전한 웹앱 경험)
          return true;
        }}
        // iOS에서 SSL 오류 무시
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // SSL 인증서 무시 및 보안 설정
        mixedContentMode={'always'}
        // 쿠키 및 세션 저장 허용
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        // 캐시 설정 - 개발 중에는 항상 새로고침
        cacheEnabled={false}
        incognito={false}
        // 추가 보안 설정 무시
        allowFileAccess={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView 에러:', nativeEvent);
          // SSL 오류가 아닌 다른 오류만 처리
          if (nativeEvent.code !== 3 && !nativeEvent.description?.includes('SSL')) {
            console.error('WebView 치명적 에러:', nativeEvent);
            Alert.alert('연결 오류', '웹 페이지를 로드할 수 없습니다. 네트워크 연결을 확인해주세요.');
          }
        }}
        onLoadStart={(event) => {
          console.log('WebView 로딩 시작:', event.nativeEvent.url);
        }}
        onLoadEnd={(event) => {
          console.log('WebView 로딩 완료:', event.nativeEvent.url);
        }}
        injectedJavaScript={`
          (function() {
            console.log('🟢 WebView JavaScript 초기화 - 버전 3.0 (위치 정보 지원)');
            
            // React Native WebView 존재 확인
            if (window.ReactNativeWebView) {
              console.log('✅ ReactNativeWebView 인터페이스 발견');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug',
                message: 'WebView 초기화 완료 - 네이티브 통신 준비됨'
              }));
            } else {
              console.error('❌ ReactNativeWebView 인터페이스 없음');
            }
            
            let lastTokenSent = null;
            let checkCount = 0;
            
            // 세션 체크 함수
            const checkSession = () => {
              try {
                checkCount++;
                
                // 로그를 React Native로 전송
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug',
                  message: '🔍 세션 체크 #' + checkCount
                }));
                
                // 현재 URL과 localStorage 상태 로깅
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug',
                  message: '🌐 현재 URL: ' + window.location.href
                }));
                
                // 모든 localStorage 키들 확인
                const allKeys = Object.keys(localStorage);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug',
                  message: '🗂️ localStorage 키들: ' + JSON.stringify(allKeys)
                }));
                
                // user-token 상세 확인
                const userToken = localStorage.getItem('user-token');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug',
                  message: '🔑 user-token 존재: ' + (userToken ? 'YES' : 'NO')
                }));
                
                if (userToken) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    message: '🔑 user-token 길이: ' + userToken.length
                  }));
                  
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    message: '🔑 user-token 미리보기: ' + userToken.substring(0, 200) + '...'
                  }));
                }
                
                if (userToken) {
                  try {
                    const tokenData = JSON.parse(userToken);
                    console.log('🔑 파싱된 토큰 데이터 전체:', tokenData);
                    console.log('🔑 토큰 데이터 구조:', {
                      type: typeof tokenData,
                      keys: Object.keys(tokenData || {}),
                      hasCurrentSession: !!tokenData.currentSession,
                      hasAccessToken: !!(tokenData.currentSession?.access_token),
                      expiresAt: tokenData.currentSession?.expires_at
                    });
                    
                    // 토큰이 있고 이전에 보낸 것과 다르면 전송
                    if (userToken !== lastTokenSent) {
                      console.log('📤 새로운 세션 토큰을 React Native로 전송');
                      lastTokenSent = userToken;
                      
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'user-token',
                        data: userToken
                      }));
                    }
                  } catch (parseError) {
                    console.error('🔴 토큰 파싱 에러:', parseError);
                    console.log('🔴 파싱 실패한 원본 데이터:', userToken);
                  }
                } else {
                  console.log('🔑 user-token이 localStorage에 없음');
                }
                
              } catch (error) {
                console.error('🔴 세션 체크 에러:', error);
              }
            };
            
            // 초기 체크 (즉시)
            checkSession();
            
            // 1초 후 체크
            setTimeout(checkSession, 1000);
            
            // 3초 후 체크  
            setTimeout(checkSession, 3000);
            
            // 주기적 체크 (5초마다)
            const interval = setInterval(checkSession, 5000);
            
            // 페이지 언로드 시 정리
            window.addEventListener('beforeunload', () => {
              clearInterval(interval);
            });
            
            console.log('✅ WebView JavaScript 설정 완료');
          })();
        `}
        onMessage={async (event) => {
          try {
            console.log('📨 WebView 원본 메시지:', event.nativeEvent.data);
            const message = JSON.parse(event.nativeEvent.data);
            console.log('📨 파싱된 메시지:', message);
            
            if (message.type === 'debug') {
              console.log('🐛 Debug:', message.message);
              return;
            }
            
            // 네이티브 위치 정보 요청 처리
            if (message.type === 'request-native-location') {
              console.log('📍 네이티브 위치 정보 요청 받음');
              console.log('🔍 handleLocationRequest 함수 타입:', typeof handleLocationRequest);
              console.log('🔍 Location 모듈 존재:', !!Location);
              
              // 즉시 응답을 보내서 통신이 작동하는지 확인
              const ackScript = `
                (function() {
                  console.log('✅ React Native가 위치 요청을 받았습니다');
                })();
              `;
              webViewRef.current?.injectJavaScript(ackScript);
              
              // handleLocationRequest 함수 호출
              await handleLocationRequest();
              return;
            }
            
            if (message.type === 'user-token' && message.data) {
              console.log('🔑 user-app 토큰 발견, 파싱 시도');
              
              try {
                const tokenData = JSON.parse(message.data);
                console.log('🔑 토큰 데이터 구조:', {
                  hasCurrentSession: !!tokenData?.currentSession,
                  hasAccessToken: !!(tokenData?.access_token || tokenData?.currentSession?.access_token),
                  hasRefreshToken: !!(tokenData?.refresh_token || tokenData?.currentSession?.refresh_token),
                  topLevelKeys: Object.keys(tokenData || {})
                });
                
                // 두 가지 구조 모두 지원
                let access_token, refresh_token;
                
                if (tokenData?.currentSession) {
                  // 예상 구조: currentSession 안에 토큰들
                  access_token = tokenData.currentSession.access_token;
                  refresh_token = tokenData.currentSession.refresh_token;
                  console.log('🔑 currentSession 구조 사용');
                } else if (tokenData?.access_token) {
                  // 실제 구조: 최상위 레벨에 토큰들
                  access_token = tokenData.access_token;
                  refresh_token = tokenData.refresh_token;
                  console.log('🔑 최상위 레벨 구조 사용');
                } else {
                  console.warn('⚠️ 알 수 없는 토큰 구조:', tokenData);
                }
                
                if (access_token && refresh_token) {
                  console.log('🚀 Supabase 세션 설정 중...', {
                    access_token_length: access_token.length,
                    refresh_token_length: refresh_token.length
                  });
                  
                  supabase.auth.setSession({
                    access_token,
                    refresh_token,
                  }).then((result) => {
                    console.log('✅ Supabase 세션 설정 완료:', result.error ? '실패' : '성공');
                    if (result.error) {
                      console.error('🔴 세션 설정 에러:', result.error);
                    }
                  }).catch((error) => {
                    console.error('🔴 세션 설정 실패:', error);
                  });
                } else {
                  console.warn('⚠️ access_token 또는 refresh_token이 없음');
                }
              } catch (parseError) {
                console.error('🔴 토큰 데이터 파싱 에러:', parseError);
              }
            }
          } catch (error) {
            console.error('🔴 메시지 파싱 에러:', error);
          }
        }}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
});