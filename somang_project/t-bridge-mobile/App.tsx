import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [currentView, setCurrentView] = React.useState<'native' | 'web'>('native');
  const [user, setUser] = React.useState<any>(null);
  const [authUrl, setAuthUrl] = React.useState<string>('');

  React.useEffect(() => {
    // 현재 세션 확인
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      console.log('현재 세션:', session?.user?.email || '로그인 안됨');
    };
    
    checkSession();

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      console.log('세션 변경:', session?.user?.email || '로그아웃됨');
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

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      urlSubscription.remove();
    };
  }, []);

  const handleKakaoLogin = async () => {
    try {
      console.log('카카오 로그인 시작...');
      
      // WebView로 user-app 로그인 페이지 열기
      setAuthUrl('http://localhost:50331/login?mobile=true');
      setCurrentView('web');
      
    } catch (err) {
      console.error('카카오 로그인 에러:', err);
      Alert.alert('에러', '로그인 중 오류가 발생했습니다.');
    }
  };

  if (currentView === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentView('native')}
          >
            <Text style={styles.backButtonText}>← 네이티브로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WebView 모드</Text>
        </View>
        
        <WebView
          source={{ uri: authUrl || 'https://bbxycbghbatcovzuiotu.supabase.co' }}
          style={styles.webview}
          originWhitelist={['*']}
          // Android에서 SSL 오류 무시
          onShouldStartLoadWithRequest={() => true}
          // iOS에서 SSL 오류 무시
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // 개발 환경에서 SSL 인증서 무시
          androidHardwareAccelerationDisabled={true}
          mixedContentMode={'always'}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView 에러:', nativeEvent);
            // SSL 오류는 무시하고 계속 진행
            if (nativeEvent.code === 3 || nativeEvent.description.includes('SSL')) {
              console.log('SSL 오류 무시');
            } else {
              Alert.alert('WebView 에러', '웹 페이지를 로드할 수 없습니다.');
            }
          }}
          onLoadStart={() => console.log('WebView 로딩 시작')}
          onLoadEnd={() => console.log('WebView 로딩 완료')}
          injectedJavaScript={`
            (function() {
              // localStorage에서 user-app 세션 체크
              setInterval(() => {
                const userToken = localStorage.getItem('user-token');
                if (userToken) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'user-token',
                    data: userToken
                  }));
                }
              }, 500);
              
              // 페이지 상태 체크
              const checkLoginStatus = () => {
                const isLoggedIn = window.location.pathname === '/' || window.location.pathname.includes('dashboard');
                if (isLoggedIn) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'login-success',
                    path: window.location.pathname
                  }));
                }
              };
              
              // 페이지 변경 감지
              let lastPath = window.location.pathname;
              setInterval(() => {
                if (window.location.pathname !== lastPath) {
                  lastPath = window.location.pathname;
                  checkLoginStatus();
                }
              }, 500);
            })();
          `}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data);
              console.log('WebView 메시지:', message.type);
              
              if (message.type === 'user-token' && message.data) {
                console.log('user-app 토큰 발견');
                const tokenData = JSON.parse(message.data);
                if (tokenData?.currentSession) {
                  const { access_token, refresh_token } = tokenData.currentSession;
                  supabase.auth.setSession({
                    access_token,
                    refresh_token,
                  }).then(() => {
                    setCurrentView('native');
                    Alert.alert('로그인 성공', '카카오 로그인이 완료되었습니다.');
                  });
                }
              } else if (message.type === 'login-success') {
                console.log('로그인 성공 감지:', message.path);
                // 로그인 성공 후 잠시 대기 후 네이티브로 돌아가기
                setTimeout(() => {
                  setCurrentView('native');
                }, 1000);
              }
            } catch (error) {
              console.error('메시지 파싱 에러:', error);
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>T-BRIDGE</Text>
        <Text style={styles.subtitle}>Mobile App Test</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          🚀 React Native + WebView 하이브리드 앱 테스트
        </Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userText}>✅ 로그인됨: {user.email}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleKakaoLogin}
        >
          <Text style={styles.buttonText}>🟡 카카오 로그인 (외부 브라우저)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.webButton]}
          onPress={() => {
            // HTTP로 WebView 열기
            setAuthUrl('http://localhost:50331/login?mobile=true');
            setCurrentView('web');
          }}
        >
          <Text style={styles.buttonText}>🌐 카카오 로그인 (앱 내 WebView)</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📱 테스트 기능</Text>
          <Text style={styles.infoText}>• 네이티브 카카오 로그인</Text>
          <Text style={styles.infoText}>• WebView 웹페이지 로드</Text>
          <Text style={styles.infoText}>• Supabase 연동</Text>
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 55,
    padding: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    backgroundColor: '#FEE500',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  webButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  webview: {
    flex: 1,
  },
  userInfo: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  userText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});