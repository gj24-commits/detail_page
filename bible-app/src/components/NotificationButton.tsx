'use client';

import { useState, useEffect } from 'react';

interface Alarm {
  id: string;
  time: string;
  label: string;
}

function sendAlarmsToSW(alarms: Alarm[]) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_ALARMS',
      alarms,
    });
  }
}

export default function NotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newTime, setNewTime] = useState('07:00');
  const [newLabel, setNewLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
    const saved = localStorage.getItem('alarms');
    if (saved) {
      try { setAlarms(JSON.parse(saved)); } catch {}
    }
  }, []);

  function saveAlarms(updated: Alarm[]) {
    setAlarms(updated);
    localStorage.setItem('alarms', JSON.stringify(updated));
    sendAlarmsToSW(updated);
  }

  async function requestPermission() {
    if (typeof Notification === 'undefined') {
      alert('이 브라우저는 알림을 지원하지 않습니다.\n아이폰에서는 홈 화면에 추가 후 사용해 주세요.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') setShowAdd(true);
  }

  function addAlarm() {
    if (!newTime) return;
    const alarm: Alarm = {
      id: `${Date.now()}`,
      time: newTime,
      label: newLabel.trim(),
    };
    const updated = [...alarms, alarm].sort((a, b) => a.time.localeCompare(b.time));
    saveAlarms(updated);
    setNewLabel('');
    setShowAdd(false);
  }

  function deleteAlarm(id: string) {
    saveAlarms(alarms.filter((a) => a.id !== id));
  }

  if (permission !== 'granted') {
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

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-800">⏰ 말씀 알람</p>

      {alarms.length === 0 && !showAdd && (
        <p className="text-xs text-amber-600">아직 설정된 알람이 없습니다.</p>
      )}

      {alarms.map((alarm) => (
        <div key={alarm.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-3 py-2">
          <div>
            <span className="text-sm font-bold text-amber-900">{alarm.time}</span>
            {alarm.label && (
              <span className="ml-2 text-xs text-amber-600">{alarm.label}</span>
            )}
          </div>
          <button
            onClick={() => deleteAlarm(alarm.id)}
            className="text-red-400 text-xs px-2 py-1 rounded-lg active:bg-red-50"
          >
            삭제
          </button>
        </div>
      ))}

      {showAdd ? (
        <div className="space-y-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="라벨 (선택, 예: 새벽기도)"
            className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex gap-2">
            <button
              onClick={addAlarm}
              className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-semibold active:bg-amber-600"
            >
              추가
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-amber-300 rounded-xl text-sm text-amber-700 active:bg-amber-100"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-amber-300 text-amber-600 py-2 rounded-xl text-sm font-semibold active:bg-amber-100"
        >
          + 알람 추가
        </button>
      )}
    </div>
  );
}
