// src/services/fcmService2025.ts - Latest Expo Push Notifications (2025)
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ExpoFCMToken {
  expoPushToken: string;
  devicePushToken?: string; // Native FCM/APNs token
  deviceInfo: {
    platform: string;
    osVersion: string;
    model: string;
    isDevice: boolean;
  };
}

export class ModernFCMService {
  private static instance: ModernFCMService;
  private expoPushToken: string | null = null;
  private devicePushToken: string | null = null;

  static getInstance(): ModernFCMService {
    if (!ModernFCMService.instance) {
      ModernFCMService.instance = new ModernFCMService();
    }
    return ModernFCMService.instance;
  }

  /**
   * 2025년 최신 방식: Expo Push Token 등록
   */
  async registerForPushNotifications(): Promise<ExpoFCMToken | null> {
    console.log('🔔 Expo Push Notifications 등록 시작...');

    // 실제 디바이스 체크
    if (!Device.isDevice) {
      console.log('⚠️ 푸시 알림은 실제 기기에서만 작동합니다');
      Alert.alert('알림', '푸시 알림은 실제 기기에서만 작동합니다');
      return null;
    }

    try {
      // Android 알림 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'T-Bridge 기본 알림',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1e40af',
          description: 'T-Bridge 견적 및 일반 알림',
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
        });

        // 견적 전용 채널
        await Notifications.setNotificationChannelAsync('quotes', {
          name: 'T-Bridge 견적 알림',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#10b981',
          description: '새로운 견적 도착 시 알림',
          sound: 'default',
          enableVibrate: true,
        });

        console.log('📱 Android 알림 채널 설정 완료');
      }

      // 알림 권한 확인 및 요청
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log('🔍 현재 알림 권한 상태:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📝 알림 권한 요청 결과:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ 푸시 알림 권한이 거부되었습니다');
        Alert.alert('권한 필요', '푸시 알림을 받으려면 알림 권한이 필요합니다.');
        return null;
      }

      // Project ID 확인
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId ?? 
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error('❌ EAS Project ID가 설정되지 않았습니다');
        console.log('💡 app.json에서 extra.eas.projectId를 설정해주세요');
        return null;
      }

      console.log('🆔 EAS Project ID:', projectId);

      // Expo Push Token 획득
      const expoPushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.expoPushToken = expoPushTokenData.data;
      console.log('✅ Expo Push Token 획득:', this.expoPushToken.substring(0, 50) + '...');

      // Native Device Token 획득 (선택사항 - 직접 FCM/APNs 사용 시)
      try {
        const devicePushTokenData = await Notifications.getDevicePushTokenAsync();
        this.devicePushToken = devicePushTokenData.data;
        console.log('📱 Native Device Token 획득:', this.devicePushToken.substring(0, 30) + '...');
      } catch (error) {
        console.log('⚠️ Native Device Token 획득 실패 (선택사항):', error);
      }

      // 디바이스 정보 수집
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        model: Device.modelName || 'Unknown',
        isDevice: Device.isDevice,
      };

      console.log('📱 디바이스 정보:', deviceInfo);

      // AsyncStorage에 토큰 저장
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
      if (this.devicePushToken) {
        await AsyncStorage.setItem('devicePushToken', this.devicePushToken);
      }

      return {
        expoPushToken: this.expoPushToken,
        devicePushToken: this.devicePushToken || undefined,
        deviceInfo,
      };

    } catch (error) {
      console.error('❌ Push Notification 등록 실패:', error);
      return null;
    }
  }

  /**
   * 저장된 토큰들 반환
   */
  async getStoredTokens(): Promise<{ expoPushToken: string | null; devicePushToken: string | null }> {
    try {
      const expoPushToken = await AsyncStorage.getItem('expoPushToken');
      const devicePushToken = await AsyncStorage.getItem('devicePushToken');
      
      return {
        expoPushToken,
        devicePushToken,
      };
    } catch (error) {
      console.error('❌ 저장된 토큰 조회 실패:', error);
      return { expoPushToken: null, devicePushToken: null };
    }
  }

  /**
   * 알림 리스너 설정
   */
  setupNotificationListeners() {
    console.log('🔧 알림 리스너 설정...');

    // 포그라운드에서 알림 수신
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📩 포그라운드 알림 수신:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
      }
    );

    // 알림 클릭/터치 처리
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 알림 클릭됨:', {
          title: response.notification.request.content.title,
          data: response.notification.request.content.data,
        });

        // 알림 데이터 기반 네비게이션
        this.handleNotificationInteraction(response.notification.request.content.data);
      }
    );

    // 앱이 백그라운드에서 포그라운드로 올 때
    const appStateListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📱 앱 상태 변경으로 알림 처리:', response);
      }
    );

    // 정리 함수 반환
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
      Notifications.removeNotificationSubscription(appStateListener);
      console.log('🧹 알림 리스너 정리 완료');
    };
  }

  /**
   * 알림 상호작용 처리
   */
  private handleNotificationInteraction(data: any) {
    console.log('🧭 알림 상호작용 처리:', data);

    if (data?.type === 'quote_received') {
      console.log('📋 견적 알림 클릭 - 견적 상세로 이동:', data.quote_id);
      // TODO: React Navigation으로 견적 상세 페이지 이동
      // NavigationService.navigate('QuoteDetail', { quoteId: data.quote_id });
    } else if (data?.type === 'quote_updated') {
      console.log('🔄 견적 업데이트 알림 클릭:', data.quote_id);
      // TODO: 견적 목록 페이지로 이동
    }
  }

  /**
   * 테스트 로컬 알림 발송
   */
  async sendTestLocalNotification() {
    console.log('🧪 테스트 로컬 알림 발송...');

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 T-Bridge 테스트',
          body: '로컬 푸시 알림이 정상 작동합니다!',
          data: { 
            type: 'test_local',
            timestamp: Date.now(),
          },
          sound: 'default',
          badge: 1,
        },
        trigger: { seconds: 2 },
      });

      console.log('✅ 테스트 로컬 알림 예약 완료');
    } catch (error) {
      console.error('❌ 테스트 로컬 알림 실패:', error);
    }
  }

  /**
   * Expo Push Service를 통한 알림 발송 (서버에서 사용)
   */
  static async sendExpoPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        badge: 1,
        channelId: data?.type === 'quote_received' ? 'quotes' : 'default',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('📤 Expo Push 발송 결과:', result);

      return response.ok;
    } catch (error) {
      console.error('❌ Expo Push 발송 실패:', error);
      return false;
    }
  }

  /**
   * 현재 토큰들 반환
   */
  getTokens() {
    return {
      expoPushToken: this.expoPushToken,
      devicePushToken: this.devicePushToken,
    };
  }
}

// 기본 인스턴스 export
export const modernFCMService = ModernFCMService.getInstance();