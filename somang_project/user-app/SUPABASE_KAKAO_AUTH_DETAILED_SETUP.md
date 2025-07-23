# Supabase 카카오 로그인 상세 설정 가이드

## 1. Supabase Dashboard 접속

### 로그인 및 프로젝트 선택
1. **브라우저에서 접속**: https://supabase.com/dashboard
2. **로그인**: GitHub, Google, 또는 이메일로 로그인
3. **프로젝트 선택**: T-Bridge 프로젝트 클릭

## 2. Authentication 설정 페이지 이동

### 네비게이션 경로
1. **좌측 사이드바**에서 **"Authentication"** 아이콘 클릭 (자물쇠 모양)
2. **상단 탭**에서 **"Providers"** 클릭

## 3. Kakao Provider 설정

### Kakao 프로바이더 찾기
1. 프로바이더 목록에서 **"Kakao"** 찾기
2. **"Kakao"** 행의 우측에 있는 **토글 스위치** 확인

### Kakao 프로바이더 활성화
1. 토글이 꺼져있다면 **클릭하여 활성화** (초록색으로 변경)
2. 설정 패널이 자동으로 열림

## 4. Kakao OAuth 설정 입력

### 필수 입력 항목

#### Client ID (REST API 키)
1. **Kakao Developers에서 확인**:
   - https://developers.kakao.com/ 접속
   - 내 애플리케이션 → T-Bridge 선택
   - **앱 키** 메뉴에서 **REST API 키** 복사
2. **Supabase에 입력**:
   - "Client ID" 필드에 붙여넣기

#### Client Secret
1. **Kakao Developers에서 확인**:
   - **제품 설정** → **카카오 로그인** → **보안**
   - "Client Secret" 섹션에서 **코드 생성** 클릭
   - 생성된 코드 복사
2. **Supabase에 입력**:
   - "Client Secret" 필드에 붙여넣기

### 추가 설정 (선택사항)

#### Authorized Client IDs
- 비워두거나 필요시 추가 클라이언트 ID 입력

## 5. Redirect URL 확인 및 복사

### Supabase에서 제공하는 Callback URL
설정 패널 하단에 표시되는 URL 복사:
```
https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback
```

### 이 URL을 Kakao Developers에 등록
1. **Kakao Developers** → **제품 설정** → **카카오 로그인**
2. **Redirect URI** 섹션에 위 URL 추가
3. 저장

## 6. Site URL 및 Redirect URLs 설정

### Authentication → Settings → Auth 탭으로 이동

#### Site URL 설정
**"Site URL"** 필드에 입력:
```
http://localhost:50331
```

또는 여러 URL을 콤마로 구분:
```
http://localhost:3000, http://localhost:50331, https://your-domain.com
```

#### Redirect URLs 설정
**"Redirect URLs"** 필드에 입력:
```
http://localhost:50331/**
http://localhost:3000/**
https://bbxycbghbatcovzuiotu.supabase.co/**
```

### 모바일 앱 지원 추가 (중요!)
Redirect URLs에 다음 추가:
```
http://localhost:50331/**
http://localhost:3000/**
https://bbxycbghbatcovzuiotu.supabase.co/**
https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback
```

## 7. 추가 보안 설정

### Email 설정 (선택사항)
**Authentication → Settings → Auth** 탭에서:

#### Enable Email Confirmations
- 이메일 인증 필요 여부 설정
- 카카오 로그인은 영향받지 않음

#### Enable Email Changes
- 이메일 변경 시 확인 필요 여부

## 8. 저장 및 확인

### 설정 저장
1. 각 섹션마다 **"Save"** 버튼 클릭
2. 저장 완료 메시지 확인

### 설정 확인
1. 페이지 새로고침
2. 모든 설정이 정상적으로 저장되었는지 확인

## 9. 테스트 환경 설정

### 로컬 개발 환경
**.env.local** 파일 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bbxycbghbatcovzuiotu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 환경 변수 확인
Supabase Dashboard → Settings → API에서:
- **Project URL**: `https://bbxycbghbatcovzuiotu.supabase.co`
- **Anon/Public Key**: 복사하여 사용

## 10. 일반적인 문제 해결

### "Invalid redirect_uri" 오류
**원인**: Redirect URL이 등록되지 않음
**해결**: 
- Supabase Redirect URLs에 정확한 URL 추가
- Kakao Developers에도 동일한 URL 등록

### "Client authentication failed" 오류
**원인**: Client ID 또는 Secret 불일치
**해결**:
- Kakao REST API 키 재확인
- Client Secret 재생성 및 업데이트

### 모바일 앱에서 로그인 후 복귀 안됨
**원인**: Deep Link 설정 문제
**해결**:
- AndroidManifest.xml 확인
- Kakao Developers에 Android 플랫폼 등록 확인

## 11. 완료 체크리스트 ✅

### Supabase 설정
- [ ] Authentication → Providers → Kakao 활성화
- [ ] Client ID (REST API 키) 입력
- [ ] Client Secret 입력
- [ ] Site URL 설정
- [ ] Redirect URLs 설정
- [ ] 모든 변경사항 저장

### Kakao Developers 설정
- [ ] Redirect URI에 Supabase callback URL 등록
- [ ] Android 플랫폼 등록 (패키지명, 키 해시)
- [ ] 카카오 로그인 활성화

### 앱 설정
- [ ] 환경 변수 확인 (.env.local)
- [ ] Deep Link 설정 (AndroidManifest.xml)
- [ ] 빌드 및 테스트

## 12. 설정 스크린샷 가이드

### Kakao Provider 설정 화면
```
┌─ Kakao ─────────────────────────────────────┐
│ Enabled: [✓]                                │
│                                             │
│ Client ID:                                  │
│ ┌─────────────────────────────────────────┐ │
│ │ your-kakao-rest-api-key                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Client Secret:                              │
│ ┌─────────────────────────────────────────┐ │
│ │ your-kakao-client-secret                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Callback URL (for Kakao):                   │
│ https://bbxycbghbatcovzuiotu.supabase.co/  │
│ auth/v1/callback                            │
│                                             │
│                                    [Save]   │
└─────────────────────────────────────────────┘
```

### Site URL & Redirect URLs 설정 화면
```
┌─ Authentication Settings ────────────────────┐
│                                             │
│ Site URL:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ http://localhost:50331                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Redirect URLs:                              │
│ ┌─────────────────────────────────────────┐ │
│ │ http://localhost:50331/**               │ │
│ │ http://localhost:3000/**                │ │
│ │ https://bbxycbghbatcovzuiotu.supabase. │ │
│ │ co/**                                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│                                    [Save]   │
└─────────────────────────────────────────────┘
```

---

## 설정 완료 후 테스트

1. **웹에서 테스트**:
   - http://localhost:50331 에서 카카오 로그인
   - 정상적으로 로그인 후 리다이렉트 확인

2. **모바일 앱에서 테스트**:
   - APK 설치 후 카카오 로그인
   - 브라우저 → 앱 복귀 확인

모든 설정이 완료되면 웹과 모바일 모두에서 카카오 로그인이 정상 작동합니다!