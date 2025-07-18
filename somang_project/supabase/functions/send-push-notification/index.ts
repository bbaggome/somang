// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 타입 정의
interface PushResult {
  user_id: string;
  endpoint: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  is_active: boolean;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

interface RequestBody {
  subscriptions: PushSubscription[];
  payload: NotificationPayload;
}

serve(async (req: Request) => {
  // CORS 헤더 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 환경 변수 확인
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:jackson@adasoft.kr'

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error('VAPID keys not configured')
    }

    // 요청 바디 파싱
    const { subscriptions, payload }: RequestBody = await req.json()

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid subscriptions provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results: PushResult[] = []

    // 각 구독에 대해 Push 알림 발송
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        }

        // Web Push 라이브러리 사용
        const webpush = await import('https://esm.sh/web-push@3.6.6')
        
        // VAPID 설정
        webpush.setVapidDetails(
          vapidSubject,
          vapidPublicKey,
          vapidPrivateKey
        )

        // Push 알림 발송
        const response = await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 86400, // 24시간
            urgency: 'high',
          }
        )

        results.push({
          user_id: subscription.user_id,
          endpoint: subscription.endpoint,
          success: true,
          statusCode: response.statusCode,
        })

        console.log(`Push sent successfully to user ${subscription.user_id}`)

      } catch (error: any) {
        console.error(`Failed to send push to user ${subscription.user_id}:`, error)
        
        results.push({
          user_id: subscription.user_id,
          endpoint: subscription.endpoint,
          success: false,
          error: error.message,
        })

        // 구독이 무효한 경우 DB에서 비활성화
        if (error.statusCode === 410 || error.statusCode === 404) {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )

          await supabase
            .from('user_push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', subscription.user_id)
            .eq('endpoint', subscription.endpoint)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Push notification error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})