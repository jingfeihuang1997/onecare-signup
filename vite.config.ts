import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves the site from /<repository>/; the workflow passes that in.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: { port: 5173, strictPort: false },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    // Many tests type their way through the whole sign-up, and the first test of a file also
    // pays for loading the app. On a busy machine that has taken over 20 seconds.
    testTimeout: 60000,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
