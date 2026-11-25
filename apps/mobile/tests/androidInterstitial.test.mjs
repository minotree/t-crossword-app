import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

test('picture book waits for dismissal, ignores show promise completion and prevents duplicate shows', async t => {
  const h = await setup(t); await h.adapter.start(); await flush(); h.state.quiz = false;
  let result;
  const playback = h.adapter.showForPictureBook().then(value => { result = value; });
  await flush(); assert.equal(h.calls.show, 1); assert.equal(result, undefined);
  assert.equal(await h.adapter.showForPictureBook(), 'blocked');
  t.mock.timers.tick(120_000); await flush(); assert.equal(result, undefined);
  h.events.get('Dismissed')(); await playback; assert.equal(result, 'dismissed');
  assert.deepEqual(h.success(), [false, false, false, true]);
});

for (const failure of ['event', 'rejection']) test(`picture book continues after show failure: ${failure}`, async t => {
  const h = await setup(t, { show: () => { if (failure === 'rejection') throw new Error('show failure'); } });
  await h.adapter.start(); await flush();
  const result = h.adapter.showForPictureBook();
  if (failure === 'event') h.events.get('FailedToShow')();
  assert.equal(await result, 'failed');
});

test('picture book skips loading immediately with no deferred display', async t => {
  const load = deferred(); const h = await setup(t, { prepare: () => load.promise });
  await h.adapter.start(); h.state.quiz = false;
  assert.equal(await h.adapter.showForPictureBook(), 'skipped');
  load.resolve(); await flush(); assert.equal(h.calls.show, 0);
});

for (const armed of [false, true]) test(`picture book preserves quiz opportunity and display armed=${armed}`, async t => {
  const h = await setup(t); await h.adapter.start(); await flush();
  h.state.quiz = false; h.success();
  if (armed) h.adapter.showIfReady();
  const result = h.adapter.showForPictureBook(); h.events.get('Dismissed')(); await result; await flush();
  h.state.quiz = true; await h.adapter.start(); await flush();
  assert.equal(h.calls.show, armed ? 2 : 1);
  if (!armed) { h.adapter.showIfReady(); assert.equal(h.calls.show, 2); }
});

test('picture book cannot resume playback while app is inactive', async t => {
  const h = await setup(t); await h.adapter.start(); await flush();
  const result = h.adapter.showForPictureBook(); await h.appState(false);
  h.events.get('Dismissed')(); assert.equal(await result, 'blocked');
});

for (const platform of ['ios', 'web']) test(`picture book skips native ads on ${platform}`, async t => {
  const h = await setup(t); h.state.platform = platform;
  assert.equal(await h.adapter.showForPictureBook(), 'skipped'); assert.equal(h.calls.show, 0);
});

let fixtureId = 0;
const consentInfo = { status: 'NOT_REQUIRED', canRequestAds: true,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED', isConsentFormAvailable: false };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function flush() { for (let index = 0; index < 100; index++) await Promise.resolve(); }
function assertStageLog(logs, outcome, stage, reason) {
  const expected = `[MNU-ADMOB] stage ${outcome} stage=${stage}${reason ? ` reason=${reason}` : ''}`;
  assert.ok(logs.some(args => args.length === 1 && args[0] === expected), `Missing single-string log: ${expected}`);
}
function assertSingleRegistration(calls) {
  assert.equal(calls.registrations.size, 4);
  for (const count of calls.registrations.values()) assert.equal(count, 1);
}

async function setup(t, options = {}) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const logs = [];
  t.mock.method(console, 'info', (...args) => logs.push(args));
  const calls = { consent: 0, form: 0, initialize: 0, prepare: 0, show: 0, registrations: new Map() };
  const events = new Map();
  const state = { active: options.active ?? true, hidden: false, quiz: true, dialog: false, platform: 'android' };
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    get hidden() { return state.hidden; },
    addEventListener: (name, listener) => events.set(name, listener),
    querySelector: selector => (selector === '.mobile-quiz' ? state.quiz : state.dialog) ? {} : null,
  } });
  const install = async (name, listener) => {
    calls.registrations.set(name, (calls.registrations.get(name) ?? 0) + 1);
    if (options.listener?.(name, calls.registrations.get(name))) throw new Error('private detail');
    events.set(name, listener);
    return { remove: async () => {} };
  };
  const fixture = {
    App: { getState: async () => ({ isActive: state.active }), addListener: install },
    Capacitor: { getPlatform: () => state.platform },
    AdmobConsentStatus: { REQUIRED: 'REQUIRED', UNKNOWN: 'UNKNOWN' },
    InterstitialAdPluginEvents: { Dismissed: 'Dismissed', FailedToShow: 'FailedToShow', FailedToLoad: 'FailedToLoad' },
    AdMob: {
      addListener: install,
      requestConsentInfo: async () => { calls.consent++; return options.consent ? options.consent(calls.consent) : consentInfo; },
      showConsentForm: async () => { calls.form++; return options.form ? options.form(calls.form) : consentInfo; },
      initialize: async () => { calls.initialize++; await options.initialize?.(calls.initialize); },
      prepareInterstitial: async () => { calls.prepare++; return options.prepare?.(calls.prepare); },
      showInterstitial: async () => { calls.show++; await options.show?.(calls.show); },
      showPrivacyOptionsForm: async () => {},
    },
  };
  const key = `__admobFixture${++fixtureId}`;
  globalThis[key] = fixture;
  // Mock only native imports; execute the real TypeScript adapter with Node 24.
  const hook = registerHooks({ resolve(specifier, context, next) {
    if (['@capacitor/app', '@capacitor/core', '@capacitor-community/admob'].includes(specifier)) {
      const names = specifier === '@capacitor/app' ? 'App' : specifier === '@capacitor/core' ? 'Capacitor' : 'AdMob, AdmobConsentStatus, InterstitialAdPluginEvents';
      return { url: `data:text/javascript,${encodeURIComponent(`export const { ${names} } = globalThis.${key};`)}`, shortCircuit: true };
    }
    return next(specifier, context);
  } });
  let adapter;
  try { ({ androidInterstitial: adapter } = await import(`../src/adapters/androidInterstitial.ts?fixture=${fixtureId}`)); }
  finally { hook.deregister(); }
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
    delete globalThis[key];
  });
  const success = (count = 4) => Array.from({ length: count }, () => adapter.recordSuccess());
  const appState = async active => { state.active = active; events.get('appStateChange')?.({ isActive: active }); await flush(); };
  return { adapter, calls, state, logs, events, success, appState };
}

test('initialization rejection retries without duplicating native listeners or concurrent initialization', async t => {
  const h = await setup(t, { initialize: count => { if (count === 1) throw new Error('private detail'); } });
  await Promise.all([h.adapter.start(), h.adapter.start()]);
  assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 0);
  await h.adapter.start(); await flush();
  assert.equal(h.calls.initialize, 2); assert.equal(h.calls.prepare, 1);
  assertSingleRegistration(h.calls);
  assertStageLog(h.logs, 'failed', 'initialize', 'rejected');
  assertStageLog(h.logs, 'success', 'initialize');
  assert.ok(!JSON.stringify(h.logs).includes('private detail'));
});

test('initialization timeout retains the native single flight and resumes after late completion', async t => {
  const initialization = deferred();
  const h = await setup(t, { initialize: () => initialization.promise });
  const start = h.adapter.start(); await flush();
  t.mock.timers.tick(20_000); await start;
  assert.equal(h.calls.prepare, 0);
  const retry = h.adapter.start(); await flush();
  assert.equal(h.calls.initialize, 1);
  initialization.resolve(); await retry; await flush();
  assert.equal(h.calls.prepare, 1); assert.equal(h.calls.initialize, 1);
  assertSingleRegistration(h.calls);
  assertStageLog(h.logs, 'failed', 'initialize', 'timeout');
  assertStageLog(h.logs, 'success', 'initialize');
});

test('consent request failure is diagnosed separately and can retry', async t => {
  const h = await setup(t, { consent: count => { if (count === 1) throw new Error('private detail'); return consentInfo; } });
  await h.adapter.start(); assert.equal(h.calls.initialize, 0);
  assert.equal(h.calls.prepare, 0); assert.equal(h.calls.show, 0);
  await h.adapter.start(); await flush();
  assert.equal(h.calls.consent, 2); assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
  assertSingleRegistration(h.calls);
  assertStageLog(h.logs, 'failed', 'requestConsentInfo', 'rejected');
  assertStageLog(h.logs, 'success', 'requestConsentInfo');
  assertStageLog(h.logs, 'success', 'initialize');
});

test('consent form failure is separate, retries, and never requests ads before permission', async t => {
  const h = await setup(t, {
    consent: () => ({ ...consentInfo, status: 'REQUIRED', canRequestAds: false, isConsentFormAvailable: true }),
    form: count => { if (count === 1) throw new Error('private detail'); return consentInfo; },
  });
  await h.adapter.start(); assert.equal(h.calls.initialize, 0); assert.equal(h.calls.prepare, 0);
  assert.equal(h.calls.show, 0);
  await h.adapter.start(); await flush();
  assert.equal(h.calls.form, 2); assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
  assertSingleRegistration(h.calls);
  assertStageLog(h.logs, 'failed', 'showConsentForm', 'rejected');
  assertStageLog(h.logs, 'success', 'showConsentForm');
  assertStageLog(h.logs, 'success', 'initialize');
});

test('delayed preparation keeps the fourth-success opportunity beyond 500ms and shows only once', async t => {
  const load = deferred();
  const h = await setup(t, { prepare: () => load.promise });
  await h.adapter.start();
  assert.deepEqual(h.success(), [false, false, false, true]);
  t.mock.timers.tick(5000); h.adapter.showIfReady();
  assert.equal(h.calls.show, 0);
  h.success(1); // The fifth puzzle must not erase the pending opportunity.
  load.resolve(); await flush();
  assert.equal(h.calls.show, 1);
  h.adapter.showIfReady(); h.adapter.showIfReady(); await flush();
  assert.equal(h.calls.show, 1);
  h.events.get('Dismissed')(); await flush();
  h.adapter.showIfReady(); assert.equal(h.calls.show, 1);
});

test('loading alone cannot show before the UI confirms the new puzzle is displayed', async t => {
  const h = await setup(t); await h.adapter.start(); await flush();
  h.success(); await flush(); assert.equal(h.calls.show, 0);
  t.mock.timers.tick(1000); h.adapter.showIfReady(); await flush();
  assert.equal(h.calls.show, 1);
});

test('load backoff remains 30/60/120/240/300 seconds and survives puzzle requests and backgrounding', async t => {
  const h = await setup(t, { prepare: count => { if (count <= 5) throw new Error('private detail'); } });
  await h.adapter.start(); await flush();
  h.success(); h.adapter.showIfReady();
  for (const [index, delay] of [30_000, 60_000, 120_000, 240_000, 300_000].entries()) {
    await h.appState(false); t.mock.timers.tick(delay - 1); await flush();
    assert.equal(h.calls.prepare, index + 1);
    await h.appState(true); assert.equal(h.calls.prepare, index + 1);
    t.mock.timers.tick(1); await flush(); assert.equal(h.calls.prepare, index + 2);
  }
  assert.equal(h.calls.show, 1);
});

test('inactive start postpones UMP and initialization until foreground', async t => {
  const h = await setup(t, { active: false });
  await h.adapter.start(); assert.equal(h.calls.consent, 0); assert.equal(h.calls.prepare, 0);
  await h.appState(true);
  assert.equal(h.calls.consent, 1); assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
});

test('a load completed in background cannot show or request another load until foreground', async t => {
  const load = deferred(); const h = await setup(t, { prepare: () => load.promise });
  await h.adapter.start(); h.success(); h.adapter.showIfReady();
  await h.appState(false); load.resolve(); await flush();
  assert.equal(h.calls.show, 0); assert.equal(h.calls.prepare, 1);
  await h.appState(true); assert.equal(h.calls.show, 1);
});

test('consent denial blocks initialization and preparation even on the fourth success', async t => {
  const h = await setup(t, { consent: () => ({ ...consentInfo, canRequestAds: false }) });
  await h.adapter.start(); h.success(); h.adapter.showIfReady(); await flush();
  assert.equal(h.calls.initialize, 0); assert.equal(h.calls.prepare, 0); assert.equal(h.calls.show, 0);
});

test('delayed load does not show over another menu or an open dialog', async t => {
  const load = deferred(); const h = await setup(t, { prepare: () => load.promise });
  await h.adapter.start(); h.success(); h.adapter.showIfReady(); h.state.quiz = false;
  load.resolve(); await flush(); assert.equal(h.calls.show, 0);
  h.state.quiz = true; h.state.dialog = true; h.adapter.showIfReady(); assert.equal(h.calls.show, 0);
  h.state.dialog = false; h.adapter.showIfReady(); assert.equal(h.calls.show, 1);
});

test('partial listener registration failure retries only missing listeners', async t => {
  const h = await setup(t, { listener: (name, count) => name === 'FailedToShow' && count === 1 });
  await h.adapter.start(); assert.equal(h.calls.consent, 0);
  await h.adapter.start(); await flush();
  assert.equal(h.calls.registrations.get('appStateChange'), 1);
  assert.equal(h.calls.registrations.get('Dismissed'), 1);
  assert.equal(h.calls.registrations.get('FailedToShow'), 2);
  assert.equal(h.calls.registrations.get('FailedToLoad'), 1);
  assert.equal(h.calls.initialize, 1);
});

test('foreground event before document visibility recovers when the document becomes visible', async t => {
  const h = await setup(t, { active: false }); await h.adapter.start();
  h.state.hidden = true; await h.appState(true);
  assert.equal(h.calls.consent, 0);
  h.state.hidden = false; h.events.get('visibilitychange')(); await flush();
  assert.equal(h.calls.consent, 1); assert.equal(h.calls.prepare, 1);
});

test('backgrounding during UMP prevents initialization until a subsequent foreground', async t => {
  const request = deferred();
  const h = await setup(t, { consent: count => count === 1 ? request.promise : consentInfo });
  const start = h.adapter.start(); await flush();
  await h.appState(false); request.resolve(consentInfo); await start;
  assert.equal(h.calls.initialize, 0); assert.equal(h.calls.prepare, 0);
  await h.appState(true);
  assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
});

test('failed show and repeated finish events cannot reuse the same display opportunity', async t => {
  const h = await setup(t, { show: () => { throw new Error('private detail'); } });
  await h.adapter.start(); await flush(); h.success(); h.adapter.showIfReady(); await flush();
  h.events.get('FailedToShow')(); h.events.get('Dismissed')();
  h.adapter.showIfReady(); await flush(); assert.equal(h.calls.show, 1);
  assert.ok(!JSON.stringify(h.logs).includes('private detail'));
  assert.ok(!JSON.stringify(h.logs).includes('ca-app-pub-'));
});

test('native initialization finishing after timeout resumes preparation without another explicit start', async t => {
  const initialization = deferred(); const h = await setup(t, { initialize: () => initialization.promise });
  const start = h.adapter.start(); await flush();
  t.mock.timers.tick(20_000); await start;
  initialization.resolve(); await flush();
  assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
});

test('UMP timeout retry waits for the original request instead of sending a duplicate', async t => {
  const request = deferred(); const h = await setup(t, { consent: () => request.promise });
  const start = h.adapter.start(); await flush(); t.mock.timers.tick(20_000); await start;
  const retry = h.adapter.start(); await flush(); assert.equal(h.calls.consent, 1);
  request.resolve(consentInfo); await retry; await flush();
  assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
});

test('reading a consent form is not timed out or duplicated by repeated start calls', async t => {
  const form = deferred();
  const h = await setup(t, {
    consent: () => ({ ...consentInfo, status: 'REQUIRED', canRequestAds: false, isConsentFormAvailable: true }),
    form: () => form.promise,
  });
  const start = h.adapter.start(); await flush();
  t.mock.timers.tick(60_000); const repeated = h.adapter.start(); await flush();
  assert.equal(h.calls.form, 1); assert.equal(h.calls.initialize, 0); assert.equal(h.calls.prepare, 0);
  form.resolve(consentInfo); await Promise.all([start, repeated]); await flush();
  assert.equal(h.calls.initialize, 1); assert.equal(h.calls.prepare, 1);
});
