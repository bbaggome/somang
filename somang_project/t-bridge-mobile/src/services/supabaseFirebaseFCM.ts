// src/services/supabaseFirebaseFCM.ts - Firebase FCM + Supabase 통합
import { supabase } from '../lib/supabase';
import type { FirebaseFCMToken } from './firebaseFCMService';

export interface FirebaseFCMTokenRecord {
  id: string;
  user_id: string;
  fcm_token: string;
  apns_token?: string;
  device_info: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseFirebaseFCMService {
  /**
   * Firebase FCM 토큰을 Supabase에 저장
   */
  static async saveFirebaseFCMToken(tokenData: FirebaseFCMToken): Promise<boolean> {
    try {
      console.log('💾 Firebase FCM 토큰 Supabase 저장 시작...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return false;
      }

      console.log('👤 사용자 확인:', user.email);
      console.log('🔥 저장할 Firebase FCM 토큰:', tokenData.fcmToken.substring(0, 50) + '...');

      // 기존 FCM 토큰 테이블 사용 (firebase 컬럼 추가 필요)
      const { data, error } = await supabase
        .from('user_fcm_tokens')
        .upsert({
          user_id: user.id,
          fcm_token: tokenData.fcmToken,
          apns_token: tokenData.apnsToken,
          device_info: tokenData.deviceInfo,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,fcm_token'
        });

      if (error) {
        console.error('❌ Firebase FCM 토큰 저장 실패:', error);
        return false;
      }

      console.log('✅ Firebase FCM 토큰 저장 성공');
      return true;

    } catch (error) {
      console.error('❌ Firebase FCM 토큰 저장 중 오류:', error);
      return false;
    }
  }

  /**
   * 사용자의 활성 Firebase FCM 토큰들 조회
   */
  static async getUserFirebaseFCMTokens(): Promise<FirebaseFCMTokenRecord[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return [];
      }

      const { data, error } = await supabase
        .from('user_fcm_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Firebase FCM 토큰 조회 실패:', error);
        return [];
      }

      console.log('🔥 사용자 Firebase FCM 토큰 수:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ Firebase FCM 토큰 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * Firebase FCM 테스트 알림 발송 (Edge Function 사용)
   */
  static async sendTestFirebaseFCMNotification(): Promise<boolean> {
    try {
      console.log('🧪 테스트 Firebase FCM 알림 발송...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return false;
      }

      // Firebase FCM Edge Function 호출
      const { data, error } = await supabase.functions.invoke('send-firebase-fcm-notification', {
        body: {
          user_ids: [user.id],
          notification: {
            title: '🔥 T-Bridge Firebase FCM 테스트',
            body: 'Firebase FCM 직접 연동 테스트가 성공적으로 완료되었습니다!',
            android: {
              channel_id: 'default',
              priority: 'high',
              sound: 'default',
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          },
          data: {
            type: 'test_firebase_fcm',
            timestamp: Date.now().toString(),
          },
        },
      });

      if (error) {
        console.error('❌ 테스트 Firebase FCM 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 테스트 Firebase FCM 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 테스트 Firebase FCM 알림 발송 중 오류:', error);
      return false;
    }
  }

  /**
   * 견적 도착 Firebase FCM 알림 발송
   */
  static async sendQuoteFirebaseFCMNotification(
    userId: string,
    quoteData: {
      quote_id: string;
      business_name: string;
      amount?: number;
      customer_name?: string;
    }
  ): Promise<boolean> {
    try {
      console.log('📋 견적 Firebase FCM 알림 발송:', quoteData);

      const { data, error } = await supabase.functions.invoke('send-firebase-fcm-notification', {
        body: {
          user_ids: [userId],
          notification: {
            title: `💰 ${quoteData.business_name}`,
            body: quoteData.amount 
              ? `새 견적이 도착했습니다! 금액: ${quoteData.amount.toLocaleString()}원`
              : '새로운 견적이 도착했습니다!',
            android: {
              channel_id: 'quotes',
              priority: 'high',
              sound: 'default',
              color: '#10b981',
              icon: 'ic_notification',
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'mutable-content': 1,
                },
              },
            },
          },
          data: {
            type: 'quote_received',
            quote_id: quoteData.quote_id,
            business_name: quoteData.business_name,
            amount: quoteData.amount?.toString(),
            click_action: 'QUOTE_DETAIL',
          },
        },
      });

      if (error) {
        console.error('❌ 견적 Firebase FCM 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 견적 Firebase FCM 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 견적 Firebase FCM 알림 발송 중 오류:', error);
      return false;
    }
  }

  /**
   * 여러 사용자에게 Firebase FCM 일괄 알림 발송
   */
  static async sendBulkFirebaseFCMNotification(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<boolean> {
    try {
      console.log('📤 일괄 Firebase FCM 알림 발송:', userIds.length, '명');

      const { data, error } = await supabase.functions.invoke('send-firebase-fcm-notification', {
        body: {
          user_ids: userIds,
          notification: {
            ...notification,
            android: {
              channel_id: 'default',
              priority: 'high',
              sound: 'default',
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          },
          data: notification.data || {},
        },
      });

      if (error) {
        console.error('❌ 일괄 Firebase FCM 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 일괄 Firebase FCM 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 일괄 Firebase FCM 알림 발송 중 오료:', error);
      return false;
    }
  }

  /**
   * Firebase FCM 토큰 비활성화
   */
  static async deactivateFirebaseFCMToken(fcmToken: string): Promise<boolean> {
    try {
      console.log('🗑️ Firebase FCM 토큰 비활성화:', fcmToken.substring(0, 20) + '...');

      const { error } = await supabase
        .from('user_fcm_tokens')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('fcm_token', fcmToken);

      if (error) {
        console.error('❌ Firebase FCM 토큰 비활성화 실패:', error);
        return false;
      }

      console.log('✅ Firebase FCM 토큰 비활성화 성공');
      return true;

    } catch (error) {
      console.error('❌ Firebase FCM 토큰 비활성화 중 오류:', error);
      return false;
    }
  }
}