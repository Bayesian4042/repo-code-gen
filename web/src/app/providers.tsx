'use client';

import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add WebContainer polyfills
    if (typeof window !== 'undefined') {
      window.process = {
        ...window.process,
        cwd: () => '/',
        env: {
          ...window.process?.env,
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      };
    }
  }, []);

  return <>{children}</>;
}
