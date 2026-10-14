import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 3 runs the shell tests against the dev server (dev-only test pages). Phase 9 switches
 * the main suite to `astro preview` of the production build.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // The dev server renders /enquire through the Workers runtime; more than two parallel workers
  // overload it on a 4-core machine and cause timeouts.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    // --ignore-lock keeps the server in the foreground (Astro backgrounds it when run by an agent).
    command: 'pnpm exec astro dev --port 4321 --ignore-lock',
    url: 'http://localhost:4321/dev/layout',
    reuseExistingServer: !process.env.CI,
    env: { ASTRO_TELEMETRY_DISABLED: '1', E2E: '1', ENQUIRY_MOCK: 'true' },
    timeout: 120_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
