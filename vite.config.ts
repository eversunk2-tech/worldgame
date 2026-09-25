import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500, // Phaser alone is ≈1.2 MB in its own chunk
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
  server: {
    port: 5173,
  },
  test: {
    include: ['src/shared/**/*.test.ts'],
    environment: 'node',
  },
});
