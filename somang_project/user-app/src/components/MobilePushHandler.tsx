'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function MobilePushHandler() {

  useEffect(() => {
    const initPush = async () => {
      try {
        // 웹 환경에서는 Capacitor 모듈을 동적으로 로드
        if (typeof window !== 'undefined' && window.Capacitor) {
          const [{ Capacitor }, { PushNotifications }] = await Promise.all([
            import('@capacitor/core'),
            import('@capacitor/push-notifications')
          ])
          
          if (!Capacitor.isNativePlatform()) return
          
          // 권한 요청
          const permResult = await PushNotifications.requestPermissions()
          
          if (permResult.receive === 'granted') {
            // FCM 토큰 등록
            await PushNotifications.register()
          }

          // 토큰 수신 리스너
          await PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value)
            
            // Supabase에 토큰 저장
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              await supabase
                .from('user_push_subscriptions')
                .upsert({
                  user_id: user.id,
                  endpoint: `fcm:${token.value}`,
                  auth: '',
                  p256dh: '',
                  device_info: {
                    platform: Capacitor.getPlatform(),
                    type: 'mobile'
                  }
                })
            }
          })

          // 에러 리스너
          await PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + error)
          })

          // 알림 수신 리스너
          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ', notification)
          })

          // 알림 액션 리스너
          await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ', notification)
          })
        }
      } catch (error) {
        console.log('Capacitor not available (web environment)', error)
      }
    }

    initPush()
  }, [])

  return null
}