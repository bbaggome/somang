# 카카오 로그인 `about:blank` 문제 해결

## 📊 현재 상황 분석
- ✅ 앱에서 카카오 로그인 버튼 클릭
- ✅ 브라우저 열림: `https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/authorize?provider=kakao...`
- ❌ `about:blank`로 변경됨
- ❌ 앱은 "로그인 중..." 상태 유지

## 🔍 문제 원인 분석

### 1. Deep Link 인터셉트 실패
Android가 Supabase 콜백 URL을 앱으로 전달하지 못함

### 2. 가능한 원인들
- Kakao Developers Android 플랫폼 미등록
- 키 해시 불일치
- Supabase Kakao Provider 설정 누락
- Android App Links 검증 실패

## 🛠️ 해결 단계

### 1단계: Kakao Developers 설정 확인 ✅

#### Android 플랫폼 등록 확인
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 → T-Bridge 선택
3. **앱 설정** → **플랫폼** → **Android** 확인

#### 필수 정보 확인
- **패키지명**: `com.tbridge.userapp` ✅
- **키 해시**: `Ldg2o34Bmno59O9rxrm4A/8L/Zg=` ✅

#### Redirect URI 확인
**제품 설정** → **카카오 로그인** → **Redirect URI**:
```
https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback
```

### 2단계: Supabase 설정 확인

#### Kakao Provider 활성화 확인
1. https://supabase.com/dashboard 접속
2. T-Bridge 프로젝트 → **Authentication** → **Providers**
3. **Kakao** 토글 활성화 확인

#### Client ID/Secret 확인
- **Client ID**: Kakao REST API 키
- **Client Secret**: Kakao Client Secret

### 3단계: Android App Links 디버깅

#### 설치된 앱에서 테스트
```bash
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback#access_token=test" \
  com.tbridge.userapp
```

#### App Links 검증
```bash
adb shell pm verify-app-links --re-verify com.tbridge.userapp
```

### 4단계: 대안 해결책

#### 옵션 1: Custom URL Scheme 추가
AndroidManifest.xml에 추가:

```xml
<!-- 기존 HTTPS 인텐트 필터 유지 -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https"
          android:host="bbxycbghbatcovzuiotu.supabase.co"
          android:path="/auth/v1/callback" />
</intent-filter>

<!-- 추가: 커스텀 스킴 -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="tbridge" />
</intent-filter>
```

#### 옵션 2: Universal Links 대신 Custom Scheme 사용
로그인 코드에서:
```typescript
const redirectTo = Capacitor.isNativePlatform() 
  ? 'tbridge://login'
  : `${window.location.origin}/login`;
```

### 5단계: 실시간 디버깅

#### Android Studio Logcat에서 확인
1. Android Studio → **Logcat** 탭
2. 필터: `com.tbridge.userapp`
3. 카카오 로그인 시도하며 로그 확인

#### 예상 로그
```
DeepLinkHandler: App opened with URL: https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback#access_token=...
```

## 🔧 즉시 시도할 수 있는 해결책

### 방법 1: 앱 재설치
1. 기존 앱 완전 삭제
2. 새 APK 설치
3. 카카오 로그인 재시도

### 방법 2: Chrome Custom Tabs 비활성화
Capacitor 설정에서:
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  // ... 기존 설정
  plugins: {
    Browser: {
      windowName: '_blank'  // Chrome Custom Tabs 대신 시스템 브라우저 사용
    }
  }
};
```

### 방법 3: 수동 토큰 처리 테스트
브라우저에서 로그인 완료 후 URL 복사하여 앱에서 처리 테스트

## 📋 체크리스트

### Kakao Developers 설정
- [ ] Android 플랫폼 등록 확인
- [ ] 패키지명: `com.tbridge.userapp`
- [ ] 키 해시: `Ldg2o34Bmno59O9rxrm4A/8L/Zg=`
- [ ] Redirect URI: `https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback`
- [ ] 카카오 로그인 Android 플랫폼 활성화

### Supabase 설정
- [ ] Kakao Provider 활성화
- [ ] Client ID (REST API 키) 입력
- [ ] Client Secret 입력

### 앱 설정
- [ ] AndroidManifest.xml Deep Link 설정
- [ ] DeepLinkHandler 컴포넌트 작동
- [ ] 앱 재설치 후 테스트

---

## 🎯 우선 확인 순서

1. **Kakao Developers Android 플랫폼 등록** (가장 중요!)
2. **Supabase Kakao Provider 설정**
3. **앱 재설치 후 테스트**

이 순서대로 확인하면 문제가 해결될 것입니다!