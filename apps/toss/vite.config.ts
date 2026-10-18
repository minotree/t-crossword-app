import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

export default defineConfig(({ command, mode }) => ({
  plugins: [react(), ...(command === 'serve' && mode !== 'test' ? [aitDevtools.vite()] : [])],
  server: { host: '0.0.0.0', port: 5174, strictPort: true },
  build: { outDir: 'dist', target: 'es2020' },
}));
