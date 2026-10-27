import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/** WebView visibility plus native activity state; never resume audio automatically. */
export function subscribeWordAudioLifecycle(stop: () => void, onError: () => void): () => void {
  let disposed = false;
  let removeNative: (() => Promise<void>) | undefined;
  const hidden = () => { if (document.hidden) stop(); };
  document.addEventListener('visibilitychange', hidden);
  window.addEventListener('pagehide', stop);
  if (Capacitor.isNativePlatform()) {
    void App.addListener('appStateChange', ({ isActive }) => { if (!disposed && !isActive) stop(); }).then(handle => {
      if (disposed) void handle.remove().catch(onError);
      else removeNative = () => handle.remove();
    }).catch(onError);
  }
  return () => {
    disposed = true;
    document.removeEventListener('visibilitychange', hidden);
    window.removeEventListener('pagehide', stop);
    void removeNative?.().catch(onError);
    stop();
  };
}
