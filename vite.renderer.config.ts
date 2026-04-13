import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: [react()], 
  build: {
    rollupOptions: {
      input: {
        main_window: path.resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
});