// Service Worker for McCheyne Bible Reading PWA
const CACHE_NAME = 'mccheyne-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle notification scheduling messages from the main app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const time = event.data.time || '07:00';
    scheduleDaily(time);
  }
});

function scheduleDaily(timeStr) {
  // Store the time for next alarm calculation
  const [hours, minutes] = timeStr.split(':').map(Number);

  function getNextAlarmMs() {
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime() - now.getTime();
  }

  function fireNotification() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    self.registration.showNotification('📖 맥체인 성경읽기', {
      body: `오늘 ${month}월 ${day}일 말씀을 읽을 시간입니다.`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-bible',
      requireInteraction: false,
      data: { url: '/' },
    });

    // Schedule next day's notification
    const nextMs = getNextAlarmMs();
    setTimeout(fireNotification, nextMs);
  }

  const msUntilFirst = getNextAlarmMs();
  setTimeout(fireNotification, msUntilFirst);
}

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
