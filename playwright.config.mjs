import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    }
  },
  projects: [
    { name: 'phone', testIgnore: '**/visual.spec.mjs', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    {
      name: 'desktop',
      testIgnore: '**/visual.spec.mjs',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } }
    },
    { name: 'layout', testMatch: '**/visual.spec.mjs', use: { browserName: 'chromium' } }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true
  }
})
