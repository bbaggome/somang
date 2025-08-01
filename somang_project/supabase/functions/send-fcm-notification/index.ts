// supabase/functions/send-firebase-fcm-notification/index.ts - Firebase FCM V1 API 직접 사용
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Firebase FCM 타입 정의
interface FCMToken {
  user_id: string;
  fcm_token: string;
  apns_token?: string;
  is_active: boolean;
  device_info?: any;
}

interface FCMNotificationPayload {
  title: string;
  body: string;
  image?: string;
  android?: {
    channel_id?: string;
    priority?: 'min' | 'low' | 'default' | 'high' | 'max';
    sound?: string;
    color?: string;
    icon?: string;
    tag?: string;
  };
  apns?: {
    payload?: {
      aps?: {
        sound?: string;
        badge?: number;
        'mutable-content'?: number;
        category?: string;
      };
    };
  };
}

interface FCMResult {
  user_id: string;
  fcm_token: string;
  success: boolean;
  error?: string;
  message_id?: string;
}

interface RequestBody {
  // 특정 사용자들에게 발송
  user_ids?: string[];
  // 또는 직접 FCM 토큰들 제공
  fcm_tokens?: string[];
  // 알림 내용
  notification: FCMNotificationPayload;
  // 추가 데이터
  data?: any;
  // 견적 관련 데이터 (옵션)
  quote_data?: {
    quote_id: string;
    business_name: string;
    amount?: number;
  };
}

serve(async (req: Request) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔥 Firebase FCM V1 알림 발송 시작')

    // Firebase Project ID 및 Service Account 확인
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')
    const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    
    if (!firebaseProjectId || !firebaseServiceAccount) {
      throw new Error('Firebase configuration not set: FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON required')
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 요청 바디 파싱
    const requestBody: RequestBody = await req.json()
    const { user_ids, fcm_tokens, notification, data, quote_data } = requestBody

    console.log('📨 Firebase FCM 요청 내용:', {
      user_ids: user_ids?.length || 0,
      fcm_tokens: fcm_tokens?.length || 0,
      notification_title: notification.title,
    })

    let targetTokens: FCMToken[] = []

    // user_ids가 제공된 경우 DB에서 FCM 토큰 조회
    if (user_ids && user_ids.length > 0) {
      const { data: fcmTokensData, error } = await supabase
        .from('user_fcm_tokens')
        .select('user_id, fcm_token, is_active, device_info')
        .in('user_id', user_ids)
        .eq('is_active', true)

      if (error) {
        console.error('❌ FCM 토큰 조회 실패:', error)
        throw new Error('Failed to fetch FCM tokens from database')
      }

      targetTokens = fcmTokensData || []
      console.log('📱 DB에서 조회한 FCM 토큰 수:', targetTokens.length)
    }

    // 직접 FCM 토큰이 제공된 경우
    if (fcm_tokens && fcm_tokens.length > 0) {
      const directTokens: FCMToken[] = fcm_tokens.map(token => ({
        user_id: 'direct',
        fcm_token: token,
        is_active: true,
      }))
      targetTokens = [...targetTokens, ...directTokens]
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid FCM tokens found',
          sent: 0,
          failed: 0,
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎯 대상 FCM 토큰 수:', targetTokens.length)

    // FCM 알림 페이로드 구성
    const fcmPayload = {
      registration_ids: targetTokens.map(t => t.fcm_token),
      notification: {
        title: notification.title,
        body: notification.body,
        sound: notification.sound || 'default',
        badge: notification.badge,
        click_action: notification.click_action,
      },
      data: {
        ...notification.data,
        // 견적 관련 데이터 추가
        ...(quote_data && {
          type: 'quote_received',
          quote_id: quote_data.quote_id,
          business_name: quote_data.business_name,
          amount: quote_data.amount?.toString(),
        }),
        timestamp: Date.now().toString(),
      },
      priority: 'high',
      // Android 설정
      android: {
        priority: 'high',
        notification: {
          channel_id: 'default',
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
          default_light_settings: true,
        },
      },
      // iOS 설정  
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: notification.badge || 1,
          },
        },
      },
    }

    console.log('📦 FCM 페이로드 구성 완료')

    // FCM API 호출
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify(fcmPayload),
    })

    const fcmResult = await fcmResponse.json()
    console.log('📡 FCM API 응답:', fcmResult)

    // 결과 처리
    const results: FCMResult[] = []
    let successCount = 0
    let failureCount = 0

    if (fcmResult.results && Array.isArray(fcmResult.results)) {
      fcmResult.results.forEach((result: any, index: number) => {
        const token = targetTokens[index]
        
        if (result.message_id) {
          // 성공
          results.push({
            user_id: token.user_id,
            fcm_token: token.fcm_token,
            success: true,
            message_id: result.message_id,
          })
          successCount++
        } else if (result.error) {
          // 실패
          results.push({
            user_id: token.user_id,
            fcm_token: token.fcm_token,
            success: false,
            error: result.error,
          })
          failureCount++

          // 토큰이 무효한 경우 DB에서 비활성화
          if (result.error === 'NotRegistered' || result.error === 'InvalidRegistration') {
            console.log('🗑️ 무효한 FCM 토큰 비활성화:', token.fcm_token.substring(0, 20))
            
            supabase
              .from('user_fcm_tokens')
              .update({ is_active: false })
              .eq('fcm_token', token.fcm_token)
              .then(() => console.log('✅ FCM 토큰 비활성화 완료'))
              .catch(err => console.error('❌ FCM 토큰 비활성화 실패:', err))
          }
        }
      })
    }

    console.log(`✅ FCM 알림 발송 완료 - 성공: ${successCount}, 실패: ${failureCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
        fcm_response: fcmResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ FCM 알림 발송 오류:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sent: 0,
        failed: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})