'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Re-send saved notification time after SW registration
        const savedTime = localStorage.getItem('notif-time');
        if (savedTime && reg.active) {
          reg.active.postMessage({ type: 'SCHEDULE_NOTIFICATION', time: savedTime });
        }
      });
    }
  }, []);

  return null;
}
