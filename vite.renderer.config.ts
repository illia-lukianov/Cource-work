import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const rendererRoot = path.resolve(__dirname, "src/renderer");
const rendererEntry = path.resolve(rendererRoot, "index.html");
const rendererOutDir = path.resolve(__dirname, ".vite/renderer");

export default defineConfig({
  base: "./",
  root: rendererRoot,
  plugins: [react()],
  build: {
    outDir: rendererOutDir,
    emptyOutDir: true,
    rollupOptions: {
      input: rendererEntry,
    },
  },
});
