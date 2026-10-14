import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor용 빌드 설정
  build: {
    outDir: 'dist',
  },
});
