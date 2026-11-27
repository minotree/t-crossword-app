// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defaultVocabList } from '@t-crossword/core';
import { SettingsPage } from '../src/pages/SettingsPage.js';
import { trackPwaInstallation } from '../src/adapters/pwaInstall.js';
import { WORD_PROGRESS_KEY, wordProgressStore } from '../src/adapters/wordProgress.js';

let host: HTMLDivElement, root: Root, stop: () => void;
let previous: string | null;
const mediaListeners = new Set<() => void>();
let standalone = false;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  previous = localStorage.getItem(WORD_PROGRESS_KEY);
  localStorage.setItem(WORD_PROGRESS_KEY, JSON.stringify({ completedWordIds: [defaultVocabList[0].id], bookmarkedWordIds: ['bookmark'], hintUsedWordIds: ['mistake'], dismissedMistakeWordIds: ['hidden'] }));
  wordProgressStore.reload();
  standalone = false;
  vi.stubGlobal('matchMedia', () => ({ get matches() { return standalone; }, addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener), removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener) }));
  stop = trackPwaInstallation();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); stop();
  window.dispatchEvent(new Event('appinstalled'));
  if (previous === null) localStorage.removeItem(WORD_PROGRESS_KEY); else localStorage.setItem(WORD_PROGRESS_KEY, previous);
  wordProgressStore.reload(); vi.restoreAllMocks(); vi.unstubAllGlobals(); mediaListeners.clear();
});
const render = () => act(async () => root.render(<SettingsPage />));
const reset = () => host.querySelector<HTMLButtonElement>('.mnu-web-settings-reset');

it('shows independent PWA version, vocabulary information and explicitly scoped policy links', async () => {
  await render();
  expect(host.textContent).toContain('v1.0.0');
  expect(host.textContent).toContain('3,839'); expect(host.textContent).toContain('3,339');
  expect(host.textContent).toContain('학술·심화 영어 어휘 500개');
  expect(host.textContent).toContain('오답노트에 표시 중이면 다시 출제됩니다');
  expect(host.textContent).toContain('WordNet 3.0');
  expect(host.querySelector('a[href="mailto:support@mnuappstudio.com"]')).not.toBeNull();
  const policy = host.querySelector('a[href="https://mnuappstudio.com/privacy/crossword/web/"]');
  expect(policy?.textContent).toBe('개인정보처리방침'); expect(policy?.getAttribute('rel')).toContain('noopener');
  expect(host.textContent).not.toContain('Android 앱 대상');
});

it('confirms before resetting only completed words and updates the actual count', async () => {
  await render(); const before = localStorage.getItem(WORD_PROGRESS_KEY);
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await act(async () => reset()?.click()); expect(localStorage.getItem(WORD_PROGRESS_KEY)).toBe(before);
  confirm.mockReturnValue(true); await act(async () => reset()?.click());
  expect(JSON.parse(localStorage.getItem(WORD_PROGRESS_KEY) || '{}')).toEqual({ completedWordIds: [], bookmarkedWordIds: ['bookmark'], hintUsedWordIds: ['mistake'], dismissedMistakeWordIds: ['hidden'] });
  expect(reset()?.disabled).toBe(true); expect(host.textContent).toContain('학습 완료 단어 0개');
});

it('offers a real one-use install prompt captured before Settings mounts', async () => {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
  window.dispatchEvent(event); await render();
  expect(event.defaultPrevented).toBe(true);
  await act(async () => host.querySelector<HTMLButtonElement>('.mnu-web-settings-install')?.click());
  expect(prompt).toHaveBeenCalledTimes(1); expect(host.querySelector('.mnu-web-settings-install')).toBeNull();
  expect(host.textContent).toContain('Safari');
});

it('hides install guidance in standalone mode and after appinstalled', async () => {
  await render();
  await act(async () => { standalone = true; mediaListeners.forEach(listener => listener()); });
  expect(host.querySelector('#app-installation')).toBeNull();
  await act(async () => { standalone = false; mediaListeners.forEach(listener => listener()); });
  expect(host.querySelector('#app-installation')).not.toBeNull();
  await act(async () => window.dispatchEvent(new Event('appinstalled')));
  expect(host.querySelector('#app-installation')).toBeNull();
});

it('handles failed install prompts without leaving a nonfunctional button', async () => {
  window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt: vi.fn().mockRejectedValue(new Error('not allowed')), userChoice: Promise.resolve({ outcome: 'dismissed' }) }));
  await render();
  await act(async () => host.querySelector<HTMLButtonElement>('.mnu-web-settings-install')?.click());
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('앱을 설치하지 못했습니다');
  expect(host.querySelector('.mnu-web-settings-install')).toBeNull();
});

it('recognizes the Safari standalone flag without requiring an install event', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'standalone');
  try {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    stop(); stop = trackPwaInstallation();
    await render();
    expect(host.querySelector('#app-installation')).toBeNull();
  } finally {
    if (descriptor) Object.defineProperty(navigator, 'standalone', descriptor);
    else Reflect.deleteProperty(navigator, 'standalone');
  }
});
