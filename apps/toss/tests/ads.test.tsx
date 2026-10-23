// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { AdBanner, isProductionBannerId } from '../src/components/Ads.js';
const sdk = vi.hoisted(() => ({ load: vi.fn(), show: vi.fn(), initialize: vi.fn(), attach: vi.fn(), destroy: vi.fn(), supported: vi.fn(() => true), loadCleanup: vi.fn(), showCleanup: vi.fn() }));
vi.mock('@apps-in-toss/web-framework', () => ({
  TossAds: { initialize: Object.assign(sdk.initialize, { isSupported: sdk.supported }), attachBanner: Object.assign(sdk.attach, { isSupported: sdk.supported }) },
}));

vi.mock('../src/adapters/platform.js', () => ({ isTossEnvironment: () => true }));
let root: Root, container: HTMLDivElement;
beforeAll(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_TOSS_BANNER_AD_GROUP_ID', '');
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllEnvs(); });
it('rejects missing and test banner IDs', () => {
  expect(isProductionBannerId('')).toBe(false);
  expect(isProductionBannerId('   ')).toBe(false);
  expect(isProductionBannerId('ait-ad-test-banner-id')).toBe(false);
  expect(isProductionBannerId('ait-ad-production-example')).toBe(true);
});
it('does not initialize or reserve ad space without an issued banner ID', async () => {
  await act(async () => root.render(<AdBanner enabled />));
  expect(sdk.initialize).not.toHaveBeenCalled();
  expect(sdk.attach).not.toHaveBeenCalled();
  expect(container.querySelector('aside')).toBeNull();
});

it('uses the configured production banner and destroys it on no fill', async () => {
  vi.stubEnv('VITE_TOSS_BANNER_AD_GROUP_ID', 'ait-ad-production-example');
  sdk.initialize.mockImplementation(options => options.callbacks.onInitialized());
  sdk.attach.mockReturnValue({ destroy: sdk.destroy });
  await act(async () => root.render(<AdBanner enabled />));
  expect(sdk.attach.mock.calls[0][0]).toBe('ait-ad-production-example');
  await act(async () => sdk.attach.mock.calls[0][2].callbacks.onNoFill());
  expect(container.querySelector('aside')).toBeNull();
  expect(sdk.destroy).toHaveBeenCalledTimes(1);
});
