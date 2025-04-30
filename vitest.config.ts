// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'examples/**',
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**.config.**'
      ],
    },
  },
});
