// PWA 설정 추가

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // 동적 라우트를 위해 주석 처리
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
  
  // 프로덕션 최적화
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  
};

export default nextConfig;