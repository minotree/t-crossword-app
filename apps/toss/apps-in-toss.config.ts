import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 콘솔 등록 정보: 영어 퍼즐 / 게임 (이름·유형은 콘솔에서 관리).
  appName: 't-crossword',
  brand: { primaryColor: '#3182f6' },
  permissions: [],
  webBundleDir: 'dist',
  navigationBar: { withBackButton: true, withHomeButton: true },
  webView: { bounces: false, pullToRefreshEnabled: false },
});
