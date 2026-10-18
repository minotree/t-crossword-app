import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { App } from './App.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('앱을 표시할 영역을 찾지 못했습니다.');
createRoot(root).render(<StrictMode>
  <TDSMobileAITProvider brandPrimaryColor="#3182f6">
    <App />
  </TDSMobileAITProvider>
</StrictMode>);
