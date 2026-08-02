import Link from 'next/link';
import { getAdjacentKey, getTodayKey, formatKeyKorean } from '@/lib/mccheyne';

interface DateNavProps {
  dateKey: string;
}

export default function DateNav({ dateKey }: DateNavProps) {
  const prevKey = getAdjacentKey(dateKey, -1);
  const nextKey = getAdjacentKey(dateKey, 1);
  const todayKey = getTodayKey();
  const isToday = dateKey === todayKey;

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <Link
        href={`/daily/${prevKey}`}
        className="w-10 h-10 flex items-center justify-center rounded-full text-amber-200 hover:bg-amber-800 active:bg-amber-900 text-xl font-light transition-colors"
        aria-label="이전 날"
      >
        ‹
      </Link>

      <div className="text-center flex-1">
        <p className="text-white font-semibold text-sm leading-tight">{formatKeyKorean(dateKey)}</p>
        {!isToday && (
          <Link
            href={`/daily/${todayKey}`}
            className="text-amber-300 text-xs underline underline-offset-2 mt-0.5 inline-block"
          >
            오늘로 이동
          </Link>
        )}
      </div>

      <Link
        href={`/daily/${nextKey}`}
        className="w-10 h-10 flex items-center justify-center rounded-full text-amber-200 hover:bg-amber-800 active:bg-amber-900 text-xl font-light transition-colors"
        aria-label="다음 날"
      >
        ›
      </Link>
    </div>
  );
}
