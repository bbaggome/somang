// src/services/supabaseExpoFCM.ts - 2025 Latest Expo Push with Supabase
import { supabase } from '../lib/supabase';
import type { ExpoFCMToken } from './fcmService2025';

export interface ExpoTokenRecord {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_push_token?: string;
  device_info: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseExpoFCMService {
  /**
   * Expo Push Token을 Supabase에 저장
   */
  static async saveExpoToken(tokenData: ExpoFCMToken): Promise<boolean> {
    try {
      console.log('💾 Expo Push Token Supabase 저장 시작...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return false;
      }

      console.log('👤 사용자 확인:', user.email);
      console.log('📱 저장할 Expo Token:', tokenData.expoPushToken.substring(0, 50) + '...');

      // upsert 방식으로 토큰 저장/업데이트
      const { data, error } = await supabase
        .from('user_expo_tokens')
        .upsert({
          user_id: user.id,
          expo_push_token: tokenData.expoPushToken,
          device_push_token: tokenData.devicePushToken,
          device_info: tokenData.deviceInfo,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,expo_push_token'
        });

      if (error) {
        console.error('❌ Expo Token 저장 실패:', error);
        return false;
      }

      console.log('✅ Expo Token 저장 성공');
      return true;

    } catch (error) {
      console.error('❌ Expo Token 저장 중 오류:', error);
      return false;
    }
  }

  /**
   * 사용자의 활성 Expo 토큰들 조회
   */
  static async getUserExpoTokens(): Promise<ExpoTokenRecord[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return [];
      }

      const { data, error } = await supabase
        .from('user_expo_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Expo Token 조회 실패:', error);
        return [];
      }

      console.log('📱 사용자 Expo Token 수:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ Expo Token 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * Expo 테스트 알림 발송 (새로운 Edge Function 사용)
   */
  static async sendTestExpoNotification(): Promise<boolean> {
    try {
      console.log('🧪 테스트 Expo 알림 발송...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError);
        return false;
      }

      // 새로운 Edge Function 호출
      const { data, error } = await supabase.functions.invoke('send-expo-notification', {
        body: {
          user_ids: [user.id],
          notification: {
            title: '🧪 T-Bridge Expo 테스트',
            body: 'Expo Push Service 테스트가 성공적으로 완료되었습니다!',
            sound: 'default',
            badge: 1,
            data: {
              type: 'test_expo',
              timestamp: Date.now(),
            },
          },
        },
      });

      if (error) {
        console.error('❌ 테스트 Expo 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 테스트 Expo 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 테스트 Expo 알림 발송 중 오류:', error);
      return false;
    }
  }

  /**
   * 견적 도착 알림 발송 (실제 사용)
   */
  static async sendQuoteExpoNotification(
    userId: string,
    quoteData: {
      quote_id: string;
      business_name: string;
      amount?: number;
      customer_name?: string;
    }
  ): Promise<boolean> {
    try {
      console.log('📋 견적 Expo 알림 발송:', quoteData);

      const { data, error } = await supabase.functions.invoke('send-expo-notification', {
        body: {
          user_ids: [userId],
          notification: {
            title: `💰 ${quoteData.business_name}`,
            body: quoteData.amount 
              ? `새 견적이 도착했습니다! 금액: ${quoteData.amount.toLocaleString()}원`
              : '새로운 견적이 도착했습니다!',
            sound: 'default',
            badge: 1,
            data: {
              type: 'quote_received',
              quote_id: quoteData.quote_id,
              business_name: quoteData.business_name,
              amount: quoteData.amount?.toString(),
            },
            channelId: 'quotes', // Android 전용 채널
          },
          quote_data: quoteData,
        },
      });

      if (error) {
        console.error('❌ 견적 Expo 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 견적 Expo 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 견적 Expo 알림 발송 중 오류:', error);
      return false;
    }
  }

  /**
   * 여러 사용자에게 일괄 알림 발송
   */
  static async sendBulkExpoNotification(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<boolean> {
    try {
      console.log('📤 일괄 Expo 알림 발송:', userIds.length, '명');

      const { data, error } = await supabase.functions.invoke('send-expo-notification', {
        body: {
          user_ids: userIds,
          notification: {
            ...notification,
            sound: 'default',
            badge: 1,
          },
        },
      });

      if (error) {
        console.error('❌ 일괄 Expo 알림 발송 실패:', error);
        return false;
      }

      console.log('✅ 일괄 Expo 알림 발송 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ 일괄 Expo 알림 발송 중 오류:', error);
      return false;
    }
  }

  /**
   * 토큰 비활성화
   */
  static async deactivateExpoToken(expoPushToken: string): Promise<boolean> {
    try {
      console.log('🗑️ Expo Token 비활성화:', expoPushToken.substring(0, 20) + '...');

      const { error } = await supabase
        .from('user_expo_tokens')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('expo_push_token', expoPushToken);

      if (error) {
        console.error('❌ Expo Token 비활성화 실패:', error);
        return false;
      }

      console.log('✅ Expo Token 비활성화 성공');
      return true;

    } catch (error) {
      console.error('❌ Expo Token 비활성화 중 오류:', error);
      return false;
    }
  }
}