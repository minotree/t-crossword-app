import { Environment, Storage, graniteEvent } from '@apps-in-toss/web-framework';
import type { ProgressStorage } from './progress.js';

export function isTossEnvironment(): boolean {
  try {
    return Environment.environment === 'toss' || Environment.environment === 'sandbox';
  } catch {
    return false;
  }
}

export function createPlatformStorage(): ProgressStorage {
  if (isTossEnvironment()) return Storage;
  return {
    async getItem(key) { return window.localStorage.getItem(key); },
    async setItem(key, value) { window.localStorage.setItem(key, value); },
  };
}

export function subscribeBack(onBack: () => void, onError: (error: Error) => void): () => void {
  if (!isTossEnvironment()) return () => {};
  return graniteEvent.addEventListener('backEvent', { onEvent: onBack, onError });
}
