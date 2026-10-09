import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/workspaces.auth.spec.ts', workers: 1, timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://localhost:3202', viewport: { width: 1280, height: 800 }, actionTimeout: 20_000, navigationTimeout: 30_000, trace: 'retain-on-failure' },
  webServer: { command: 'npx cross-env HIOS_LOCAL_D1=1 PORT=3202 npm run dev', url: 'http://localhost:3202', timeout: 180_000, reuseExistingServer: false },
});
