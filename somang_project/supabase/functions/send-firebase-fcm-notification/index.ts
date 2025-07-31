// supabase/functions/send-firebase-fcm-notification/index.ts - Firebase FCM HTTP v1 API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

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

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Firebase OAuth2 액세스 토큰 생성
async function getFirebaseAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  // JWT 생성
  const iat = getNumericDate(0);
  const exp = getNumericDate(3600); // 1시간 후

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Private key를 CryptoKey로 변환
  const privateKey = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // JWT 생성
  const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, cryptoKey);

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
    const error = await tokenResponse.text();
    throw new Error(`Failed to get Firebase access token: ${error}`);
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
    console.log('🚀 Firebase FCM HTTP v1 API 알림 발송 시작')

    // Service Account JSON 환경 변수 확인
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      throw new Error('FCM_SERVICE_ACCOUNT environment variable not set')
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson)
    console.log('📋 Service Account 로드 완료:', serviceAccount.project_id)

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

    // OAuth2 액세스 토큰 가져오기
    console.log('🔐 Firebase OAuth2 액세스 토큰 요청 중...')
    const accessToken = await getFirebaseAccessToken(serviceAccount)
    console.log('✅ Firebase 액세스 토큰 획득 성공')

    // FCM v1 API URL
    const fcmV1Url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    // 결과 저장
    const results: FCMResult[] = []
    let successCount = 0
    let failureCount = 0

    // 각 토큰에 대해 개별 요청 (v1 API는 batch를 지원하지 않음)
    for (const tokenData of targetTokens) {
      try {
        // FCM v1 메시지 페이로드
        const messagePayload = {
          message: {
            token: tokenData.fcm_token,
            notification: {
              title: notification.title,
              body: notification.body,
              image: notification.image,
            },
            data: {
              ...data,
              // 견적 관련 데이터 추가
              ...(quote_data && {
                type: 'quote_received',
                quote_id: quote_data.quote_id,
                business_name: quote_data.business_name,
                amount: quote_data.amount?.toString() || '',
              }),
              timestamp: Date.now().toString(),
            },
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
          },
        }

        console.log(`📤 FCM v1 메시지 전송 중... (${tokenData.fcm_token.substring(0, 20)}...)`)

        // FCM v1 API 호출
        const fcmResponse = await fetch(fcmV1Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(messagePayload),
        })

        const responseText = await fcmResponse.text()
        
        if (fcmResponse.ok) {
          // 성공
          const responseData = JSON.parse(responseText)
          results.push({
            user_id: tokenData.user_id,
            fcm_token: tokenData.fcm_token,
            success: true,
            message_id: responseData.name,
          })
          successCount++
          console.log('✅ 메시지 전송 성공:', responseData.name)
        } else {
          // 실패
          const errorData = JSON.parse(responseText)
          const errorCode = errorData.error?.details?.[0]?.errorCode || errorData.error?.code || 'UNKNOWN_ERROR'
          
          results.push({
            user_id: tokenData.user_id,
            fcm_token: tokenData.fcm_token,
            success: false,
            error: errorCode,
          })
          failureCount++
          console.log('❌ 메시지 전송 실패:', errorCode)

          // 토큰이 무효한 경우 DB에서 비활성화
          if (errorCode === 'UNREGISTERED' || 
              errorCode === 'INVALID_ARGUMENT' ||
              errorCode === 'SENDER_ID_MISMATCH') {
            
            console.log('🗑️ 무효한 Firebase FCM 토큰 비활성화:', tokenData.fcm_token.substring(0, 20))
            
            await supabase
              .from('user_fcm_tokens')
              .update({ is_active: false })
              .eq('fcm_token', tokenData.fcm_token)
          }
        }
      } catch (error) {
        console.error('❌ 토큰 처리 오류:', error)
        results.push({
          user_id: tokenData.user_id,
          fcm_token: tokenData.fcm_token,
          success: false,
          error: error.message,
        })
        failureCount++
      }
    }

    console.log(`✅ Firebase FCM v1 알림 발송 완료 - 성공: ${successCount}, 실패: ${failureCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
        service: 'firebase-fcm-v1',
        version: '2025-v1-http',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Firebase FCM v1 알림 발송 오류:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sent: 0,
        failed: 0,
        service: 'firebase-fcm-v1',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})