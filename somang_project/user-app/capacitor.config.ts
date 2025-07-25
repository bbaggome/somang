import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tbridge.userapp',
  appName: 'T-Bridge User',
  webDir: 'out', // Next.js static export 경로
  server: {
    androidScheme: 'https',
    // 개발 시 라이브 리로드 (PC IP 사용)
    url: 'http://192.168.0.123:50331',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
