// 1. user-app/src/lib/notifications/push.ts
// 웹 Push 알림 관리 유틸리티

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * 브라우저 Push 알림 지원 여부 확인
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Service Worker 등록
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushSupported()) {
    throw new Error('Service Worker is not supported');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
}

/**
 * Push 구독 생성
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  try {
    const registration = await registerServiceWorker();
    
    // VAPID 공개 키 (환경 변수에서 가져와야 함)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VAPID public key not found');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Push 구독 해제
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    console.log('Getting service worker registration...');
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('No service worker registration found');
      return true; // 등록이 없으면 이미 해제된 것으로 간주
    }

    console.log('Getting push subscription...');
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('No push subscription found');
      return true; // 구독이 없으면 이미 해제된 것으로 간주
    }

    console.log('Unsubscribing from push manager...');
    const result = await subscription.unsubscribe();
    console.log('Push manager unsubscribe result:', result);
    
    return result;
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    // 에러가 발생해도 true를 반환하여 서버 측 해제는 진행되도록 함
    return true;
  }
}

/**
 * 현재 Push 구독 상태 확인
 */
export async function getCurrentSubscription(): Promise<PushSubscriptionData | null> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };
  } catch (error) {
    console.error('Get subscription failed:', error);
    return null;
  }
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}