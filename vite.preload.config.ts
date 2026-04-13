import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '.vite/build', 
    lib: {
      entry: 'src/preload/preload.ts',
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
});