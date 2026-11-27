interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
let snapshot = { installed: false, available: false };
const listeners = new Set<() => void>();
const update = (installed: boolean) => {
  snapshot = { installed, available: !installed && deferred !== null };
  listeners.forEach(listener => listener());
};
export const pwaInstall = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
  async prompt() {
    const event = deferred;
    if (!event || snapshot.installed) return;
    deferred = null;
    update(snapshot.installed);
    await event.prompt();
    await event.userChoice;
  },
};

/** Capture the one-use browser event before the user visits Settings. */
export function trackPwaInstallation() {
  const media = window.matchMedia?.('(display-mode: standalone)');
  const standalone = () => Boolean(media?.matches || (navigator as Navigator & { standalone?: boolean }).standalone);
  const changed = () => update(standalone());
  const offered = (event: Event) => {
    if (!('prompt' in event) || !('userChoice' in event)) return;
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    update(standalone());
  };
  const installed = () => { deferred = null; update(true); };
  changed();
  window.addEventListener('beforeinstallprompt', offered);
  window.addEventListener('appinstalled', installed);
  media?.addEventListener('change', changed);
  return () => {
    window.removeEventListener('beforeinstallprompt', offered);
    window.removeEventListener('appinstalled', installed);
    media?.removeEventListener('change', changed);
  };
}
