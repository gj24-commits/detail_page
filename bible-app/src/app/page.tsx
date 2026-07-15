'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const now = new Date();
    const key = `${now.getMonth() + 1}-${now.getDate()}`;
    router.replace(`/daily/${key}`);
  }, [router]);
  return <div className="min-h-screen bg-amber-50" />;
}
