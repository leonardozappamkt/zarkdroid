'use client';

import { useEffect } from 'react';

/** Registers the offline service worker (production only, so development never serves stale files). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline mode is a bonus: the app works the same without it */
    });
  }, []);
  return null;
}
