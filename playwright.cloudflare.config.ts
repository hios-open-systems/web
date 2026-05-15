import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3201);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PERSIST_DIR = '.wrangler/state/auth-e2e';

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.auth.spec.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? 'github' : 'list',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    globalSetup: './tests/cloudflare.global-setup.ts',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 800 },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], channel: undefined },
        },
    ],
    webServer: {
        command: [
            'npx --yes wrangler pages dev .vercel/output/static',
            `--port ${PORT}`,
            `--persist-to ${PERSIST_DIR}`,
            `--binding AUTH_BASE_URL=${BASE_URL}`,
            '--binding GITHUB_CLIENT_ID=cloudflare-auth-e2e',
            '--binding GITHUB_CLIENT_SECRET=cloudflare-auth-e2e-secret',
            '--show-interactive-dev-session=false',
            '--log-level error',
        ].join(' '),
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});