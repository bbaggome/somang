// PWA 설정 추가

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Capacitor 모듈 처리 (웹 환경에서 빌드 오류 방지)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Capacitor 모듈들을 빈 객체로 대체
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@capacitor/core': false,
        '@capacitor/app': false,
        '@capacitor/status-bar': false,
        '@capacitor/splash-screen': false,
        '@capacitor/push-notifications': false,
      };
    }
    return config;
  },
  
  // 프로덕션 최적화
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  
};

export default nextConfig;