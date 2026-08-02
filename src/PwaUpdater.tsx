import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// registerType:'autoUpdate' in vite.config.ts only makes the generated service
// worker itself skip-waiting/claim clients immediately — it does NOT, on its
// own, make an already-open tab notice a new version or check for one
// periodically. Without this, a tab left open (or an iOS home-screen app,
// which Safari often resumes from a suspended state instead of reloading)
// can keep running old code indefinitely after a new deploy. This component
// wires up the actual auto-update: check for a new service worker on an
// interval, and reload as soon as one is found.
export function PwaUpdater() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => { registration.update().catch(() => {}); };
      check();
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  useEffect(() => {
    if (needRefresh) updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
