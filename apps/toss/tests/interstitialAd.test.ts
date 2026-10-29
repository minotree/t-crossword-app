import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createInterstitialAd } from '../src/adapters/interstitialAd.js';

const sdk = vi.hoisted(() => ({ load: vi.fn(), show: vi.fn(), supported: vi.fn(() => true) }));
vi.mock('@apps-in-toss/web-framework', () => ({
  loadFullScreenAd: Object.assign(sdk.load, { isSupported: sdk.supported }),
  showFullScreenAd: Object.assign(sdk.show, { isSupported: sdk.supported }),
}));
vi.mock('../src/adapters/platform.js', () => ({ isTossEnvironment: () => true }));
const id = 'ait.v2.live.08b04047cca14d39';
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); sdk.supported.mockReturnValue(true); });
afterEach(() => { vi.useRealTimers(); });

it('skips unconfigured, unsupported and not yet loaded ads', async () => {
  const empty = createInterstitialAd(''); empty.load(); await empty.show();
  expect(sdk.load).not.toHaveBeenCalled();
  sdk.supported.mockReturnValue(false);
  const unsupported = createInterstitialAd(id); unsupported.load(); await unsupported.show();
  expect(sdk.load).not.toHaveBeenCalled();
  sdk.supported.mockReturnValue(true);
  const ad = createInterstitialAd(id); ad.load(); await ad.show();
  expect(sdk.load).toHaveBeenCalledTimes(1);
  expect(sdk.show).not.toHaveBeenCalled(); ad.dispose();
});

it('uses the issued ID and waits for dismissal before reloading', async () => {
  const ad = createInterstitialAd(id); ad.load();
  sdk.load.mock.calls[0][0].onEvent({ type: 'loaded' });
  let finished = false;
  const result = ad.show().then(() => { finished = true; });
  expect(sdk.show.mock.calls[0][0].options.adGroupId).toBe(id);
  sdk.show.mock.calls[0][0].onEvent({ type: 'show' });
  await vi.advanceTimersByTimeAsync(30_000);
  expect(finished).toBe(false);
  sdk.show.mock.calls[0][0].onEvent({ type: 'dismissed' });
  await result;
  expect(finished).toBe(true);
  expect(sdk.load).toHaveBeenCalledTimes(2); ad.dispose();
});

it.each(['failedToShow', 'error', 'timeout'])('continues on %s', async (failure) => {
  const ad = createInterstitialAd(id); ad.load();
  sdk.load.mock.calls[0][0].onEvent({ type: 'loaded' });
  const result = ad.show();
  if (failure === 'error') sdk.show.mock.calls[0][0].onError(new Error('no fill'));
  else if (failure === 'timeout') await vi.advanceTimersByTimeAsync(20_000);
  else sdk.show.mock.calls[0][0].onEvent({ type: failure });
  await result; ad.dispose();
});
