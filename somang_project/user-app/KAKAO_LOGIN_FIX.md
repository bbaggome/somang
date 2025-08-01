# 카카오 로그인 Deep Link 수정 완료 ✅

## 문제 상황
모바일 앱에서 카카오 로그인 후 `https://localhost/login#access_token=...`로 리다이렉트되어 "사이트에 접근할 수 없음" 오류 발생

## 해결 방법

### 1. Deep Link 설정 추가 ✅
**AndroidManifest.xml**에 커스텀 URL 스킴 추가:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.tbridge.userapp" />
</intent-filter>
```

### 2. 로그인 리다이렉트 URL 변경 ✅
**login/page.tsx**에서 플랫폼별 redirectTo URL 설정:
```typescript
const redirectTo = Capacitor.isNativePlatform() 
  ? 'com.tbridge.userapp://login'  // 모바일 앱
  : `${window.location.origin}/login`;  // 웹
```

### 3. Deep Link Handler 추가 ✅
**DeepLinkHandler.tsx**로 앱이 URL로 열렸을 때 토큰 처리:
```typescript
App.addListener('appUrlOpen', (data) => {
  if (data.url.includes('access_token=')) {
    // URL을 해시 형태로 변환하여 기존 로직 재사용
    const url = new URL(data.url.replace('com.tbridge.userapp://', 'https://localhost/'))
    const hashParams = url.search.substring(1)
    window.location.hash = hashParams
    router.push('/login')
  }
})
```

### 4. Capacitor App 플러그인 설치 ✅
```bash
npm install @capacitor/app
```

## 다음 단계

### Supabase 설정 업데이트 필요
Supabase Dashboard에서 Auth 설정 업데이트:
1. https://supabase.com/dashboard → 프로젝트 선택
2. Authentication → Settings → Auth
3. **Site URL** 섹션에 추가:
   ```
   http://localhost:3000
   http://localhost:50331
   com.tbridge.userapp://login
   ```
4. **Redirect URLs** 섹션에 추가:
   ```
   http://localhost:3000/login
   http://localhost:50331/login
   com.tbridge.userapp://login
   ```

### 테스트 방법
1. Android Studio에서 앱 다시 빌드
2. 휴대폰에 새 APK 설치
3. 카카오 로그인 테스트
   - 로그인 → 카카오 브라우저 열림
   - 로그인 완료 → 앱으로 자동 복귀
   - 토큰 처리 → 홈 화면 이동

## 변경된 파일들
- ✅ `android/app/src/main/AndroidManifest.xml` - Deep Link 설정
- ✅ `src/app/login/page.tsx` - 플랫폼별 리다이렉트 URL
- ✅ `src/components/DeepLinkHandler.tsx` - Deep Link 처리
- ✅ `src/app/layout.tsx` - DeepLinkHandler 추가
- ✅ `package.json` - @capacitor/app 플러그인 추가

---
Android Studio에서 앱을 다시 빌드하고 Supabase 설정을 업데이트하면 카카오 로그인이 정상 작동할 것입니다!