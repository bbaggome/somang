// src/services/fcmService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface FCMToken {
  token: string;
  deviceInfo: {
    platform: string;
    osVersion: string;
    model: string;
  };
}

export class FCMService {
  private static instance: FCMService;
  private fcmToken: string | null = null;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  /**
   * FCM 푸시 알림 권한 요청 및 토큰 획득
   */
  async registerForPushNotifications(): Promise<FCMToken | null> {
    console.log('🔔 FCM 알림 등록 시작...');

    // 디바이스 체크
    if (!Device.isDevice) {
      console.log('⚠️ 실제 기기에서만 푸시 알림이 작동합니다');
      return null;
    }

    try {
      // Android 알림 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'T-Bridge 알림',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1e40af',
          description: 'T-Bridge 견적 알림',
        });
        console.log('📱 Android 알림 채널 설정 완료');
      }

      // 알림 권한 확인 및 요청
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log('🔍 기존 알림 권한 상태:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📝 알림 권한 요청 결과:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ 푸시 알림 권한이 거부되었습니다');
        return null;
      }

      // Expo Push Token 획득
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
      });

      this.fcmToken = pushTokenData.data;
      console.log('✅ FCM 토큰 획득 성공:', this.fcmToken.substring(0, 50) + '...');

      // 디바이스 정보 수집
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        model: Device.modelName || 'Unknown',
      };

      console.log('📱 디바이스 정보:', deviceInfo);

      return {
        token: this.fcmToken,
        deviceInfo,
      };
    } catch (error) {
      console.error('❌ FCM 등록 실패:', error);
      return null;
    }
  }

  /**
   * 현재 FCM 토큰 반환
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * 알림 처리 설정
   */
  setupNotificationHandlers() {
    console.log('🔧 알림 핸들러 설정 시작...');

    // 알림 표시 방식 설정
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('📩 알림 수신:', notification.request.content);
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

    // 포그라운드에서 알림 수신 리스너
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 포그라운드 알림 수신:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
      }
    );

    // 알림 클릭 리스너
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 알림 클릭됨:', {
          title: response.notification.request.content.title,
          data: response.notification.request.content.data,
        });

        // 알림 데이터를 기반으로 네비게이션 처리
        this.handleNotificationTap(response.notification.request.content.data);
      }
    );

    // 정리 함수 반환
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
      console.log('🧹 알림 리스너 정리 완료');
    };
  }

  /**
   * 알림 클릭 시 네비게이션 처리
   */
  private handleNotificationTap(data: any) {
    console.log('🧭 알림 네비게이션 처리:', data);
    
    if (data?.type === 'quote_received') {
      // 견적 상세 페이지로 이동
      console.log('📋 견적 페이지로 이동:', data.quoteId);
      // TODO: 네비게이션 구현
    } else if (data?.type === 'quote_updated') {
      // 견적 업데이트 페이지로 이동
      console.log('🔄 견적 업데이트 페이지로 이동:', data.quoteId);
      // TODO: 네비게이션 구현
    }
  }

  /**
   * 테스트용 로컬 알림 발송
   */
  async sendTestNotification() {
    console.log('🧪 테스트 알림 발송...');
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 T-Bridge 테스트 알림',
          body: '푸시 알림이 정상적으로 작동합니다!',
          data: { 
            type: 'test',
            timestamp: Date.now(),
          },
        },
        trigger: { seconds: 2 },
      });
      
      console.log('✅ 테스트 알림 예약 완료');
    } catch (error) {
      console.error('❌ 테스트 알림 발송 실패:', error);
    }
  }
}

// 기본 인스턴스 export
export const fcmService = FCMService.getInstance();