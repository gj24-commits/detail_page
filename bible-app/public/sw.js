// Service Worker for McCheyne Bible Reading PWA
let alarms = []; // [{id, time, label}]
const firedToday = {}; // {alarmId: 'YYYY-MM-DD'}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_ALARMS') {
    alarms = event.data.alarms || [];
  }
});

// 30초마다 체크 — setTimeout 드리프트 없음
setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;
  const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  alarms.forEach((alarm) => {
    if (alarm.time === currentTime && firedToday[alarm.id] !== today) {
      firedToday[alarm.id] = today;

      self.registration.showNotification('📖 맥체인 성경읽기', {
        body: `${alarm.label ? alarm.label + ' · ' : ''}오늘 ${now.getMonth() + 1}월 ${now.getDate()}일 말씀을 읽을 시간입니다.`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `daily-bible-${alarm.id}`,
        renotify: true,
        vibrate: [300, 100, 300, 100, 300],
        silent: false,
        data: { url: '/' },
      });
    }
  });
}, 30000);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
