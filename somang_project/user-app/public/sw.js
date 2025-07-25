// 2. user-app/public/sw.js
// Service Worker 파일

self.addEventListener('push', function(event) {
  console.log('🔔 Push event received:', event);
  console.log('🔔 Push data:', event.data ? event.data.text() : 'No data');

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
      // JSON 파싱 시도
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    } catch (e) {
      // JSON 파싱 실패 시 텍스트로 처리 (개발자 도구 테스트용)
      try {
        const textPayload = event.data.text();
        notificationData = {
          ...notificationData,
          title: 'T-BRIDGE',
          body: textPayload
        };
      } catch (textError) {
        console.error('Failed to parse push payload as JSON or text:', e, textError);
      }
    }
  }

  // 앱이 열려있으면 앱으로 메시지 전송하여 메인 스레드에서 알림 표시
  const promiseChain = self.clients.matchAll({ type: 'window' }).then(clients => {
    if (clients.length > 0) {
      // 앱이 열려있으면 메인 스레드에서 알림 표시
      clients.forEach(client => {
        client.postMessage({
          type: 'show-notification',
          payload: notificationData
        });
      });
      console.log('🔔 Notification message sent to main thread');
      return Promise.resolve();
    } else {
      // 앱이 닫혀있으면 Service Worker에서 알림 표시
      console.log('🔔 App not open, showing SW notification:', notificationData);
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
      ).then(() => {
        console.log('🔔 SW Notification displayed successfully');
      }).catch(error => {
        console.error('🔔 Failed to show SW notification:', error);
      });
    }
  });

  event.waitUntil(promiseChain);
});

// Push 알림 클릭 핸들러 추가
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // 이미 열려있는 창이 있으면 포커스
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // 열려있는 창이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});