'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAppUrl = async () => {
      try {
        // 웹 환경에서는 Capacitor 모듈을 동적으로 로드
        if (typeof window !== 'undefined' && window.Capacitor) {
          const [{ Capacitor }, { App }] = await Promise.all([
            import('@capacitor/core'),
            import('@capacitor/app')
          ])
          
          if (!Capacitor.isNativePlatform()) return
          
          // 앱이 URL로 열렸을 때 처리
          App.addListener('appUrlOpen', (data) => {
            console.log('App opened with URL:', data.url)
            
            // HTTPS Supabase 콜백 URL 처리
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
                console.error('HTTPS URL parsing error:', error)
              }
            }
            
            // Custom URL Scheme 처리 (com.tbridge.userapp://login#access_token=...)
            if (data.url.startsWith('com.tbridge.userapp://') && data.url.includes('access_token=')) {
              try {
                console.log('Processing custom scheme URL:', data.url)
                
                // URL에서 해시 부분 추출
                const hashIndex = data.url.indexOf('#')
                if (hashIndex !== -1) {
                  const fragment = data.url.substring(hashIndex + 1) // # 제거
                  
                  if (fragment) {
                    // 현재 페이지 URL에 해시로 추가
                    window.location.hash = fragment
                    
                    // 로그인 페이지로 이동 (기존 토큰 처리 로직 실행)
                    router.push('/login')
                  }
                }
              } catch (error) {
                console.error('Custom scheme URL parsing error:', error)
              }
            }
          })
          
          // Cleanup function
          return () => {
            App.removeAllListeners()
          }
        }
      } catch (error) {
        console.log('Capacitor not available (web environment)', error)
      }
    }

    handleAppUrl()
  }, [router])

  return null
}