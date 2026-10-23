import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 콘솔 등록 정보: 영어 낱말 / 비게임·교육 (이름·유형은 콘솔에서 관리).
  appName: 'english-words',
  brand: { primaryColor: '#3182f6' },
  permissions: [],
  webBundleDir: 'dist',
  navigationBar: { withBackButton: true, withHomeButton: true },
  webView: { bounces: false, pullToRefreshEnabled: false },
});
