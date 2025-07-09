# T-BRIDGE User App

가장 투명한 통신 견적 비교 서비스의 사용자 앱입니다.

## 🚀 기능

- ✅ 카카오 소셜 로그인
- ✅ 자동 프로필 생성 및 랜덤 닉네임
- ✅ 세션 관리 및 보안
- ✅ TypeScript 기반 타입 안전성
- ✅ 반응형 디자인

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Supabase Auth (카카오 OAuth)
- **Database**: Supabase PostgreSQL
- **Package Manager**: pnpm

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 개발 서버 실행
```bash
pnpm dev
```

### 4. 빌드
```bash
pnpm build
```

## 🏗️ 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── auth/           # 인증 관련 라우트
│   ├── debug/          # 디버그 페이지 (개발용)
│   └── login/          # 로그인 페이지
├── components/         # React 컴포넌트
├── config/            # 설정 파일들
├── hooks/             # 커스텀 훅
├── lib/              # 유틸리티 및 라이브러리
└── types/            # TypeScript 타입 정의
```

## 🔐 보안

- Row Level Security (RLS) 정책 적용
- 서버 사이드 세션 검증
- 환경 변수를 통한 민감 정보 관리
- 프로덕션에서 디버그 페이지 자동 비활성화

## 🧪 테스트

```bash
# 테스트 라이브러리 설치 (선택사항)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# 테스트 실행
pnpm test
```

## 🚀 배포

### Docker를 사용한 배포

```bash
# 개발용
docker build -f Dockerfile.dev -t user-app:dev .
docker run -p 3000:3000 user-app:dev

# 프로덕션용
docker build -f Dockerfile.prod -t user-app:prod .
docker run -p 3000:3000 user-app:prod
```

## 📝 라이센스

이 프로젝트는 비공개 프로젝트입니다.