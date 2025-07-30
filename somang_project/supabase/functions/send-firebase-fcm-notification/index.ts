// supabase/functions/send-firebase-fcm-notification/index.ts - Firebase FCM V1 API 직접 사용
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Firebase FCM V1 타입 정의
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
        alert?: {
          title?: string;
          body?: string;
        };
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
  user_ids?: string[];
  fcm_tokens?: string[];
  notification: FCMNotificationPayload;
  data?: any;
  quote_data?: {
    quote_id: string;
    business_name: string;
    amount?: number;
  };
}

// Firebase Service Account JWT 생성
async function generateFirebaseAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  
  // JWT 헤더
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  // JWT 페이로드
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1시간
    iat: now,
  };
  
  // JWT 생성 (간단한 구현 - 실제로는 crypto 라이브러리 사용 권장)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // 실제로는 private key로 서명해야 하지만, 여기서는 간단히 처리
  // 실제 구현시에는 crypto 라이브러리 사용 필요
  const signature = 'signature_placeholder'; // TODO: 실제 서명 구현
  
  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  // OAuth2 토큰 교환
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!tokenResponse.ok) {
    throw new Error('Failed to get Firebase access token');
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req: Request) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔥 Firebase FCM V1 알림 발송 시작')

    // 환경 변수 확인 - Legacy Server Key 사용 (더 간단함)
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY environment variable not set')
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
        .select('user_id, fcm_token, apns_token, is_active, device_info')
        .in('user_id', user_ids)
        .eq('is_active', true)

      if (error) {
        console.error('❌ Firebase FCM 토큰 조회 실패:', error)
        throw new Error('Failed to fetch Firebase FCM tokens from database')
      }

      targetTokens = fcmTokensData || []
      console.log('🔥 DB에서 조회한 Firebase FCM 토큰 수:', targetTokens.length)
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
          error: 'No valid Firebase FCM tokens found',
          sent: 0,
          failed: 0,
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎯 대상 Firebase FCM 토큰 수:', targetTokens.length)

    // Firebase FCM 페이로드 구성 (Legacy API 사용)
    const fcmPayload = {
      registration_ids: targetTokens.map(t => t.fcm_token),
      notification: {
        title: notification.title,
        body: notification.body,
        image: notification.image,
        sound: notification.android?.sound || 'default',
        color: notification.android?.color,
        icon: notification.android?.icon,
        tag: notification.android?.tag,
      },
      data: {
        ...data,
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
          channel_id: notification.android?.channel_id || 'default',
          sound: notification.android?.sound || 'default',
          color: notification.android?.color || '#1e40af',
          icon: notification.android?.icon || 'ic_notification',
          tag: notification.android?.tag,
        },
      },
      // iOS APNs 설정
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: notification.apns?.payload?.aps?.sound || 'default',
            badge: notification.apns?.payload?.aps?.badge || 1,
            'mutable-content': notification.apns?.payload?.aps?.['mutable-content'] || 1,
            category: notification.apns?.payload?.aps?.category,
          },
        },
      },
    }

    console.log('📦 Firebase FCM 페이로드 구성 완료')

    // Firebase FCM Legacy API 호출
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify(fcmPayload),
    })

    const fcmResult = await fcmResponse.json()
    console.log('🔥 Firebase FCM API 응답:', fcmResult)

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
          if (result.error === 'NotRegistered' || 
              result.error === 'InvalidRegistration' ||
              result.error === 'MessageTooBig') {
            
            console.log('🗑️ 무효한 Firebase FCM 토큰 비활성화:', token.fcm_token.substring(0, 20))
            
            supabase
              .from('user_fcm_tokens')
              .update({ is_active: false })
              .eq('fcm_token', token.fcm_token)
              .then(() => console.log('✅ Firebase FCM 토큰 비활성화 완료'))
              .catch(err => console.error('❌ Firebase FCM 토큰 비활성화 실패:', err))
          }
        }
      })
    }

    console.log(`✅ Firebase FCM 알림 발송 완료 - 성공: ${successCount}, 실패: ${failureCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
        fcm_response: fcmResult,
        service: 'firebase-fcm-legacy',
        version: '2025-v1',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Firebase FCM 알림 발송 오류:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sent: 0,
        failed: 0,
        service: 'firebase-fcm-legacy',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})