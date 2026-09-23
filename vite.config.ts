import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 700, // three.js alone is ~500 kB minified; a single chunk is fine for v0.1
  },
  server: {
    port: 5173,
  },
});
