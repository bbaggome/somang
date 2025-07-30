# T-Bridge Mobile App

React Native + WebView 하이브리드 앱

## 🚀 시작하기

### 개발 환경 실행
```bash
cd t-bridge-mobile
pnpm start
```

### 디바이스에서 테스트
1. **Expo Go 앱 설치** (iOS/Android)
2. QR 코드 스캔하여 앱 실행

### 기능 테스트
- ✅ 네이티브 UI 구현
- ✅ WebView 통합 (웹페이지 로드)
- ✅ 카카오 로그인 준비
- ✅ Supabase 연동

## 📱 앱 구조

```
📱 Native App
├── 🟡 카카오 로그인 (네이티브)
├── 🌐 WebView 모드 전환
└── 📊 Supabase 데이터베이스 연동
```

## 🔧 환경 설정

### user-app HTTPS 서버 실행 필요
```bash
cd ../user-app
pnpm dev:https
```
- WebView가 https://localhost:50443 을 로드합니다

### 카카오 로그인 설정
1. Kakao Developers에서 앱 등록
2. 네이티브 앱 키 설정
3. 리디렉션 URI: `com.tbridge.mobile://auth/callback`