export const dynamic = 'force-dynamic';

import { getTodayKey } from '@/lib/mccheyne';
import { redirect } from 'next/navigation';

export default function Home() {
  redirect(`/daily/${getTodayKey()}`);
}
