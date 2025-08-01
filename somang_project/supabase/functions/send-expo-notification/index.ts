// supabase/functions/send-expo-notification/index.ts - 2025 Latest Expo Push Service
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Expo Push Service 타입
interface ExpoToken {
  user_id: string;
  expo_push_token: string;
  device_push_token?: string;
  is_active: boolean;
  device_info?: any;
}

interface ExpoNotificationPayload {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  channelId?: string; // Android 전용
}

interface ExpoResult {
  user_id: string;
  expo_push_token: string;
  success: boolean;
  error?: string;
  receipt_id?: string;
}

interface RequestBody {
  // 특정 사용자들에게 발송
  user_ids?: string[];
  // 또는 직접 Expo Push Token들 제공
  expo_push_tokens?: string[];
  // 알림 내용
  notification: ExpoNotificationPayload;
  // 견적 관련 데이터 (옵션)
  quote_data?: {
    quote_id: string;
    business_name: string;
    amount?: number;
  };
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

serve(async (req: Request) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Expo Push Notification 발송 시작')

    // Supabase 클라이언트 생성
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 요청 바디 파싱
    const requestBody: RequestBody = await req.json()
    const { user_ids, expo_push_tokens, notification, quote_data } = requestBody

    console.log('📨 요청 내용:', {
      user_ids: user_ids?.length || 0,
      expo_push_tokens: expo_push_tokens?.length || 0,
      notification_title: notification.title,
    })

    let targetTokens: ExpoToken[] = []

    // user_ids가 제공된 경우 DB에서 Expo 토큰 조회
    if (user_ids && user_ids.length > 0) {
      const { data: expoTokensData, error } = await supabase
        .from('user_expo_tokens')
        .select('user_id, expo_push_token, device_push_token, is_active, device_info')
        .in('user_id', user_ids)
        .eq('is_active', true)

      if (error) {
        console.error('❌ Expo 토큰 조회 실패:', error)
        throw new Error('Failed to fetch Expo tokens from database')
      }

      targetTokens = expoTokensData || []
      console.log('📱 DB에서 조회한 Expo 토큰 수:', targetTokens.length)
    }

    // 직접 Expo 토큰이 제공된 경우
    if (expo_push_tokens && expo_push_tokens.length > 0) {
      const directTokens: ExpoToken[] = expo_push_tokens.map(token => ({
        user_id: 'direct',
        expo_push_token: token,
        is_active: true,
      }))
      targetTokens = [...targetTokens, ...directTokens]
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid Expo tokens found',
          sent: 0,
          failed: 0,
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎯 대상 Expo 토큰 수:', targetTokens.length)

    // Expo Push Messages 구성
    const expoMessages: ExpoMessage[] = targetTokens.map(tokenData => ({
      to: tokenData.expo_push_token,
      title: notification.title,
      body: notification.body,
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
      sound: notification.sound || 'default',
      badge: notification.badge || 1,
      channelId: notification.channelId || 'default',
      priority: 'high',
    }))

    console.log('📦 Expo Messages 구성 완료:', expoMessages.length)

    // Expo Push Service API 호출
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoMessages),
    })

    if (!expoResponse.ok) {
      throw new Error(`Expo Push Service error: ${expoResponse.status} ${expoResponse.statusText}`)
    }

    const expoResult = await expoResponse.json()
    console.log('📡 Expo Push Service 응답:', expoResult)

    // 결과 처리
    const results: ExpoResult[] = []
    let successCount = 0
    let failureCount = 0

    if (Array.isArray(expoResult.data)) {
      expoResult.data.forEach((result: any, index: number) => {
        const token = targetTokens[index]
        
        if (result.status === 'ok') {
          // 성공
          results.push({
            user_id: token.user_id,
            expo_push_token: token.expo_push_token,
            success: true,
            receipt_id: result.id,
          })
          successCount++
        } else {
          // 실패
          results.push({
            user_id: token.user_id,
            expo_push_token: token.expo_push_token,
            success: false,
            error: result.message || result.details?.error || 'Unknown error',
          })
          failureCount++

          // 토큰이 무효한 경우 DB에서 비활성화
          if (result.details?.error === 'DeviceNotRegistered' || 
              result.details?.error === 'InvalidCredentials' ||
              result.details?.error === 'MessageTooBig') {
            
            console.log('🗑️ 무효한 Expo 토큰 비활성화:', token.expo_push_token.substring(0, 20))
            
            supabase
              .from('user_expo_tokens')
              .update({ 
                is_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq('expo_push_token', token.expo_push_token)
              .then(() => console.log('✅ Expo 토큰 비활성화 완료'))
              .catch(err => console.error('❌ Expo 토큰 비활성화 실패:', err))
          }
        }
      })
    } else if (expoResult.status === 'ok') {
      // 단일 메시지 성공
      results.push({
        user_id: targetTokens[0].user_id,
        expo_push_token: targetTokens[0].expo_push_token,
        success: true,
        receipt_id: expoResult.id,
      })
      successCount = 1
    } else {
      // 단일 메시지 실패
      results.push({
        user_id: targetTokens[0].user_id,
        expo_push_token: targetTokens[0].expo_push_token,
        success: false,
        error: expoResult.message || 'Unknown error',
      })
      failureCount = 1
    }

    console.log(`✅ Expo Push 알림 발송 완료 - 성공: ${successCount}, 실패: ${failureCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
        expo_response: expoResult,
        service: 'expo-push-service',
        version: '2025-v1',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Expo Push 알림 발송 오류:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sent: 0,
        failed: 0,
        service: 'expo-push-service',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})