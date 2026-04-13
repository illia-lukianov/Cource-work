// vite.preload.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      // Зміни цей шлях на правильний (де зараз лежить твій файл)
      // Якщо ти поклав його в папку preload, то:
      entry: 'src/preload/preload.ts', 
      formats: ['cjs'],
    },
    // ... інший код
  },
});