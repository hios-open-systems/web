export const DEPLOY_VERSION_FALLBACK = 'dev-local';

export function getCurrentDeployVersion(): string {
    return (
        // Injected at build time via next.config.mjs (works on Cloudflare
        // Workers, where the env vars below are not present at runtime).
        process.env.NEXT_PUBLIC_DEPLOY_VERSION ??
        process.env.CF_PAGES_COMMIT_SHA ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.npm_package_version ??
        DEPLOY_VERSION_FALLBACK
    );
}