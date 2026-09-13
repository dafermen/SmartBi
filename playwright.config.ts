import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  workers: 1,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.SMARTBI_E2E_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: process.env.SMARTBI_E2E_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 90_000,
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'chromium-tablet',
      use: { viewport: { width: 768, height: 1024 }, browserName: 'chromium' },
    },
    {
      name: 'chromium-desktop',
      use: { viewport: { width: 1440, height: 900 }, browserName: 'chromium' },
    },
    {
      name: 'edge-desktop',
      use: { viewport: { width: 1440, height: 900 }, browserName: 'chromium', channel: 'msedge' },
    },
    {
      name: 'firefox-desktop',
      use: { viewport: { width: 1440, height: 900 }, browserName: 'firefox' },
    },
    {
      name: 'webkit-desktop',
      use: { viewport: { width: 1440, height: 900 }, browserName: 'webkit' },
    },
  ],
});
