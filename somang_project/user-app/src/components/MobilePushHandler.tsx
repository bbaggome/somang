'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '@/lib/supabase/client'

export default function MobilePushHandler() {

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const initPush = async () => {
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

    initPush()
  }, [])

  return null
}