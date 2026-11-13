import { defineConfig, devices } from '@playwright/test';

// Local run: start the backend (gymmigo-backend: E2E_KEEP=1 scripts/e2e.sh → API on :8765),
// then `npm run test:e2e`. The web dev server is started here against that API.
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:8765/api/v1';
const PORT = Number(process.env.E2E_WEB_PORT ?? 5174);

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'off',
    ...devices['Desktop Chrome'],
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : undefined,
  },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    env: { VITE_API_URL: API },
    timeout: 120_000,
  },
});
