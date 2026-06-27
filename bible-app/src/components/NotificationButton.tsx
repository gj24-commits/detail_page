'use client';

import { useState, useEffect } from 'react';

export default function NotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [time, setTime] = useState('07:00');
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
    const savedTime = localStorage.getItem('notif-time');
    if (savedTime) setTime(savedTime);
  }, []);

  async function requestPermission() {
    if (typeof Notification === 'undefined') {
      alert('이 브라우저는 알림을 지원하지 않습니다.\n아이폰에서는 홈 화면에 추가 후 사용해 주세요.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setShowSettings(true);
      scheduleNotification(time);
    }
  }

  function scheduleNotification(notifTime: string) {
    localStorage.setItem('notif-time', notifTime);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        time: notifTime,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSave() {
    scheduleNotification(time);
  }

  if (permission === 'granted' || showSettings) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-3">⏰ 아침 말씀 알람</p>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 border border-amber-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={handleSave}
            className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-amber-600"
          >
            {saved ? '저장됨 ✓' : '저장'}
          </button>
        </div>
        <p className="text-xs text-amber-600 mt-2">매일 {time}에 말씀 읽기 알림을 보냅니다.</p>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      className="w-full bg-amber-500 text-white py-3 px-4 rounded-2xl font-semibold text-sm active:bg-amber-600 flex items-center justify-center gap-2"
    >
      <span>🔔</span>
      매일 아침 알람 설정하기
    </button>
  );
}
