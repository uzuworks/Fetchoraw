// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: true,
  use: {
    headless: true
  }
})
