import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  envDir: '../..',
  build: { manifest: true },
  plugins: [
    react(),
    tailwindcss(),
  ],
});
