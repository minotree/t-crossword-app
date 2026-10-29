import { useEffect, useMemo } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { isTossEnvironment } from './platform.js';

export function createInterstitialAd(adGroupId: string) {
  let ready = false;
  let loading = false;
  let active = true;
  let showing = false;
  let cleanupLoad: (() => void) | undefined;
  let cleanupShow: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finishShow: (() => void) | undefined;
  const load = () => {
    if (!active || loading || ready || showing || !/^ait\.v2\.live\.[a-z0-9]+$/.test(adGroupId) || !isTossEnvironment()) return;
    try {
      if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) return;
      cleanupLoad?.();
      loading = true;
      timer = setTimeout(() => { loading = false; cleanupLoad?.(); }, 20_000);
      cleanupLoad = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (!active || !loading || event.type !== 'loaded') return;
          clearTimeout(timer); loading = false; ready = true;
        },
        onError: () => { clearTimeout(timer); loading = false; },
      });
    } catch { clearTimeout(timer); loading = false; }
  };
  return {
    load,
    start: () => { active = true; load(); },
    show: (): Promise<void> => {
      if (!active || showing) return Promise.resolve();
      if (!ready) { load(); return Promise.resolve(); }
      ready = false;
      showing = true;
      cleanupLoad?.();
      return new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true; showing = false; clearTimeout(timer);
          finishShow = undefined;
          resolve();
          // Defer reloading until the SDK call has returned its cleanup function.
          queueMicrotask(() => { cleanupShow?.(); cleanupShow = undefined; load(); });
        };
        finishShow = finish;
        timer = setTimeout(finish, 20_000);
        try {
          cleanupShow = showFullScreenAd({
            options: { adGroupId },
            onEvent: (event) => {
              if (event.type === 'show' || event.type === 'impression') clearTimeout(timer);
              if (event.type === 'dismissed' || event.type === 'failedToShow') finish();
            },
            onError: finish,
          });
        } catch { finish(); }
      });
    },
    dispose: () => {
      active = false; ready = false; loading = false;
      clearTimeout(timer); cleanupLoad?.(); cleanupShow?.(); finishShow?.();
    },
  };
}

export function useInterstitialAd() {
  const ad = useMemo(() => createInterstitialAd(import.meta.env.VITE_TOSS_INTERSTITIAL_AD_GROUP_ID?.trim() ?? ''), []);
  useEffect(() => { ad.start(); return ad.dispose; }, [ad]);
  return ad;
}
