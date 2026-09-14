import { defineConfig, devices } from '@playwright/test'

const preview = process.env.PLAYWRIGHT_PREVIEW === '1'
const port = preview ? 4173 : 5173

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: preview
      ? 'npm run preview -- --host 127.0.0.1'
      : 'npm run dev -- --host 127.0.0.1',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
