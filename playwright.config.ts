import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './tests',
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
            use: { ...devices['Desktop Chrome'], channel: undefined },
        },
    ],
    webServer: {
        command: `PORT=${PORT} npm run start`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
