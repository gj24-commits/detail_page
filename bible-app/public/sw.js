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

const CHEER_MESSAGES = [
  '화이팅! 오늘도 말씀으로 하루를 시작해요 💪',
  '예수님이 응원해요! 지금 말씀 읽을 시간이에요 ✨',
  '오늘의 말씀이 기다리고 있어요! 화이팅 🙌',
  '말씀으로 하루를 열어요! 화이팅 ☀️',
  '할 수 있어요! 오늘 말씀 함께 읽어요 📖',
];

// 30초마다 체크 — setTimeout 드리프트 없음
setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;
  const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const month = now.getMonth() + 1;
  const date = now.getDate();

  alarms.forEach((alarm) => {
    if (alarm.time === currentTime && firedToday[alarm.id] !== today) {
      firedToday[alarm.id] = today;

      const cheerIdx = Math.floor(Math.random() * CHEER_MESSAGES.length);
      const cheerText = CHEER_MESSAGES[cheerIdx];
      const labelPart = alarm.label ? alarm.label + ' · ' : '';

      self.registration.showNotification('📖 맥체인 성경읽기', {
        body: `${labelPart}${cheerText}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        image: self.location.origin + '/jesus-alarm.png',
        tag: `daily-bible-${alarm.id}`,
        renotify: true,
        vibrate: [300, 100, 300, 100, 300],
        silent: false,
        data: { url: '/', month, date },
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
