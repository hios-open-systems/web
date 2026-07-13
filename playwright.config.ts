import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './tests',
    testIgnore: '**/*.auth.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 800 },
    },
    projects: [
        {
            name: 'chromium',
            testIgnore: ['**/*.auth.spec.ts', '**/mobile-responsive.spec.ts'],
            use: { ...devices['Desktop Chrome'], channel: undefined },
        },
        {
            name: 'mobile-360',
            testMatch: '**/mobile-responsive.spec.ts',
            use: { ...devices['Desktop Chrome'], channel: undefined, viewport: { width: 360, height: 800 } },
        },
        {
            name: 'mobile-390',
            testMatch: '**/mobile-responsive.spec.ts',
            use: { ...devices['Desktop Chrome'], channel: undefined, viewport: { width: 390, height: 844 } },
        },
        {
            name: 'tablet-768',
            testMatch: '**/mobile-responsive.spec.ts',
            use: { ...devices['Desktop Chrome'], channel: undefined, viewport: { width: 768, height: 1024 } },
        },
    ],
    webServer: {
        command: `PORT=${PORT} npm run start`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
