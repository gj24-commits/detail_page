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

export function getTodayKey(date?: Date): string {
  const d = date || new Date();
  return `${d.getMonth() + 1}-${d.getDate()}`;
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
