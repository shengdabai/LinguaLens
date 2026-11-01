import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor loads files via capacitor:// scheme — relative paths required
  base: './',
  server: { port: 3000 },
  build: {
    target: 'es2017',
    outDir: 'dist',
    sourcemap: false,
    // Vite 8 uses oxc (rolldown) instead of esbuild for transform/minify.
    minify: 'oxc',
  },
  oxc: {
    // Strip all console.* calls in production builds to avoid leaking
    // internal error details to end users.
    drop: ['console'],
  },
});
