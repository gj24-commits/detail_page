import planData from '@/data/mccheyne.json';

export interface Passage {
  book: string;
  chapter: number;
  ko_name: string;
  en_name: string;
  label: string;
}

export interface DayReading {
  col1: Passage[];
  col2: Passage[];
  col3: Passage[];
  col4: Passage[];
  passages: Passage[];
}

const plan = planData as Record<string, DayReading>;

// Always compute in KST (Asia/Seoul, UTC+9) regardless of server timezone
function toKST(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

export function getTodayKey(date?: Date): string {
  const kst = toKST(date || new Date());
  return `${kst.getMonth() + 1}-${kst.getDate()}`;
}

export function getDayReading(date?: Date): DayReading {
  const key = getTodayKey(date);
  return plan[key] || plan['1-1'];
}

export function getReadingByKey(key: string): DayReading | null {
  return plan[key] || null;
}

export function formatDateKorean(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
