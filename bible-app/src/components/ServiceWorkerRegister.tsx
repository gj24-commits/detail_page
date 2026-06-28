'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        const savedAlarms = localStorage.getItem('alarms');
        if (savedAlarms) {
          try {
            const alarms = JSON.parse(savedAlarms);
            const target = reg.active || reg.installing || reg.waiting;
            if (target) {
              target.postMessage({ type: 'UPDATE_ALARMS', alarms });
            } else {
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                navigator.serviceWorker.controller?.postMessage({ type: 'UPDATE_ALARMS', alarms });
              }, { once: true });
            }
          } catch {}
        }
      });
    }
  }, []);

  return null;
}
