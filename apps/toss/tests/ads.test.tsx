// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import type { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { AdBanner, RewardedAd, TEST_BANNER_ID, TEST_REWARDED_ID } from '../src/components/Ads.js';
import { HintGatewayError } from '../src/adapters/hintGateway.js';

const sdk = vi.hoisted(() => ({ load: vi.fn(), show: vi.fn(), initialize: vi.fn(), attach: vi.fn(), destroy: vi.fn(), supported: vi.fn(() => true), loadCleanup: vi.fn(), showCleanup: vi.fn() }));
vi.mock('@apps-in-toss/web-framework', () => ({
  loadFullScreenAd: Object.assign(sdk.load, { isSupported: sdk.supported }),
  showFullScreenAd: Object.assign(sdk.show, { isSupported: sdk.supported }),
  TossAds: { initialize: Object.assign(sdk.initialize, { isSupported: sdk.supported }), attachBanner: Object.assign(sdk.attach, { isSupported: sdk.supported }) },
}));
vi.mock('../src/adapters/platform.js', () => ({ isTossEnvironment: () => true, subscribeBack: () => () => {} }));
let root: Root, container: HTMLDivElement;
let loaded: Parameters<typeof loadFullScreenAd>[0];
let shown: Parameters<typeof showFullScreenAd>[0];
const gateway = () => ({ prepareTestAd: vi.fn().mockResolvedValue(10), claimTestAd: vi.fn().mockResolvedValue(15), balance: vi.fn(), startRound: vi.fn(), reveal: vi.fn(), answer: vi.fn() });
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.assign(window, { __appsInTossConstants: { safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } } });
  window.matchMedia = vi.fn((media: string) => ({ matches: false, media, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true }));
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
beforeEach(() => {
  vi.clearAllMocks(); sdk.supported.mockReturnValue(true);
  sdk.load.mockImplementation(options => { loaded = options; return sdk.loadCleanup; });
  sdk.show.mockImplementation(options => { shown = options; return sdk.showCleanup; });
  sdk.initialize.mockImplementation(options => options.callbacks.onInitialized());
  sdk.attach.mockReturnValue({ destroy: sdk.destroy });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes(text));
  if (!button) throw new Error(`Missing button ${text}`);
  await act(async () => button.click());
}
async function renderReward(service = gateway(), onBalance = vi.fn()) {
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><RewardedAd open gateway={service} onBalance={onBalance} onClose={() => {}} /></TDSMobileAITProvider>));
  await act(async () => loaded.onEvent({ type: 'loaded' }));
  return { service, onBalance };
}
it('only shows on request, does not reward a click or early dismissal, and cleans listeners', async () => {
  const { service } = await renderReward();
  expect(sdk.load.mock.calls[0][0].options.adGroupId).toBe(TEST_REWARDED_ID);
  expect(sdk.show).not.toHaveBeenCalled();
  await click('광고 보고 힌트 5개');
  await act(async () => { shown.onEvent({ type: 'clicked' }); shown.onEvent({ type: 'dismissed' }); });
  expect(service.prepareTestAd).toHaveBeenCalledTimes(1);
  expect(service.claimTestAd).not.toHaveBeenCalled();
  await act(async () => root.render(null));
  expect(sdk.loadCleanup).toHaveBeenCalled(); expect(sdk.showCleanup).toHaveBeenCalled();
});
it('claims once despite duplicate completion events and retries the same UUID after a lost response', async () => {
  const service = gateway(); service.claimTestAd.mockRejectedValueOnce(new Error('network'));
  const { onBalance } = await renderReward(service);
  await click('광고 보고 힌트 5개');
  await act(async () => {
    shown.onEvent({ type: 'userEarnedReward', data: { unitType: 'test', unitAmount: 999 } });
    shown.onEvent({ type: 'userEarnedReward', data: { unitType: 'test', unitAmount: 999 } });
    shown.onEvent({ type: 'dismissed' }); shown.onEvent({ type: 'dismissed' });
  });
  expect(onBalance).not.toHaveBeenCalled();
  expect(service.claimTestAd).toHaveBeenCalledTimes(1);
  await click('보상 다시 받기');
  expect(service.claimTestAd.mock.calls[0]).toEqual(service.claimTestAd.mock.calls[1]);
  expect(service.claimTestAd.mock.calls[0]).toEqual(service.prepareTestAd.mock.calls[0]);
  expect(onBalance).toHaveBeenCalledWith(15);
  expect(container.textContent).toContain('힌트 5개가 추가');
});
it('does not show an ad when reward preparation fails', async () => {
  const service = gateway(); service.prepareTestAd.mockRejectedValue(new Error('disabled'));
  await renderReward(service); await click('광고 보고 힌트 5개');
  expect(sdk.show).not.toHaveBeenCalled(); expect(service.claimTestAd).not.toHaveBeenCalled();
  expect(container.textContent).toContain('disabled');
});
it('shows a cooldown instead of a reload button when the server rejects the reward frequency', async () => {
  const service = gateway(); service.prepareTestAd.mockRejectedValue(new HintGatewayError('ad_reward_limit', '광고 보상은 1분에 한 번, 24시간 동안 최대 10번 받을 수 있습니다.'));
  await renderReward(service); await click('광고 보고 힌트 5개');
  expect(sdk.show).not.toHaveBeenCalled();
  expect(container.textContent).toContain('60초 후 다시 이용 가능');
  expect(container.textContent).not.toContain('다시 준비하기');
  expect(service.claimTestAd).not.toHaveBeenCalled();
});
it('handles unsupported SDK and load failure without blocking ordinary app use', async () => {
  sdk.supported.mockReturnValue(false);
  await act(async () => root.render(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><RewardedAd open gateway={gateway()} onBalance={() => {}} onClose={() => {}} /></TDSMobileAITProvider>));
  expect(sdk.load).not.toHaveBeenCalled(); expect(container.textContent).toContain('지원되는 토스 앱');
});
it('attaches one test banner, destroys it while reward UI is active, collapses on no fill', async () => {
  await act(async () => root.render(<AdBanner enabled />));
  expect(sdk.attach).toHaveBeenCalledTimes(1); expect(sdk.attach.mock.calls[0][0]).toBe(TEST_BANNER_ID);
  await act(async () => root.render(<AdBanner enabled={false} />));
  expect(sdk.destroy).toHaveBeenCalledTimes(1); expect(container.querySelector('aside')).toBeNull();
  await act(async () => root.render(<AdBanner enabled />));
  await act(async () => sdk.attach.mock.calls[1][2].callbacks.onNoFill());
  expect(container.querySelector('aside')).toBeNull(); expect(sdk.destroy).toHaveBeenCalledTimes(2);
});
