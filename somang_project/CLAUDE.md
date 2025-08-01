# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T-BRIDGE is a transparent telecom quote comparison service with a multi-app architecture:

- **user-app** (port 50331): Customer-facing web app for requesting telecom quotes with basic browser notifications and Kakao OAuth
- **biz-app** (port 50332): Business-facing app for telecom stores to create and send quotes
- **admin-app** (port 50333): Administrative interface (basic structure only)
- **supabase/**: Backend with Edge Functions

Tech Stack: Next.js 15.3.4, React 19, TypeScript, Tailwind CSS, Supabase, pnpm

## Common Development Commands

## 응답 규칙
- 반응형 디자인 항상 고려
- 파일 수정 시 경로 명시
- 수정 부분 주석으로 표시
- 설명은 간략하게
- 한국어로 대답
- 안되는게 있으면 다른 방법을 우선 제안
- 빌드 및 패키지 설치는 요청만 해라
- npm, npx, pnpm 등 문제가 발생하면 그것 먼저 해결해라

## 코딩 스타일
- TypeScript 사용
- 함수형 컴포넌트 우선
- Tailwind CSS 사용
- ESLint 오류에 대한 검증을 무조건 하고 오류수정 해라

### Individual App Development
```bash
# User App (port 50331)
cd user-app && pnpm dev

# User App with HTTPS (개발용)
cd user-app && pnpm dev:https

# Business App (port 50332) 
cd biz-app && pnpm dev

# Admin App (port 50333)
cd admin-app && pnpm dev

# Build individual apps
cd [app-name] && pnpm build

# Lint individual apps
cd [app-name] && pnpm lint
```

### Docker Development
```bash
# Development environment (all apps) - HTTPS
docker-compose --profile dev up --build

# Production environment
docker-compose --profile prod up

# Individual app containers
docker-compose up user-app-dev
docker-compose up biz-app-dev
docker-compose up admin-app-dev
```

### HTTPS 접속 방법 (Docker 환경)
- User App: https://localhost:50443
- Biz App: https://localhost:50444
- Admin App: https://localhost:50445

**Note**: 자체 서명 인증서를 사용하므로 브라우저에서 보안 경고가 표시됩니다. 개발 환경에서는 "고급" → "계속 진행"을 선택하세요.

### Supabase
```bash
# Start local Supabase (if configured)
supabase start

# Deploy Edge Functions
supabase functions deploy send-push-notification

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

## Architecture & Key Patterns

### Multi-App Authentication Strategy
Each app uses **separate Supabase clients with isolated storage keys**:
- user-app: `'user-token'` storage key, enforces `role = 'user'`
- biz-app: `'biz-token'` storage key, allows business roles
- admin-app: `'admin-token'` storage key

Role validation happens in AuthProvider with automatic logout for unauthorized roles.

**Key authentication files**:
- `src/components/AuthProvider.tsx`: Role-based session management with nickname generation
- `src/lib/supabase/client.ts`: App-specific Supabase client configuration

### Real-time Notification System
**Simple notification architecture**:
1. **Supabase Realtime**: Live quote updates via PostgreSQL change streams
2. **Browser Notifications**: Basic browser notifications with user permission
3. **In-App Notifications**: RealtimeNotificationProvider for live UI updates

**Notification flow**: Quote creation → Realtime update → Browser notification

**Key notification files**:
- `src/components/RealtimeNotificationProvider.tsx`: Realtime quote monitoring and browser notifications
- `src/components/NotificationSettings.tsx`: User notification preferences UI
- `supabase/functions/send-push-notification/`: Edge function for web push (uses VAPID keys)

### Quote Request Workflow
**User journey**: mobile/step1-8 → QuoteContext (state management) → Supabase → Business notification
**Business response**: Quote creation → Browser notification → User sees quote

**Mobile quote flow pages**:
- `src/app/quote/mobile/step1-8/`: Multi-step quote request form
- `src/app/quote/requests/`: User's quote request list and details
- `src/context/QuoteContext.tsx`: Temporary state management for quote flow

### State Management Patterns
- **QuoteContext**: React Context for quote request flow (⚠️ volatile - resets on page refresh)
- **AuthProvider**: Session management with role-based access control
- **RealtimeNotificationProvider**: Live notification state with cleanup handling

### Database Integration
**Supabase tables** (inferred from code):
- `profiles`: User profiles with roles and nicknames
- `quote_requests`: User quote requests with status tracking
- `quotes`: Business responses to requests
- `stores`: Business store information
- `devices`: Telecom device catalog
- `user_push_subscriptions`: Push notification subscriptions

## Critical Issues to Address

### Known Data Persistence Problems
- QuoteContext data is lost on page refresh - consider SessionStorage migration
- Migration files missing - database schema not version controlled
- Multi-step quote form loses progress on navigation away

### Notification System
- Uses basic browser notifications (no PWA/Service Worker)
- Requires user permission for desktop notifications
- Real-time updates via Supabase Realtime subscriptions
- Notification permission stored in localStorage as `'user-wants-notifications'`

### Security Considerations
- Row Level Security (RLS) policies not confirmed in codebase
- Client-side role validation needs server-side backup
- VAPID keys for push notifications managed via environment variables

### Real-time System Race Conditions
- Quote request subscription timing with status changes
- Concurrent quote submissions for same request_id
- Push notification vs. realtime notification ordering
- RealtimeNotificationProvider watches all user requests without status filtering

## Environment Setup

Each app requires `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Edge Functions require VAPID keys:
```bash
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Testing & Quality
- No test framework currently configured
- ESLint configured for each app via `pnpm lint`
- TypeScript strict mode enabled across all apps

## Docker & Deployment
- Multi-stage builds with separate dev/prod Dockerfiles
- Development uses hot reloading with volume mounts
- Production builds optimized for smaller image size
- Custom port mapping: 50331 (user), 50332 (biz), 50333 (admin)
- HTTPS development on port 50443 for user-app (notification testing)

## Project Structure
```
├── user-app/           # Customer-facing Next.js app
├── biz-app/            # Business-facing Next.js app
├── admin-app/          # Admin Next.js app (minimal)
├── supabase/           # Backend configuration
│   ├── functions/      # Edge Functions (Deno)
│   └── enable_realtime.sql
├── docker-compose.yml  # Multi-app orchestration
└── package.json        # Root dependencies
```

## Common Gotchas

### Authentication Issues
- Each app has its own storage key to prevent session conflicts
- Role enforcement happens client-side in AuthProvider - ensure server-side validation
- Kakao OAuth callback must match configured redirect URI exactly

### Development Tips
- Use HTTPS mode (`pnpm dev:https`) for testing browser notifications
- Check browser console for realtime subscription status messages
- Monitor Supabase logs for Edge Function execution results
- Clear localStorage when switching between apps to avoid auth conflicts