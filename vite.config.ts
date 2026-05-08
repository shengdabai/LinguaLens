import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor loads files via capacitor:// scheme — relative paths required
  base: './',
  build: {
    target: 'es2017',
    outDir: 'dist',
    sourcemap: false,
  },
  server: { port: 3000 },
});
