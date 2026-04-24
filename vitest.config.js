import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/core/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.js'],
      exclude: ['src/core/__tests__/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@lib': resolve(__dirname, './api/_lib')
    }
  }
});
