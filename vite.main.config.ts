import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/main.ts', 
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', ...Object.keys(require('./package.json').dependencies || {})],
    },
  },
});