import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const BUILD_OUTPUT_DIR = '.vercel/output/static';
const PERSIST_DIR = '.wrangler/state/auth-e2e';
const SEED_SQL_FILE = 'test-results/cloudflare-auth-seed.sql';

function runOrThrow(command: string, description: string) {
    try {
        execSync(command, {
            cwd: ROOT_DIR,
            stdio: 'inherit',
        });
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(
            `${description} failed. This suite needs a working local Wrangler runtime with D1 support. ` +
            `On Linux, confirm the host glibc is new enough for Wrangler's bundled workerd.\n` +
            `Command: ${command}\n${detail}`,
        );
    }
}

export default async function globalSetup() {
    runOrThrow('npm run build', 'Next build for Cloudflare auth smoke');

    if (!existsSync(path.join(ROOT_DIR, BUILD_OUTPUT_DIR))) {
        throw new Error(`Missing ${BUILD_OUTPUT_DIR} after build`);
    }

    runOrThrow('node scripts/prepare-cloudflare-auth-e2e.mjs', 'Cloudflare auth seed SQL generation');

    for (const file of ['migrations/0001_init.sql', 'migrations/0002_user_settings.sql', SEED_SQL_FILE]) {
        runOrThrow(
            `npx --yes wrangler d1 execute DB --local --yes --persist-to ${PERSIST_DIR} --file ${file}`,
            `Apply ${file} to local D1 auth test database`,
        );
    }
}