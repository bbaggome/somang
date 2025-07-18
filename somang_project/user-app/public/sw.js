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

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
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

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 'view' 액션이거나 기본 클릭
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // 이미 열린 탭이 있는지 확인
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(new URL(targetUrl, self.location.origin).pathname) && 'focus' in client) {
          return client.focus();
        }
      }
      // 새 탭에서 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});