# Vercel 배포 가이드

## 🚨 중요: 각 앱을 별도로 배포해야 합니다

현재 멀티 앱 구조이므로 각 앱을 개별 Vercel 프로젝트로 배포해야 합니다.

## 📁 배포할 앱들

1. **user-app** (고객용)
2. **biz-app** (사업자용) 
3. **admin-app** (관리자용)

## 🔧 배포 방법

### 방법 1: Vercel CLI 사용 (권장)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 각 앱 디렉토리에서 개별 배포
cd user-app
vercel

cd ../biz-app
vercel

cd ../admin-app
vercel
```

### 방법 2: Vercel 웹 대시보드 사용

1. **GitHub에서 각 앱을 별도 레포지토리로 분리** (추천)
2. 또는 **Root Directory 설정**으로 서브폴더 지정

## 🔑 환경 변수 설정 (필수!)

각 Vercel 프로젝트에서 다음 환경 변수들을 **수동으로 설정**해야 합니다:

### User App 환경 변수:
```
NEXT_PUBLIC_SUPABASE_URL=https://bbxycbghbatcovzuiotu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BBD37H9S5wtJZSss9nKP-4VfqjLrQA7P...
KAKAO_REST_API_KEY=d3f37aec68bb73a87426d12f1170efb6
KAKAO_JAVASCRIPT_API_KEY=2fe616056f4156a5ba0e3260f3f4c7b0
NEXT_PUBLIC_KAKAO_JAVASCRIPT_API_KEY=2fe616056f4156a5ba0e3260f3f4c7b0
```

### Biz App & Admin App 환경 변수:
```
NEXT_PUBLIC_SUPABASE_URL=https://bbxycbghbatcovzuiotu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 배포 전 체크리스트

- [ ] 각 앱의 `vercel.json` 파일 확인
- [ ] 환경 변수 준비
- [ ] 로컬에서 `pnpm build` 테스트 완료
- [ ] Supabase 설정 확인

## 🌐 예상 도메인들

- User App: `https://t-bridge-user-app.vercel.app`
- Biz App: `https://t-bridge-biz-app.vercel.app`  
- Admin App: `https://t-bridge-admin-app.vercel.app`

## ⚠️ 주의사항

1. **환경 변수는 Vercel 대시보드에서 직접 설정** (Git에 저장되지 않음)
2. **각 앱은 독립적인 도메인**을 가집니다
3. **HTTPS 자동 지원** (Let's Encrypt)
4. **커스텀 도메인 연결 가능**

## 🔄 배포 후 설정

1. **Supabase Authentication URL 업데이트**
   - 새로운 Vercel 도메인을 Supabase Auth 설정에 추가

2. **Kakao OAuth Redirect URI 업데이트**
   - 새로운 도메인으로 Kakao Developers 설정 변경

3. **CORS 설정 확인**
   - API 엔드포인트들의 CORS 설정 확인