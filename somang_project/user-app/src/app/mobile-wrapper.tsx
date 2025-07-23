'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

export default function MobileWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeMobile = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // 상태바 설정
          await StatusBar.setStyle({ style: 'DARK' })
          await StatusBar.setBackgroundColor({ color: '#667eea' })
          
          // 스플래시 스크린 숨기기
          await SplashScreen.hide()
        } catch (error) {
          console.error('Mobile initialization error:', error)
        }
      }
    }

    initializeMobile()
  }, [])

  return <>{children}</>
}