import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isTossEnvironment } from '../adapters/platform.js';

export function isProductionBannerId(value: string): boolean {
  return value.trim().length > 0 && !value.toLowerCase().includes('test');
}
let bannerInitialization: Promise<void> | null = null;
function initializeBanner() {
  if (!bannerInitialization) {
    bannerInitialization = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('banner_timeout')), 20_000);
      TossAds.initialize({ callbacks: {
        onInitialized: () => { window.clearTimeout(timer); resolve(); },
        onInitializationFailed: () => { window.clearTimeout(timer); reject(new Error('banner_failed')); },
      } });
    }).catch((error: unknown) => { bannerInitialization = null; throw error; });
  }
  return bannerInitialization;
}

export function AdBanner({ enabled }: { enabled: boolean }) {
  const bannerId = import.meta.env.VITE_TOSS_BANNER_AD_GROUP_ID?.trim() ?? '';
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || failed || !isProductionBannerId(bannerId) || !isTossEnvironment()) return;
    let active = true;
    let attached: ReturnType<typeof TossAds.attachBanner> | undefined;
    try {
      if (!TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) { setFailed(true); return; }
      void initializeBanner().then(() => {
        if (!active || !container.current) return;
        attached = TossAds.attachBanner(bannerId, container.current, {
          theme: 'auto', tone: 'blackAndWhite', variant: 'expanded',
          callbacks: { onAdFailedToRender: () => { if (active) setFailed(true); }, onNoFill: () => { if (active) setFailed(true); } },
        });
      }).catch(() => { if (active) setFailed(true); });
    } catch { setFailed(true); }
    return () => { active = false; attached?.destroy(); };
  }, [enabled, failed, bannerId]);
  if (!enabled || failed || !isProductionBannerId(bannerId) || !isTossEnvironment()) return null;
  return <aside className="ad-banner" aria-label="광고"><div ref={container} /></aside>;
}
