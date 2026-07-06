export const dynamic = 'force-dynamic';

import { getReadingByKey, getTodayKey } from '@/lib/mccheyne';
import PassageCard from '@/components/PassageCard';
import NotificationButton from '@/components/NotificationButton';
import JesusCharacter from '@/components/JesusCharacter';
import DateNav from '@/components/DateNav';
import { notFound } from 'next/navigation';

const COLUMN_LABELS = ['가정 구약', '가정 신약', '개인 구약', '개인 신약'];
const COLUMN_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
];

export default async function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const reading = getReadingByKey(date);
  if (!reading) notFound();

  const todayKey = getTodayKey();
  const isToday = date === todayKey;

  const columns = [reading.col1, reading.col2, reading.col3, reading.col4];

  return (
    <main className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-700 to-amber-600 text-white px-5 pt-10 pb-20">
        <p className="text-amber-200 text-xs font-medium mb-1 tracking-wide">맥체인 성경읽기</p>
        <h1 className="text-2xl font-bold mb-3">
          {isToday ? '오늘의 말씀' : '말씀 읽기'}
        </h1>
        <DateNav dateKey={date} />
      </div>

      <div className="px-4 -mt-14 pb-8 space-y-3">
        {/* Jesus character card */}
        <div className="bg-white rounded-2xl shadow-md border border-amber-100">
          <JesusCharacter />
        </div>

        {/* Quick overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">오늘 읽을 말씀</p>
          <div className="flex flex-wrap gap-2">
            {reading.passages.map((p, i) => (
              <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg">
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Notification (only on today) */}
        {isToday && <NotificationButton />}

        {/* Passage cards */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 px-1 pt-1">말씀 본문 (탭해서 열기)</p>
          {columns.map((col, colIdx) =>
            col.map((passage, passIdx) => (
              <PassageCard
                key={`${colIdx}-${passIdx}`}
                passage={passage}
                columnLabel={COLUMN_LABELS[colIdx]}
                colorClass={COLUMN_COLORS[colIdx]}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
