// src/services/firebaseFCMService.ts - Firebase FCM 직접 구현
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export interface FirebaseFCMToken {
  fcmToken: string;
  apnsToken?: string; // iOS용
  deviceInfo: {
    platform: string;
    osVersion: string;
    model: string;
    isDevice: boolean;
  };
}

export class FirebaseFCMService {
  private static instance: FirebaseFCMService;
  private fcmToken: string | null = null;
  private apnsToken: string | null = null;

  static getInstance(): FirebaseFCMService {
    if (!FirebaseFCMService.instance) {
      FirebaseFCMService.instance = new FirebaseFCMService();
    }
    return FirebaseFCMService.instance;
  }

  /**
   * Firebase FCM 초기화 및 토큰 획득
   */
  async initializeFirebaseMessaging(): Promise<FirebaseFCMToken | null> {
    console.log('🔥 Firebase FCM 초기화 시작...');

    try {
      // expo-notifications 설정 (포그라운드에서도 알림 표시)
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('🔔 Notification Handler 호출됨:', notification.request.content.title);
          
          return {
            shouldShowAlert: true,    // 포그라운드에서도 알림 배너 표시
            shouldPlaySound: true,    // 알림 소리
            shouldSetBadge: true,     // 배지 업데이트
          };
        },
      });

      // 실제 디바이스 체크
      if (!Device.isDevice) {
        console.log('⚠️ Firebase FCM은 실제 기기에서만 작동합니다');
        Alert.alert('알림', 'FCM 푸시 알림은 실제 기기에서만 작동합니다');
        return null;
      }

      // Android 권한 요청 및 알림 채널 설정
      if (Platform.OS === 'android') {
        await this.requestAndroidPermissions();
        await this.setupAndroidNotificationChannel();
      }

      // FCM 권한 확인 및 요청
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('❌ FCM 권한이 거부되었습니다');
        Alert.alert('권한 필요', 'FCM 푸시 알림을 받으려면 권한이 필요합니다.');
        return null;
      }

      console.log('✅ FCM 권한 획득 성공:', authStatus);

      // FCM 토큰 획득
      const fcmToken = await messaging().getToken();
      if (!fcmToken) {
        console.log('❌ FCM 토큰 획득 실패');
        return null;
      }

      this.fcmToken = fcmToken;
      console.log('🔥 Firebase FCM 토큰 획득 성공:', fcmToken.substring(0, 50) + '...');

      // iOS APNS 토큰 획득 (선택사항)
      if (Platform.OS === 'ios') {
        try {
          const apnsToken = await messaging().getAPNSToken();
          if (apnsToken) {
            this.apnsToken = apnsToken;
            console.log('🍎 APNS 토큰 획득 성공:', apnsToken.substring(0, 30) + '...');
          }
        } catch (error) {
          console.log('⚠️ APNS 토큰 획득 실패 (선택사항):', error);
        }
      }

      // 디바이스 정보 수집
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        model: Device.modelName || 'Unknown',
        isDevice: Device.isDevice,
      };

      // AsyncStorage에 토큰 저장
      await AsyncStorage.setItem('firebaseFCMToken', fcmToken);
      if (this.apnsToken) {
        await AsyncStorage.setItem('apnsToken', this.apnsToken);
      }

      console.log('📱 디바이스 정보:', deviceInfo);

      return {
        fcmToken,
        apnsToken: this.apnsToken || undefined,
        deviceInfo,
      };

    } catch (error) {
      console.error('❌ Firebase FCM 초기화 실패:', error);
      return null;
    }
  }

  /**
   * Android 알림 채널 설정
   */
  private async setupAndroidNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync('quote_notifications', {
        name: '견적 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e40af',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e40af',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      console.log('✅ Android 알림 채널 설정 완료');
    } catch (error) {
      console.error('❌ Android 알림 채널 설정 실패:', error);
    }
  }

  /**
   * Android 권한 요청
   */
  private async requestAndroidPermissions(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'T-Bridge 알림 권한',
          message: '견적 도착 알림을 받으려면 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Android 알림 권한 획득');
      } else {
        console.log('❌ Android 알림 권한 거부');
      }
    } catch (error) {
      console.error('❌ Android 권한 요청 실패:', error);
    }
  }

  /**
   * Firebase 메시지 리스너 설정
   */
  setupFirebaseListeners() {
    console.log('🔧 Firebase 메시지 리스너 설정...');

    // 포그라운드에서 메시지 수신
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📩 포그라운드 FCM 메시지 수신:', remoteMessage);
      
      // Expo Notifications로 로컬 알림 표시
      if (remoteMessage.notification) {
        await this.showLocalNotification(remoteMessage);
      }
    });

    // 백그라운드에서 앱 열렸을 때
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 백그라운드에서 FCM 알림으로 앱 열림:', remoteMessage);
      this.handleNotificationInteraction(remoteMessage);
    });

    // 앱이 종료된 상태에서 알림으로 실행
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🚀 종료 상태에서 FCM 알림으로 앱 실행:', remoteMessage);
          this.handleNotificationInteraction(remoteMessage);
        }
      });

    // 토큰 새로고침 리스너
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('🔄 FCM 토큰 새로고침:', token.substring(0, 50) + '...');
      this.fcmToken = token;
      AsyncStorage.setItem('firebaseFCMToken', token);
      
      // 서버에 새 토큰 업데이트 필요
      // TODO: Supabase에 새 토큰 저장
    });

    // 정리 함수 반환
    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeTokenRefresh();
      console.log('🧹 Firebase 리스너 정리 완료');
    };
  }

  /**
   * 로컬 알림 표시 (포그라운드용)
   */
  private async showLocalNotification(remoteMessage: any) {
    try {
      const title = remoteMessage.notification?.title || '새 알림';
      const body = remoteMessage.notification?.body || '';
      
      console.log('📱 포그라운드 알림 표시 시도:', { title, body });

      // 방법 1: React Native Alert로 즉시 표시 (가장 확실함)
      const { Alert } = await import('react-native');
      Alert.alert(
        title,
        body,
        [
          { text: '확인', onPress: () => console.log('알림 확인됨') },
          {
            text: '보기',
            onPress: () => {
              console.log('알림 상세 보기:', remoteMessage.data);
              this.handleNotificationInteraction(remoteMessage);
            }
          }
        ],
        { cancelable: true }
      );

      // 방법 2: Expo Notifications로도 표시 (백업용)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: remoteMessage.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: null, // 즉시 표시
      });

      console.log('✅ 포그라운드 알림 표시 완료 (Alert + 로컬 알림)');
    } catch (error) {
      console.error('❌ 포그라운드 알림 표시 실패:', error);
    }
  }

  /**
   * 알림 상호작용 처리
   */
  private handleNotificationInteraction(remoteMessage: any) {
    console.log('🧭 FCM 알림 상호작용 처리:', remoteMessage.data);

    const data = remoteMessage.data;
    
    if (data?.type === 'quote_received') {
      console.log('📋 견적 알림 클릭 - 견적 상세로 이동:', data.quote_id);
      // TODO: React Navigation으로 견적 상세 페이지 이동
    } else if (data?.type === 'quote_updated') {
      console.log('🔄 견적 업데이트 알림 클릭:', data.quote_id);
      // TODO: 견적 목록 페이지로 이동
    }
  }

  /**
   * 저장된 토큰들 반환
   */
  async getStoredTokens(): Promise<{ fcmToken: string | null; apnsToken: string | null }> {
    try {
      const fcmToken = await AsyncStorage.getItem('firebaseFCMToken');
      const apnsToken = await AsyncStorage.getItem('apnsToken');
      
      return { fcmToken, apnsToken };
    } catch (error) {
      console.error('❌ 저장된 토큰 조회 실패:', error);
      return { fcmToken: null, apnsToken: null };
    }
  }

  /**
   * 테스트 로컬 알림
   */
  async sendTestLocalNotification() {
    console.log('🧪 Firebase 테스트 로컬 알림 발송...');

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Firebase FCM 테스트',
          body: 'Firebase FCM이 정상적으로 작동합니다!',
          data: { 
            type: 'test_firebase',
            timestamp: Date.now(),
          },
          sound: 'default',
          badge: 1,
        },
        trigger: { seconds: 2 },
      });

      console.log('✅ Firebase 테스트 로컬 알림 예약 완료');
    } catch (error) {
      console.error('❌ Firebase 테스트 로컬 알림 실패:', error);
    }
  }

  /**
   * 현재 토큰들 반환
   */
  getTokens() {
    return {
      fcmToken: this.fcmToken,
      apnsToken: this.apnsToken,
    };
  }

  /**
   * Firebase 앱 상태 확인
   */
  async checkFirebaseStatus(): Promise<boolean> {
    try {
      const { firebase } = await import('@react-native-firebase/app');
      const apps = firebase.apps;
      
      console.log('🔥 Firebase 앱 상태:', apps.length > 0 ? '연결됨' : '연결 안됨');
      console.log('🔥 Firebase 앱 목록:', apps.map(app => app.name));
      
      return apps.length > 0;
    } catch (error) {
      console.error('❌ Firebase 상태 확인 실패:', error);
      return false;
    }
  }
}

// 기본 인스턴스 export
export const firebaseFCMService = FirebaseFCMService.getInstance();