// 2. user-app/public/sw.js
// Service Worker 파일

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);

  let notificationData = {
    title: '새로운 알림',
    body: 'T-BRIDGE에서 알림이 도착했습니다.',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    } catch (e) {
      console.error('Failed to parse push payload:', e);
    }
  }

  // 앱이 열려있으면 앱으로 메시지 전송
  const promiseChain = self.clients.matchAll({ type: 'window' }).then(clients => {
    if (clients.length > 0) {
      // 앱이 열려있으면 앱 내 알림 처리
      clients.forEach(client => {
        client.postMessage({
          type: 'push-received',
          payload: notificationData
        });
      });
      
      // 앱이 포그라운드에 있으면 브라우저 알림은 표시하지 않음
      if (clients.some(client => client.focused)) {
        return Promise.resolve();
      }
    }
    
    // 앱이 백그라운드에 있거나 닫혀있으면 브라우저 알림 표시
    return self.registration.showNotification(
      notificationData.title,
      {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: '확인하기'
          },
          {
            action: 'close',
            title: '닫기'
          }
        ]
      }
    );
  });

  event.waitUntil(promiseChain);
});