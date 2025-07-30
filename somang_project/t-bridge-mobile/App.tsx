import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Linking, Platform, BackHandler } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './src/lib/supabase';

function AppContent() {
  const [user, setUser] = React.useState<any>(null);  
  const [webUrl, setWebUrl] = React.useState<string>('http://192.168.0.123:50331/login'); // HTTP로 변경 (SSL 문제 회피)
  const insets = useSafeAreaInsets();
  const webViewRef = React.useRef<WebView>(null);

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
        androidHardwareAccelerationDisabled={true}
        mixedContentMode={'always'}  
        allowsUnsecureHttps={true}
        ignoreSslError={true}
        // 쿠키 및 세션 저장 허용
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        // 캐시 설정 - 개발 중에는 항상 새로고침
        cacheEnabled={false}
        incognito={false}
        // 추가 보안 설정 무시
        allowsProtectedMedia={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView 에러:', nativeEvent);
          // SSL 오류는 무시하고 계속 진행
          if (nativeEvent.code === 3 || nativeEvent.description.includes('SSL')) {
            console.log('SSL 오류 무시 - 계속 진행');
            // SSL 오류는 무시하고 계속 로드
            return;
          } else {
            console.error('WebView 치명적 에러:', nativeEvent);
            // 치명적 에러만 사용자에게 알림
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
            console.log('🟢 WebView JavaScript 초기화 - 버전 2.0');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'debug',
              message: 'JavaScript 실행됨!'
            }));
            
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
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log('📨 WebView 메시지 받음:', message.type);
            
            if (message.type === 'debug') {
              console.log('🐛 Debug:', message.message);
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