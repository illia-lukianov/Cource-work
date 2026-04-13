import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/main.ts', 
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron'],
    },
    minify: false,
  },
});