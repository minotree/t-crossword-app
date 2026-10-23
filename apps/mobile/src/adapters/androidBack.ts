import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { BackButtonEvent } from '@ionic/react';

declare global {
  interface DocumentEventMap { ionBackButton: BackButtonEvent }
}

export function subscribeAndroidBack(onBack: () => Promise<void>, onError: () => void): () => void {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  let disposed = false;
  let removeNative: (() => Promise<void>) | undefined;
  const listener = (event: BackButtonEvent) => {
    // Below Ionic overlays (100), above router navigation (0).
    event.detail.register(10, onBack);
  };
  document.addEventListener('ionBackButton', listener);
  // AppPlugin emits Ionic's document backbutton only when a native listener exists.
  // Navigation runs exclusively through Ionic, avoiding two actions per press.
  void App.addListener('backButton', () => {}).then(handle => {
    if (disposed) void handle.remove().catch(onError);
    else removeNative = () => handle.remove();
  }).catch(onError);
  return () => {
    disposed = true;
    document.removeEventListener('ionBackButton', listener);
    void removeNative?.().catch(onError);
  };
}

export async function exitAndroidApp(): Promise<void> {
  if (Capacitor.getPlatform() === 'android') await App.exitApp();
}
