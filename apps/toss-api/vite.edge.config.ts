import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'src/edge.ts', target: 'es2022',
    outDir: '../../supabase/functions/toss-hints', emptyOutDir: false,
    rollupOptions: { output: { entryFileNames: 'index.ts' } },
  },
  ssr: { noExternal: true },
});
