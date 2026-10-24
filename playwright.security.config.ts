import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/security-api.auth.spec.ts', workers: 1,
  timeout: 60_000, globalSetup: './tests/security.global-setup.ts',
  use: { baseURL: 'http://localhost:3202' },
  webServer: {
    command: process.env.SECURITY_WORKER === '1'
      ? 'npx wrangler dev --local --config tests/fixtures/security.wrangler.jsonc --persist-to .wrangler/workspace-e2e --port 3202 --log-level error'
      : 'npx cross-env HIOS_LOCAL_D1=1 PORT=3202 npm run dev',
    url: 'http://localhost:3202/api/version', timeout: 180_000, reuseExistingServer: false,
  },
});
