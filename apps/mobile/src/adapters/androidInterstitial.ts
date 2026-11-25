import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const TEST_AD_ID = 'ca-app-pub-8070497340255865/4148816263';//product  ca-app-pub-8070497340255865/4148816263
const listeners = new Set<() => void>();
let snapshot = { privacyRequired: false, busy: false, message: '' };
let started: Promise<void> | undefined;
let initialized: Promise<void> | undefined;
let allowed = false;
let active = false;
let ready = false;
let loading = false;
let showing = false;
type PictureBookAdResult = 'dismissed' | 'failed' | 'skipped' | 'blocked';
let finishPictureBookAd: ((result: PictureBookAdResult) => void) | undefined;
let uncertain = false;
let successes = 0;
let generation = 0;
let loadedAt = 0;
let pendingOpportunity = false;
let displayArmed = false;
let sdkReady = false;
let resumeRequested = false;
let consentRequest: Promise<Awaited<ReturnType<typeof AdMob.requestConsentInfo>>> | undefined;
let consentForm: Promise<Awaited<ReturnType<typeof AdMob.showConsentForm>>> | undefined;
const registrations = new Map<string, Promise<unknown>>();
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

class AdTimeout extends Error {}

async function bounded<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new AdTimeout('광고 처리 시간 초과')), 20_000);
    })]);
  } finally { clearTimeout(timer); }
}

function prepare() {
  if (!allowed) { console.info('[MNU-ADMOB] prepare blocked: consent does not allow ads'); return; }
  if (!sdkReady) { console.info('[MNU-ADMOB] prepare blocked: SDK not initialized'); return; }
  if (!active) { console.info('[MNU-ADMOB] prepare blocked: app inactive'); return; }
  if (document.hidden) { console.info('[MNU-ADMOB] prepare blocked: document hidden'); return; }
  if (snapshot.busy) { console.info('[MNU-ADMOB] prepare blocked: setup or privacy options busy'); return; }
  if (loading) { console.info('[MNU-ADMOB] prepare blocked: load already in progress'); return; }
  if (ready) { console.info('[MNU-ADMOB] prepare blocked: ad already ready'); return; }
  if (showing) { console.info('[MNU-ADMOB] prepare blocked: ad showing'); return; }
  if (uncertain) { console.info('[MNU-ADMOB] prepare blocked: ad dismissal unconfirmed'); return; }
  // Every entry point respects the same deadline; puzzle requests and app resume
  // must not bypass backoff or enqueue a second retry.
  const remaining = retryAt - Date.now();
  if (remaining > 0) {
    console.info(`[MNU-ADMOB] prepare blocked: retry backoff remainingMs=${remaining}`);
    if (retryTimer === undefined) {
      retryTimer = setTimeout(() => { retryTimer = undefined; prepare(); }, remaining);
    }
    return;
  }
  cancelRetry();
  loading = true;
  const current = generation;
  // Keep the native load single-flight, including after a JS wait would time out.
  console.info('[MNU-ADMOB] prepareInterstitial start');
  void AdMob.prepareInterstitial({ adId: TEST_AD_ID }).then(() => {
    console.info(`[MNU-ADMOB] prepareInterstitial success currentGeneration=${current === generation} allowed=${allowed}`);
    if (current === generation && allowed) {
      ready = true; loadedAt = Date.now();
      loadFailures = 0; retryAt = 0;
    }
  }).catch(() => {
    console.info(`[MNU-ADMOB] prepareInterstitial failed currentGeneration=${current === generation} allowed=${allowed}`);
    if (current !== generation || !allowed) return;
    ready = false;
    loadFailures = Math.min(loadFailures + 1, 5);
    retryAt = Date.now() + Math.min(30_000 * 2 ** (loadFailures - 1), 300_000);
    update({ message: '광고를 준비하지 못했습니다. 학습은 계속할 수 있습니다.' });
  }).finally(() => {
    loading = false;
    if (retryAt > 0 || !ready) prepare();
    tryShow();
  });
}

// Timeouts end the JS wait, not the native operation. Keep each native promise
// until it settles so a retry cannot duplicate a request or an open consent form.
async function diagnose<T>(stage: string, operation: Promise<T>, timeout = true): Promise<T> {
  console.info(`[MNU-ADMOB] stage start stage=${stage}`);
  try {
    const result = await (timeout ? bounded(operation) : operation);
    console.info(`[MNU-ADMOB] stage success stage=${stage}`);
    return result;
  } catch (error) {
    console.info(`[MNU-ADMOB] stage failed stage=${stage} reason=${error instanceof AdTimeout ? 'timeout' : 'rejected'}`);
    throw error;
  }
}

async function consent() {
  if (!active || document.hidden) return;
  consentRequest ??= Promise.resolve().then(() => {
    if (!active || document.hidden) throw new Error('App inactive');
    return AdMob.requestConsentInfo();
  }).finally(() => { consentRequest = undefined; });
  let info = await diagnose('requestConsentInfo', consentRequest);
  console.info(`[MNU-ADMOB] requestConsentInfo result status=${info.status} canRequestAds=${info.canRequestAds} privacyOptionsRequirementStatus=${info.privacyOptionsRequirementStatus} isConsentFormAvailable=${info.isConsentFormAvailable}`);
  update({ privacyRequired: info.privacyOptionsRequirementStatus === 'REQUIRED' });
  if (!active || document.hidden) return;
  if (info.status === AdmobConsentStatus.REQUIRED) {
    if (!info.isConsentFormAvailable) return;
    consentForm ??= Promise.resolve().then(() => {
      if (!active || document.hidden) throw new Error('App inactive');
      return AdMob.showConsentForm();
    }).finally(() => { consentForm = undefined; });
    // Reading a consent form must not be subject to a network timeout.
    info = await diagnose('showConsentForm', consentForm, false);
  }
  update({ privacyRequired: info.privacyOptionsRequirementStatus === 'REQUIRED' });
  if (!active || document.hidden) return;
  allowed = info.canRequestAds && info.status !== AdmobConsentStatus.REQUIRED && info.status !== AdmobConsentStatus.UNKNOWN;
  console.info(`[MNU-ADMOB] consent decision status=${info.status} canRequestAds=${info.canRequestAds} allowed=${allowed}`);
  if (!allowed) return;
  initialized ??= Promise.resolve().then(() => {
    if (!active || document.hidden) throw new Error('App inactive');
    return AdMob.initialize();
  }).then(() => {
    sdkReady = true;
    // A native initialization may finish after the bounded wait has expired.
    if (!started && active && !document.hidden) void androidInterstitial.start();
  }).catch(error => { initialized = undefined; sdkReady = false; throw error; });
  await diagnose('initialize', initialized);
}

async function registerListeners() {
  const register = async (name: string, install: () => Promise<unknown>) => {
    let registration = registrations.get(name);
    if (!registration) {
      registration = Promise.resolve().then(install).catch(error => { registrations.delete(name); throw error; });
      registrations.set(name, registration);
    }
    await diagnose(`listener:${name}`, registration);
  };
  await register('appStateChange', () => App.addListener('appStateChange', state => {
    active = state.isActive;
    console.info(`[MNU-ADMOB] app state changed active=${active}`);
    if (!active) cancelRetry();
    else if (started || snapshot.busy) resumeRequested = true;
    else void androidInterstitial.start();
  }));
  await register('visibilitychange', async () => {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelRetry();
      else if (active) {
        if (started || snapshot.busy) resumeRequested = true;
        else void androidInterstitial.start();
      }
    });
  });
  await register('Dismissed', () => AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    console.info('[MNU-ADMOB] event Dismissed'); finishAd('dismissed');
  }));
  await register('FailedToShow', () => AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
    console.info('[MNU-ADMOB] event FailedToShow'); finishAd('failed');
  }));
  await register('FailedToLoad', () => AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
    console.info('[MNU-ADMOB] event FailedToLoad'); ready = false;
  }));
}

function tryShow() {
  console.info('[MNU-ADMOB] showIfReady check');
  if (!pendingOpportunity) { console.info('[MNU-ADMOB] showIfReady blocked: no pending opportunity'); return; }
  if (!displayArmed) { console.info('[MNU-ADMOB] showIfReady blocked: puzzle display not confirmed'); return; }
  if (!allowed) { console.info('[MNU-ADMOB] showIfReady blocked: consent does not allow ads'); return; }
  if (!sdkReady) { console.info('[MNU-ADMOB] showIfReady blocked: SDK not initialized'); return; }
  if (!active) { console.info('[MNU-ADMOB] showIfReady blocked: app inactive'); return; }
  if (document.hidden) { console.info('[MNU-ADMOB] showIfReady blocked: document hidden'); return; }
  if (!ready) { console.info('[MNU-ADMOB] showIfReady blocked: ad not ready'); return; }
  if (snapshot.busy) { console.info('[MNU-ADMOB] showIfReady blocked: setup or privacy options busy'); return; }
  if (showing) { console.info('[MNU-ADMOB] showIfReady blocked: ad showing'); return; }
  if (uncertain) { console.info('[MNU-ADMOB] showIfReady blocked: ad dismissal unconfirmed'); return; }
  // A delayed load must not interrupt another menu or an answer/consent dialog.
  if (!document.querySelector('.mobile-quiz')) { console.info('[MNU-ADMOB] showIfReady blocked: quiz screen not open'); return; }
  if (document.querySelector('dialog[open]')) { console.info('[MNU-ADMOB] showIfReady blocked: dialog open'); return; }
  if (Date.now() - loadedAt >= 55 * 60_000) {
    console.info('[MNU-ADMOB] showIfReady blocked: prepared ad expired');
    ready = false; prepare(); return;
  }
  pendingOpportunity = false;
  displayArmed = false;
  showAd();
}

function showAd() {
  ready = false;
  showing = true;
  showTimer = setTimeout(() => { uncertain = true; update({ message: '광고 종료를 확인하지 못해 추가 광고를 중지했습니다.' }); }, 120_000);
  console.info('[MNU-ADMOB] showInterstitial start');
  void AdMob.showInterstitial().then(() => {
    console.info('[MNU-ADMOB] showInterstitial success');
  }).catch(() => {
    console.info('[MNU-ADMOB] showInterstitial failed');
    update({ message: '광고를 표시하지 못했습니다. 학습은 계속할 수 있습니다.' });
    finishAd('failed');
  });
}

function finishAd(result: 'dismissed' | 'failed') {
  if (!showing) return;
  showing = false;
  uncertain = false;
  clearTimeout(showTimer);
  ready = false;
  const finish = finishPictureBookAd;
  finishPictureBookAd = undefined;
  finish?.(active && !document.hidden ? result : 'blocked');
  prepare();
}

// One session owner, rather than an Effect-owned SDK instance: StrictMode must not
// initialize twice, reset the counter, or duplicate native event listeners.
export const androidInterstitial = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
  start(): Promise<void> {
    const platform = Capacitor.getPlatform();
    console.info(`[MNU-ADMOB] start platform=${platform} alreadyStarted=${started !== undefined}`);
    if (platform !== 'android') {
      console.info('[MNU-ADMOB] start blocked: unsupported platform');
      return Promise.resolve();
    }
    if (snapshot.busy && !started) return Promise.resolve();
    started ??= Promise.resolve().then(async () => {
      update({ busy: true });
      try {
        await registerListeners();
        active = (await diagnose('getAppState', App.getState())).isActive;
        if (!active || document.hidden) return;
        if (!allowed || !sdkReady) await consent();
      } catch {
        allowed = false;
        update({ message: '광고 설정을 확인하지 못했습니다. 광고 없이 학습을 계속합니다.' });
      } finally {
        started = undefined;
        update({ busy: false });
        prepare();
        tryShow();
        if (resumeRequested && active && !document.hidden) {
          resumeRequested = false;
          void androidInterstitial.start();
        }
      }
    });
    return started;
  },
  recordSuccess(): boolean {
    if (Capacitor.getPlatform() !== 'android') {
      console.info(`[MNU-ADMOB] recordSuccess blocked: unsupported platform successes=${successes} eligible=false pendingOpportunity=${pendingOpportunity} ready=${ready}`);
      return false;
    }
    successes += 1;
    const eligible = successes % 4 === 0;
    if (eligible) pendingOpportunity = true;
    console.info(`[MNU-ADMOB] recordSuccess successes=${successes} eligible=${eligible} pendingOpportunity=${pendingOpportunity} ready=${ready}`);
    if (!allowed || !sdkReady) void androidInterstitial.start();
    prepare();
    return eligible;
  },
  showIfReady() {
    console.info('[MNU-ADMOB] showIfReady enter');
    if (Capacitor.getPlatform() !== 'android') return;
    if (pendingOpportunity) displayArmed = true;
    tryShow();
    prepare();
  },
  showForPictureBook(): Promise<PictureBookAdResult> {
    if (Capacitor.getPlatform() !== 'android') return Promise.resolve('skipped');
    if (showing || uncertain || !active || document.hidden) return Promise.resolve('blocked');
    if (!allowed || !sdkReady || snapshot.busy || loading || !ready || document.querySelector('dialog[open]')) {
      return Promise.resolve('skipped');
    }
    if (Date.now() - loadedAt >= 55 * 60_000) {
      ready = false;
      prepare();
      return Promise.resolve('skipped');
    }
    // Consume only the prepared ad; quiz opportunities and its counter are untouched.
    return new Promise(resolve => {
      finishPictureBookAd = resolve;
      showAd();
    });
  },
  async openPrivacyOptions() {
    if (Capacitor.getPlatform() !== 'android' || snapshot.busy || showing || uncertain || !active) return;
    allowed = false;
    cancelRetry();
    ready = false;
    generation += 1;
    update({ busy: true, message: '' });
    try {
      await diagnose('showPrivacyOptionsForm', AdMob.showPrivacyOptionsForm(), false);
      await consent();
    } catch {
      allowed = false;
      update({ message: '개인정보 선택을 확인하지 못했습니다. 다시 시도해 주세요.' });
    } finally {
      update({ busy: false });
      if (resumeRequested && active && !document.hidden) {
        resumeRequested = false;
        void androidInterstitial.start();
      }
    }
    prepare();
  },
};
