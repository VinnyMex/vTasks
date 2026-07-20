'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TimelineImigracaoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/regularizacao');
  }, [router]);
  return null;
}
