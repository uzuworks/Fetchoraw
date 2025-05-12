// vitest.config.ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'fetchoraw': path.resolve(__dirname, './dist')
    }
  },
  test: {
    include: ['tests/vitest/**/*.test.ts'],
    coverage: {
      exclude: [
        'vite.**',
        'build/**',
        'examples/**',
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**.config.**',
        'tests/playwright/**',
      ],
    },
  },
});
