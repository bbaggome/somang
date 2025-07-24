'use client'

import { useEffect } from 'react'

export default function MobileWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeMobile = async () => {
      // 웹 환경에서는 Capacitor 모듈을 동적으로 로드
      try {
        // Capacitor가 사용 가능한지 확인
        if (typeof window !== 'undefined' && window.Capacitor) {
          const { Capacitor } = await import('@capacitor/core')
          
          if (Capacitor.isNativePlatform()) {
            // 네이티브 플랫폼에서만 실행
            const [{ StatusBar }, { SplashScreen }] = await Promise.all([
              import('@capacitor/status-bar'),
              import('@capacitor/splash-screen')
            ])
            
            // 상태바 설정
            await StatusBar.setStyle({ style: 'DARK' })
            await StatusBar.setBackgroundColor({ color: '#667eea' })
            
            // 스플래시 스크린 숨기기
            await SplashScreen.hide()
          }
        }
      } catch (error) {
        // 웹 환경에서는 Capacitor 모듈이 없을 수 있으므로 에러 무시
        console.log('Capacitor not available (web environment)', error)
      }
    }

    initializeMobile()
  }, [])

  return <>{children}</>
}