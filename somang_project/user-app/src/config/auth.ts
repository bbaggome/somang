// src/config/auth.ts
export const authConfig = {
  // 세션 설정
  session: {
    persistKey: 'sb-auth-token',
    autoRefresh: true,
    detectSessionInUrl: true,
  },
  
  // OAuth 설정
  oauth: {
    kakao: {
      scope: 'profile_nickname,profile_image,account_email',
    },
  },
  
  // 프로필 설정
  profile: {
    retryAttempts: 3,
    retryDelay: 2000, // 2초
  },
  
  // 로그 설정
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    prefix: '[Auth]',
  },
};

// src/config/app.ts
export const appConfig = {
  name: 'T-BRIDGE',
  description: '가장 투명한 통신 견적 비교',
  
  // 라우트 설정
  routes: {
    home: '/',
    login: '/login',
    unauthorized: '/unauthorized',
    debug: '/debug',
  },
  
  // 기능 플래그
  features: {
    debugPage: process.env.NODE_ENV === 'development',
    detailedLogging: process.env.NODE_ENV === 'development',
  },
  
  // UI 설정
  ui: {
    loadingDelay: 300, // 300ms 후 로딩 표시
    toastDuration: 5000, // 5초
  },
};

// src/config/database.ts
export const dbConfig = {
  tables: {
    profiles: 'profiles',
  },
  
  // RLS 정책명
  policies: {
    profilesSelect: 'Public profiles are viewable by everyone',
    profilesInsert: 'Users can insert their own profile',
    profilesUpdate: 'Users can update own profile',
  },
  
  // 함수명
  functions: {
    handleNewUser: 'handle_new_user',
    generateNickname: 'generate_unique_nickname',
  },
};