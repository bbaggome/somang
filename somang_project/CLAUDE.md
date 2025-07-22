# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T-BRIDGE is a transparent telecom quote comparison service with a multi-app architecture:

- **user-app** (port 50331): Customer-facing app for requesting telecom quotes with PWA support, push notifications, and Kakao OAuth
- **biz-app** (port 50332): Business-facing app for telecom stores to create and send quotes
- **admin-app** (port 50333): Administrative interface (basic structure only)
- **supabase/**: Backend with Edge Functions for push notifications

## Common Development Commands

### Individual App Development
```bash
# User App (port 50331)
cd user-app && pnpm dev

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
# Development environment (all apps)
docker-compose --profile dev up

# Production environment
docker-compose --profile prod up

# Individual app containers
docker-compose up user-app-dev
docker-compose up biz-app-dev
```

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

### Real-time Notification System
**Multi-layer notification architecture**:
1. **Supabase Realtime**: Live quote updates via PostgreSQL change streams
2. **Push Notifications**: Browser push via Service Worker + Edge Function
3. **In-App Notifications**: RealtimeNotificationProvider for live UI updates

**Critical notification flow**: Quote creation → Edge Function push → Service Worker → User notification

### Quote Request Workflow
**User journey**: mobile/step1-8 → QuoteContext (state management) → Supabase → Business notification
**Business response**: Quote creation → Push notification → User sees quote

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

### Security Considerations
- Row Level Security (RLS) policies not confirmed in codebase
- Client-side role validation needs server-side backup
- VAPID keys for push notifications managed via environment variables

### Real-time System Race Conditions
- Quote request subscription timing with status changes
- Concurrent quote submissions for same request_id
- Push notification vs. realtime notification ordering

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