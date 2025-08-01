# Supabase Auth 설정 업데이트 가이드

## 1. Supabase Dashboard 접속

### 단계별 접속 방법
1. **브라우저에서 접속**: https://supabase.com/dashboard
2. **로그인**: 기존 Supabase 계정으로 로그인
3. **프로젝트 선택**: T-Bridge 프로젝트 클릭

## 2. Authentication 설정 페이지 이동

### 네비게이션 경로
```
프로젝트 대시보드 → 좌측 메뉴 → Authentication → Settings
```

### 상세 단계
1. 좌측 사이드바에서 **"Authentication"** 클릭
2. Authentication 하위 메뉴에서 **"Settings"** 클릭
3. 상단 탭에서 **"Auth"** 탭 선택 (기본 선택됨)

## 3. Site URL 설정

### 현재 설정 확인
"Site URL" 섹션을 찾아서 현재 값 확인:
- 기본값: `http://localhost:3000`

### 새 URL 추가 방법

#### 옵션 1: 여러 URL을 콤마로 구분 (권장)
```
http://localhost:3000, http://localhost:50331, com.tbridge.userapp://login
```

#### 옵션 2: 주요 URL만 설정
```
com.tbridge.userapp://login
```

### 설정 방법
1. "Site URL" 입력 필드 클릭
2. 기존 값 뒤에 콤마와 새 URL 추가
3. **"Save"** 버튼 클릭

## 4. Redirect URLs 설정

### 위치 찾기
"Site URL" 아래쪽에 **"Redirect URLs"** 섹션이 있습니다.

### 현재 설정 확인
일반적으로 다음과 같은 URL들이 설정되어 있을 것입니다:
```
http://localhost:3000/**
http://localhost:50331/**
```

### 새 Redirect URL 추가

#### 추가할 URL 목록
```
com.tbridge.userapp://login
com.tbridge.userapp://**
```

#### 설정 방법
1. "Redirect URLs" 입력 필드에 기존 URL들과 함께 추가:
   ```
   http://localhost:3000/**,
   http://localhost:50331/**,
   com.tbridge.userapp://login,
   com.tbridge.userapp://**
   ```
2. **"Save"** 버튼 클릭

## 5. OAuth Provider 설정 (Kakao)

### Kakao Provider 확인
1. **"Providers"** 섹션으로 스크롤
2. **"Kakao"** 프로바이더 찾기
3. 설정된 상태인지 확인 (초록색 토글)

### Kakao Redirect URI 업데이트 (중요!)
Kakao Developer Console에서도 설정 업데이트 필요:ㅇ

#### Kakao Developers 설정
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 → T-Bridge 앱 선택
3. **카카오 로그인** → **Redirect URI** 설정
4. 다음 URI들 추가:
   ```
   https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback
   com.tbridge.userapp://login
   ```

## 6. 설정 값 예시

### 완성된 Site URL
```
http://localhost:3000, http://localhost:50331, com.tbridge.userapp://login
```

### 완성된 Redirect URLs
```
http://localhost:3000/**,
http://localhost:50331/**,
com.tbridge.userapp://login,
com.tbridge.userapp://**
```

## 7. 설정 저장 및 확인

### 저장 방법
1. 모든 변경사항 입력 완료
2. 각 섹션마다 **"Save"** 버튼 클릭
3. 페이지 새로고침하여 저장 확인

### 설정 확인 방법
1. 페이지를 새로고침
2. 입력한 URL들이 정상적으로 저장되었는지 확인
3. 오류 메시지가 없는지 확인

## 8. 문제 해결

### 일반적인 오류들

#### "Invalid URL format" 오류
- **원인**: URL 형식이 잘못된 경우
- **해결**: `com.tbridge.userapp://login` 형식 정확히 입력

#### "Unauthorized redirect_uri" 오류  
- **원인**: Redirect URL이 등록되지 않은 경우
- **해결**: Redirect URLs에 정확한 URL 추가

#### Kakao 로그인 실패
- **원인**: Kakao Developer Console에 모바일 URI 미등록
- **해결**: Kakao Developers에서 `com.tbridge.userapp://login` 추가

### 설정 테스트 방법
1. 새 APK 빌드 및 설치
2. 앱에서 카카오 로그인 시도
3. 로그인 완료 후 앱으로 정상 복귀 확인

## 9. 스크린샷 가이드

설정 위치를 시각적으로 확인하려면:

### Site URL 섹션
```
┌─ Authentication Settings ────────────────┐
│                                          │
│ Site URL                                 │
│ ┌──────────────────────────────────────┐ │
│ │ http://localhost:3000, com.tbridge.. │ │
│ └──────────────────────────────────────┘ │
│                               [Save]     │
└──────────────────────────────────────────┘
```

### Redirect URLs 섹션  
```
┌─ Redirect URLs ──────────────────────────┐
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ http://localhost:3000/**,            │ │
│ │ com.tbridge.userapp://login,         │ │
│ │ com.tbridge.userapp://**             │ │
│ └──────────────────────────────────────┘ │
│                               [Save]     │
└──────────────────────────────────────────┘
```

---

## 완료 체크리스트 ✅

- [ ] Supabase Dashboard → Authentication → Settings 접속
- [ ] Site URL에 `com.tbridge.userapp://login` 추가
- [ ] Redirect URLs에 모바일 스킴 추가  
- [ ] 모든 변경사항 저장
- [ ] Kakao Developer Console에서 Redirect URI 추가
- [ ] 새 APK 빌드 및 테스트

모든 설정 완료 후 앱을 다시 빌드하면 카카오 로그인이 정상 작동할 것입니다!