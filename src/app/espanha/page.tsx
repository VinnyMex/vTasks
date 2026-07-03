'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EspanhaPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/imigracao');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}></div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Redirecionando para o módulo ImigraPro...
        </p>
      </div>
    </div>
  );
}
