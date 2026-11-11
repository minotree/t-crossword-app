import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const TEST_AD_ID = 'ca-app-pub-3940256099942544/1033173712';
const listeners = new Set<() => void>();
let snapshot = { privacyRequired: false, busy: false, message: '' };
let started: Promise<void> | undefined;
let initialized: Promise<void> | undefined;
let allowed = false;
let active = false;
let ready = false;
let loading = false;
let showing = false;
let uncertain = false;
let successes = 0;
let generation = 0;
let loadedAt = 0;
let opportunityUntil = 0;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let loadFailures = 0;
let retryAt = 0;

function cancelRetry() {
  clearTimeout(retryTimer);
  retryTimer = undefined;
}

function update(values: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...values };
  listeners.forEach(listener => listener());
}

async function bounded<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('광고 처리 시간 초과')), 20_000);
    })]);
  } finally { clearTimeout(timer); }
}

function prepare() {
  if (!allowed || !active || snapshot.busy || loading || ready || showing || uncertain) return;
  // Every entry point respects the same deadline; puzzle requests and app resume
  // must not bypass backoff or enqueue a second retry.
  const remaining = retryAt - Date.now();
  if (remaining > 0) {
    if (retryTimer === undefined) {
      retryTimer = setTimeout(() => { retryTimer = undefined; prepare(); }, remaining);
    }
    return;
  }
  cancelRetry();
  loading = true;
  const current = generation;
  // Keep the native load single-flight, including after a JS wait would time out.
  void AdMob.prepareInterstitial({ adId: TEST_AD_ID }).then(() => {
    if (current === generation && allowed) {
      ready = true; loadedAt = Date.now();
      loadFailures = 0; retryAt = 0;
    }
  }).catch(() => {
    if (current !== generation || !allowed) return;
    ready = false;
    loadFailures = Math.min(loadFailures + 1, 5);
    retryAt = Date.now() + Math.min(30_000 * 2 ** (loadFailures - 1), 300_000);
    update({ message: '광고를 준비하지 못했습니다. 학습은 계속할 수 있습니다.' });
  }).finally(() => {
    loading = false;
    if (retryAt > 0) prepare();
  });
}

async function consent() {
  let info = await bounded(AdMob.requestConsentInfo());
  update({ privacyRequired: info.privacyOptionsRequirementStatus === 'REQUIRED' });
  if (info.status === AdmobConsentStatus.REQUIRED) {
    if (!info.isConsentFormAvailable || !active || document.hidden) return;
    // A user may need more than a network timeout to read and complete the form.
    info = await AdMob.showConsentForm();
  }
  update({ privacyRequired: info.privacyOptionsRequirementStatus === 'REQUIRED' });
  allowed = info.canRequestAds && info.status !== AdmobConsentStatus.REQUIRED && info.status !== AdmobConsentStatus.UNKNOWN;
  if (allowed) {
    initialized ??= AdMob.initialize().catch(error => { initialized = undefined; throw error; });
    await bounded(initialized);
  }
}

function finishAd() {
  if (!showing) return;
  showing = false;
  uncertain = false;
  clearTimeout(showTimer);
  ready = false;
  prepare();
}

// One session owner, rather than an Effect-owned SDK instance: StrictMode must not
// initialize twice, reset the counter, or duplicate native event listeners.
export const androidInterstitial = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
  start(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return Promise.resolve();
    started ??= (async () => {
      update({ busy: true });
      try {
        active = (await bounded(App.getState())).isActive;
        await App.addListener('appStateChange', state => {
          active = state.isActive;
          if (!active) { opportunityUntil = 0; cancelRetry(); }
          else prepare();
        });
        await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finishAd);
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finishAd);
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => { ready = false; });
        await consent();
      } catch {
        allowed = false;
        update({ message: '광고 설정을 확인하지 못했습니다. 광고 없이 학습을 계속합니다.' });
      } finally { update({ busy: false }); }
      prepare();
    })();
    return started;
  },
  recordSuccess(): boolean {
    if (Capacitor.getPlatform() !== 'android') return false;
    successes += 1;
    const eligible = successes % 4 === 0 && allowed && active && ready && !snapshot.busy && !showing && !uncertain;
    opportunityUntil = eligible ? Date.now() + 500 : 0;
    prepare();
    return eligible;
  },
  showIfReady() {
    const inTransition = Date.now() < opportunityUntil;
    opportunityUntil = 0;
    if (!inTransition || Capacitor.getPlatform() !== 'android' || !allowed || !active || document.hidden || !ready || snapshot.busy || showing || uncertain) return;
    if (Date.now() - loadedAt >= 55 * 60_000) { ready = false; prepare(); return; }
    ready = false;
    showing = true;
    // A missing native close event must never lock learning or permit a second ad.
    showTimer = setTimeout(() => { uncertain = true; update({ message: '광고 종료를 확인하지 못해 추가 광고를 중지했습니다.' }); }, 120_000);
    void AdMob.showInterstitial().catch(() => {
      update({ message: '광고를 표시하지 못했습니다. 학습은 계속할 수 있습니다.' });
      finishAd();
    });
  },
  async openPrivacyOptions() {
    if (Capacitor.getPlatform() !== 'android' || snapshot.busy || showing || uncertain || !active) return;
    allowed = false;
    cancelRetry();
    ready = false;
    generation += 1;
    opportunityUntil = 0;
    update({ busy: true, message: '' });
    try {
      await AdMob.showPrivacyOptionsForm();
      await consent();
    } catch {
      allowed = false;
      update({ message: '개인정보 선택을 확인하지 못했습니다. 다시 시도해 주세요.' });
    } finally { update({ busy: false }); }
    prepare();
  },
};
