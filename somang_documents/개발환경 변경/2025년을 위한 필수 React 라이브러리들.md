
> 원문: [robinwieruch.de](https://robinwieruch.de)  
> 게시자: xguru | 게시일: 4개월 전 | ★ 즐겨찾기 | 댓글 5개

React는 컴포넌트 기반 UI 구축에 초점을 맞춘 라이브러리로, 함수형 컴포넌트와 React Hooks를 활용해 로컬 상태 관리, 부수 효과 처리, 성능 최적화를 지원합니다. 아래는 2025년 대규모 애플리케이션 개발에 필요한 필수 React 라이브러리입니다.

## React 프로젝트 시작하기

- **Vite**: 빠른 빌드 속도와 TypeScript 지원을 제공하는 인기 있는 React 프로젝트 설정 도구.
- **Next.js**: 서버사이드 렌더링(SSR), 정적 사이트 생성(SSG), 파일 기반 라우팅, React Server Components(RSC) 지원.
- **TanStack Start (Beta)**: React Server Components 지원 예정. Next.js의 대안.
- **React Router**: 클라이언트 사이드 라우팅의 표준. Remix의 영향을 받아 변화 중.
- **Astro**: 프레임워크 독립적인 정적 사이트 생성 도구. React와 함께 사용 시 JavaScript 최소화로 성능 최적화.
- **기타**: Nitro, Redwood, Waku (Zustand 개발자 제작, RSC 지원).

**추천**:
- 클라이언트 사이드 렌더링(CSR): Vite
- 서버사이드 렌더링(SSR): Next.js
- 정적 사이트 생성(SSG): Astro

## React 패키지 매니저

- **npm**: Node.js 기본 패키지 매니저. 가장 널리 사용됨.
- **Yarn**: 의존성 관리와 속도 개선.
- **pnpm**: 성능 우수, 덜 보편적.
- **Turborepo**: Monorepo 관리 도구.

**추천**:
- 일반 패키지 관리: npm
- 성능 최적화: pnpm
- Monorepo: Turborepo

## React 상태 관리

- **useState / useReducer**: React 내장 훅. 컴포넌트 내 로컬 상태 관리.
- **useContext**: 전역 상태 관리용 내장 훅.
- **Zustand**: 간단한 API로 전역 상태 관리. Redux보다 선호도 상승.
- **Redux**: Redux Toolkit이 표준. 오랜 기간 사용.
- **XState / Zag**: 상태 머신 기반 상태 관리.
- **기타**: Mobx, Jotai, Nano Stores.

**추천**:
- 로컬 상태: useState / useReducer
- 소규모 전역 상태: useContext
- 대규모 전역 상태: Zustand

## React 데이터 패칭

- **TanStack Query**: REST/GraphQL API 요청, 캐싱, 동기화, 옵티미스틱 업데이트 지원.
- **Apollo Client**: GraphQL API에 최적화.
- **urql**: 경량 GraphQL 클라이언트.
- **Relay**: 고성능 GraphQL 클라이언트 (Facebook 개발).
- **RTK Query**: Redux 환경에서 데이터 패칭 지원.
- **tRPC**: TypeScript 기반 타입 안전 API 통신.

**추천**:
- 서버사이드 데이터 패칭: React Server Components (메타 프레임워크 사용 시)
- 클라이언트 사이드 데이터 패칭: TanStack Query
- GraphQL 전용: Apollo Client
- 타입 안전 API: tRPC

## React 라우팅

- **React Router**: 클라이언트 사이드 라우팅의 표준.
- **TanStack Router (Beta)**: TypeScript 지원 강화.

**추천**:
- 서버사이드 라우팅: Next.js
- 클라이언트 사이드 라우팅: React Router, TanStack Router

## React CSS 스타일링

- **Tailwind CSS**: Utility-First CSS. 빠른 스타일링, 클래스 복잡성 주의.
- **CSS Modules**: 컴포넌트별 스타일 모듈화. 전역 충돌 방지.
- **styled-components**: CSS-in-JS. 최근 인기 감소.
- **Emotion**: CSS-in-JS, 성능 최적화.
- **clsx**: 조건부 className 유틸리티.
- **StyleX**: Facebook 개발, 최적화된 CSS-in-JS.
- **기타**: PandaCSS, linaria, vanilla-extract, nanocss, UnoCSS, Styled JSX.

**추천**:
- 인기: Tailwind CSS
- 스타일 모듈화: CSS Modules
- 최신 CSS-in-JS: StyleX

## React UI 라이브러리

- **Material UI (MUI)**: Google Material Design 기반.
- **Mantine UI**: 2022년 인기, 커스텀 스타일 지원.
- **Chakra UI**: 2021년 인기, 접근성 우수.
- **Hero UI**: 이전 Next UI.
- **Park UI**: Ark UI 기반.
- **PrimeReact**: 다양한 프리빌트 컴포넌트.
- **헤드리스 UI**:
  - shadcn/ui (2023-2024년 인기)
  - Radix (shadcn/ui 기반)
  - React Aria, Ark UI, Ariakit, Daisy UI, Headless UI, Tailwind UI (유료).
- **구형 UI**: Ant Design, Semantic UI, React Bootstrap, Reactstrap.

**추천**:
- 스타일 포함 UI: MUI, Mantine, Chakra UI
- 헤드리스 UI: shadcn/ui, Radix

## React 애니메이션

- **Motion**: 추천, 구 Framer Motion.
- **react spring**: 물리 기반 애니메이션.

**추천**:
- Motion

## React 차트 및 데이터 시각화

- **D3.js**: 강력, 학습 곡선 가파름.
- **Recharts**: 사용 간편, 기본 커스터마이징.
- **visx**: React 친화적 D3 스타일.
- **기타**: Victory, nivo, react-chartjs.

**추천**:
- 간편한 차트: Recharts
- D3 스타일: visx

## React 폼 라이브러리

- **React Hook Form**: 가장 널리 사용, zod와 함께 강력한 검증.
- **Conform**: 풀스택 통합 용이.
- **Formik / React Final Form**: 전통적, 일부 사용.

**추천**:
- React Hook Form + zod

## React 코드 스타일 및 포맷팅

- **ESLint**: 코드 스타일 유지.
- **Prettier**: 일관된 포맷팅.
- **Biome**: Rust 기반, ESLint/Prettier 대안.

**추천**:
- ESLint + Prettier
- 대안: Biome

## React 인증

- **Lucia**: OAuth 및 암호화 지원.
- **Better Auth**: 최신 인증 서비스.
- **Auth.js**: Next.js 및 다양한 프레임워크 지원.
- **유료**: Clerk, Kinde.
- **Firebase / Supabase**: Supabase Auth.
- **기타**: AuthKit, Auth0, AWS Cognito.

**추천**:
- 간편 인증: Auth.js, Supabase Auth
- OAuth/보안: Lucia, Better Auth

## React 백엔드

- **Next.js**: SSR, API 라우트.
- **Astro**: 정적 사이트 생성.
- **tRPC**: 타입 안전 API.
- **Hono**: 초경량 서버 프레임워크.
- **Node.js 프레임워크**:
  - Express, Fastify, NestJS, Elysia, Koa, Hapi.

**추천**:
- 풀스택: Next.js, tRPC
- 전통 백엔드: Express, Fastify

## React 데이터베이스 및 ORM

- **Prisma**: TypeScript 기반, 인기.
- **Drizzle ORM**: Prisma 대안.
- **기타**: Kysely, database-js (PlanetScale 전용).
- **서버리스**:
  - PlanetScale, Neon, Xata, Turso, Supabase, Firebase.

**추천**:
- ORM: Prisma, Drizzle ORM
- 서버리스: PlanetScale, Neon

## React 호스팅

- **자체 관리**: Digital Ocean, Hetzner.
- **완전 관리**:
  - Vercel: Next.js 최적화.
  - Coolify, Render, Fly.io, Railway, CloudFlare, AWS, Azure, Google Cloud.

**추천**:
- Next.js 프로젝트: Vercel
- 자체 서버: Digital Ocean, Hetzner

## React 테스트

- **Vitest**: 빠르고 최신, 테스트 실행/어서션/목킹 지원.
- **Jest**: 오래된 프로젝트 사용.
- **React Testing Library**: 컴포넌트 테스트.
- **Playwright**: E2E 테스트, 다양한 브라우저 지원.
- **Cypress**: 프론트엔드 E2E 테스트.

**추천**:
- 유닛/통합 테스트: Vitest + React Testing Library
- E2E 테스트: Playwright (또는 Cypress)
- 스냅샷 테스트: Vitest

## React 불변 데이터 구조

- **Immer**: 복잡한 상태 변경 간결화.

**추천**:
- Immer

## React 다국어(i18n)

- **FormatJS**: 날짜/숫자/통화 포맷팅 포함.
- **react-i18next**: 가장 널리 사용.
- **Lingui**: 최소 설정, 강력한 지원.
- **next-intl**: Next.js 전용.

**추천**:
- 일반: react-i18next
- Next.js: next-intl

## React 리치 텍스트 에디터

- **TipTap**: 확장성 우수.
- **Plate**: Slate.js 기반.
- **Lexical**: 경량, Facebook 개발.
- **Slate**: 커스텀 가능.

**추천**:
- 유연성: TipTap
- 경량: Lexical

## React 결제 시스템

- **PayPal**: 널리 사용.
- **Stripe**: 개발 친화적, React Stripe Elements, Stripe Checkout.
- **기타**: Braintree, Lemon Squeezy.

**추천**:
- 간편 결제: Stripe
- PayPal 필요 시: PayPal, Braintree

## React 시간 및 날짜 처리

- **date-fns**: 다양한 기능, 가벼움.
- **Day.js**: Moment.js 대안, 경량.

**추천**:
- 경량: Day.js
- 기능 풍부: date-fns

## React 데스크톱 애플리케이션

- **Electron**: 웹 기술로 크로스 플랫폼 개발.
- **Tauri**: Rust 기반, 경량/보안.

**추천**:
- 웹 기술 활용: Electron
- 경량/보안: Tauri

## React 파일 업로드

- **react-dropzone**: 드래그 앤 드롭 지원.

**추천**:
- react-dropzone

## React 이메일 렌더링

- **react-email**: React 컴포넌트로 반응형 이메일.
- **mjml**: 간편한 HTML 이메일 생성.
- **Mailing**, **jsx-email**: JSX 기반 이메일.
- **서비스**: Resend, Postmark, SendGrid, Mailgun.

**추천**:
- React 스타일: react-email
- 이메일 서비스: SendGrid, Mailgun

## React 드래그 앤 드롭

- **@hello-pangea/dnd**: 간편, react-beautiful-dnd 후속.
- **dnd kit**: 유연, 커스터마이징 가능.

**추천**:
- 간편: @hello-pangea/dnd
- 커스터마이징: dnd kit

## React 모바일 개발

- **React Native**: 크로스 플랫폼 모바일 개발.
- **Expo**: React Native 개발 간소화.
- **Tamagui**: 웹/모바일 UI 통합.

**추천**:
- 모바일: React Native + Expo
- 웹/모바일 UI: Tamagui

## React VR/AR 개발

- **react-three-fiber**: Three.js 기반, VR 지원.
- **react-360 (아카이브됨)**: 유지보수 중단.
- **aframe-react**: 유지보수 중단.

**추천**:
- react-three-fiber

## React 디자인 프로토타이핑

- **Figma**: UI/UX 디자인, 프로토타이핑.
- **Excalidraw**: 손으로 그린 와이어프레임.
- **tldraw**: Excalidraw 유사.

**추천**:
- UI/UX: Figma
- 와이어프레임: Excalidraw

## React 컴포넌트 문서화

- **Storybook**: UI 컴포넌트 개발/문서화.
- **Docusaurus**: 기술 문서용 정적 사이트 생성.
- **Styleguidist**: 컴포넌트 스타일 가이드.
- **React Cosmos**: 컴포넌트 독립 개발/테스트.

**추천**:
- 컴포넌트 문서화: Storybook
- 기술 문서: Docusaurus