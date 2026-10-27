import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { App } from './App.js';
import './styles.css';

if (import.meta.env.VITE_TOSS_LAYOUT_DEBUG === 'true') {
  void import('./adapters/layoutDiagnostics.js').then(({ startLayoutDiagnostics }) => startLayoutDiagnostics());
}

const root = document.getElementById('root');
if (!root) throw new Error('앱을 표시할 영역을 찾지 못했습니다.');
if (import.meta.env.DEV) {
  await import('./preview.css');
  const syncPreviewHeight = () => {
    const height = getComputedStyle(document.body).maxHeight;
    document.documentElement.style.setProperty('--preview-viewport-height', height === 'none' ? '100dvh' : height);
  };
  const observer = new ResizeObserver(syncPreviewHeight);
  observer.observe(document.body);
  syncPreviewHeight();
  import.meta.hot?.dispose(() => observer.disconnect());
}
let Screen = App;
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('answer-layout') === 'long') {
  Screen = (await import('./dev/AnswerLayoutPreview.js')).AnswerLayoutPreview;
}
createRoot(root).render(<StrictMode>
  <TDSMobileAITProvider brandPrimaryColor="#3182f6">
    <Screen />
  </TDSMobileAITProvider>
</StrictMode>);
