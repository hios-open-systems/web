import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLOUDFLARE_AUTH_SEED } from '../tests/fixtures/cloudflare-auth-seed.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'test-results');
const outputFile = path.join(outputDir, 'cloudflare-auth-seed.sql');

const now = Date.now();
const sessionExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

function sqlString(value) {
    return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlBoolean(value) {
    return value ? '1' : '0';
}

function sqlJson(value) {
    return sqlString(JSON.stringify(value));
}

const statements = [
    'PRAGMA foreign_keys = ON;',
    'BEGIN;',
    `DELETE FROM sessions WHERE id = ${sqlString(CLOUDFLARE_AUTH_SEED.session.id)} OR user_id = ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)};`,
    `DELETE FROM snippets WHERE user_id = ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)};`,
    `DELETE FROM user_settings WHERE user_id = ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)};`,
    `DELETE FROM users WHERE id = ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)};`,
    `INSERT INTO users (id, github_id, github_login, name, avatar_url, email, created_at)
     VALUES (
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)},
         ${CLOUDFLARE_AUTH_SEED.user.githubId},
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.githubLogin)},
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.name)},
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.avatarUrl)},
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.email)},
         ${now}
     );`,
    `INSERT INTO sessions (id, user_id, expires_at, created_at)
     VALUES (
         ${sqlString(CLOUDFLARE_AUTH_SEED.session.id)},
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)},
         ${sessionExpiresAt},
         ${now}
     );`,
    ...CLOUDFLARE_AUTH_SEED.snippets.map((snippet, index) => {
        const updatedAt = now + index;
        return `INSERT INTO snippets (id, user_id, title, body, tags, is_public, created_at, updated_at)
     VALUES (
         ${sqlString(snippet.id)},
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)},
         ${sqlString(snippet.title)},
         ${sqlString(snippet.body)},
         ${sqlJson(snippet.tags)},
         ${sqlBoolean(snippet.isPublic)},
         ${updatedAt},
         ${updatedAt}
     );`;
    }),
    `INSERT INTO user_settings (user_id, key, value, updated_at)
     VALUES (
         ${sqlString(CLOUDFLARE_AUTH_SEED.user.id)},
         'theme_accent',
         ${sqlString(CLOUDFLARE_AUTH_SEED.theme.accent)},
         ${now}
     )
     ON CONFLICT(user_id, key)
     DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    'COMMIT;',
];

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, `${statements.join('\n')}\n`, 'utf8');

console.log(`Wrote ${path.relative(projectRoot, outputFile)}`);