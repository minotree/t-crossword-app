import { defineConfig } from 'vite';
export default defineConfig({
  build: { ssr: 'src/mobileEdge.ts', target: 'es2022', outDir: '../../supabase/functions/mobile-hints', emptyOutDir: false,
    rollupOptions: { output: { entryFileNames: 'index.ts' } } },
  ssr: { noExternal: true },
});
