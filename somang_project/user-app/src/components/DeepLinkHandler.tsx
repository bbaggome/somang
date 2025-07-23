'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

export default function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleAppUrl = async () => {
      // 앱이 URL로 열렸을 때 처리
      App.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data.url)
        
        // Supabase 콜백 URL에서 토큰 추출
        if (data.url.includes('bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback') && data.url.includes('access_token=')) {
          try {
            // URL 파싱
            const url = new URL(data.url)
            const fragment = url.hash.substring(1) // # 제거
            
            if (fragment) {
              // 현재 페이지 URL에 해시로 추가
              window.location.hash = fragment
              
              // 로그인 페이지로 이동 (기존 토큰 처리 로직 실행)
              router.push('/login')
            }
          } catch (error) {
            console.error('URL parsing error:', error)
          }
        }
      })
    }

    handleAppUrl()

    // Cleanup
    return () => {
      App.removeAllListeners()
    }
  }, [router])

  return null
}