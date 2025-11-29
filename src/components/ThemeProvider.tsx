'use client';

import { useUserStore } from '@/store/user';
import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const tradingMode = useUserStore((state) => state.tradingMode);

  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-live', 'theme-demo');
    if (tradingMode === 'LIVE') {
      body.classList.add('theme-live');
    } else {
      body.classList.add('theme-demo');
    }
  }, [tradingMode]);

  return <>{children}</>;
}
