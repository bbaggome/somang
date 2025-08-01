// src/services/supabaseFCM.ts
import { supabase } from '../lib/supabase';
import type { FCMToken } from './fcmService';

export interface FCMTokenRecord {
  id: string;
  user_id: string;
  fcm_token: string;
  device_info: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseFCMService {
  /**
   * FCM 토큰을 Supabase에 저장/업데이트
   */
  static async saveFCMToken(fcmData: FCMToken): Promise<boolean> {
    try {
      console.log('💾 FCM 토큰 Supabase 저장 시작...');

      // 현재 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return false;
      }

      console.log('👤 사용자 확인됨:', user.email);
      console.log('📱 저장할 FCM 토큰:', fcmData.token.substring(0, 50) + '...');

      // upsert_fcm_token 함수 호출 (중복 처리)
      const { data, error } = await supabase.rpc('upsert_fcm_token', {
        p_user_id: user.id,
        p_fcm_token: fcmData.token,
        p_device_info: fcmData.deviceInfo,
      });

      if (error) {
        console.error('❌ FCM 토큰 저장 실패:', error);
        return false;
      }

      console.log('✅ FCM 토큰 저장 성공, ID:', data);
      return true;

    } catch (error) {
      console.error('❌ FCM 토큰 저장 중 오류:', error);
      return false;
    }
  }

  /**
   * 현재 사용자의 FCM 토큰 목록 조회
   */
  static async getUserFCMTokens(): Promise<FCMTokenRecord[]> {
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
        console.error('❌ FCM 토큰 조회 실패:', error);
        return [];
      }

      console.log('📱 사용자 FCM 토큰 수:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ FCM 토큰 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * FCM 토큰 비활성화
   */
  static async deactivateFCMToken(fcmToken: string): Promise<boolean> {
    try {
      console.log('🗑️ FCM 토큰 비활성화:', fcmToken.substring(0, 20) + '...');

      const { error } = await supabase
        .from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('fcm_token', fcmToken);

      if (error) {
        console.error('❌ FCM 토큰 비활성화 실패:', error);
        return false;
      }

      console.log('✅ FCM 토큰 비활성화 성공');
      return true;

    } catch (error) {
      console.error('❌ FCM 토큰 비활성화 중 오류:', error);
      return false;
    }
  }

  /**
   * 테스트용: FCM 알림 발송 (Edge Function 호출)
   */
  static async sendTestFCMNotification(): Promise<boolean> {
    try {
      console.log('🧪 테스트 FCM 알림 발송...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return false;
      }

      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          user_ids: [user.id],
          notification: {
            title: '🧪 T-Bridge 테스트 알림',
            body: 'FCM 푸시 알림 테스트가 성공적으로 완료되었습니다!',
            sound: 'default',
            badge: 1,
          },
          quote_data: {
            quote_id: 'test-quote-123',
            business_name: '테스트 통신사',
            amount: 50000,
          },
        },
      });

      if (error) {
        console.error('❌ 테스트 FCM 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 테스트 FCM 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 테스트 FCM 알림 발송 중 오류:', error);
      return false;
    }
  }

  /**
   * 견적 알림 발송 (실제 사용용)
   */
  static async sendQuoteNotification(
    userId: string,
    quoteData: {
      quote_id: string;
      business_name: string;
      amount?: number;
    }
  ): Promise<boolean> {
    try {
      console.log('📋 견적 알림 발송:', quoteData);

      const { data, error } = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          user_ids: [userId],
          notification: {
            title: `💰 ${quoteData.business_name}에서 견적이 도착했습니다!`,
            body: quoteData.amount 
              ? `견적 금액: ${quoteData.amount.toLocaleString()}원`
              : '견적 내용을 확인해보세요.',
            sound: 'default',
            badge: 1,
            click_action: 'QUOTE_DETAIL',
          },
          quote_data: quoteData,
        },
      });

      if (error) {
        console.error('❌ 견적 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 견적 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 견적 알림 발송 중 오류:', error);
      return false;
    }
  }
}