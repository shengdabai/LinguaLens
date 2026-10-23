import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // node_modules.nosync is the iCloud-excluded copy of node_modules; vitest's default
    // exclude only covers node_modules/, so without this line it collects third-party tests.
    exclude: [...configDefaults.exclude, '**/node_modules.nosync/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.d.ts'],
    },
  },
});
