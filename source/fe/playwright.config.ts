import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    headless: true,
    baseURL: 'http://localhost:5173',
    actionTimeout: 10000,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  workers: 1,
})
