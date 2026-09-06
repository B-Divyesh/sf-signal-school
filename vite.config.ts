import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: { main: 'index.html' }
    }
  },
  server: { port: 4173, strictPort: true }
});
