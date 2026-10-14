import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tcrossword.app',
  appName: '십자낱말풀이',
  webDir: 'dist',
  server: {
    // 개발 시 로컬 서버 사용 (배포 시 제거)
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
};

export default config;
