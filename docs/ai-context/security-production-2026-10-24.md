# Production security hardening — 2026-10-24

## Scope and verified production state

Read-only Wrangler/API inspection confirmed account `74517853847d3bfb25721012cf268858`, Worker `hios-platform`, and domain `openhios.dev`. No push, deployment, secret write, or remote configuration mutation was performed.

At inspection time, production had only `GITHUB_CLIENT_SECRET`; no Turnstile widget, site key, secret, or native rate-limit bindings. Query-string redaction was disabled, and workers.dev/preview URLs were enabled. OAuth start used the expected GitHub client/callback and Secure, HttpOnly, SameSite=Lax cookies. A complete provider login was not tested. The owner ID is pinned to `37183343` in local configuration.

## Local changes

- Pin the Cloudflare account; disable workers.dev and preview URLs on the next deployment. Preserve the existing custom domain.
- Redact URL query strings in Worker observability to avoid logging OAuth codes/state and tool inputs. This does not erase historical logs or redact arbitrary application log messages.
- Replace production per-isolate rate counters with native bindings for existing limits (3, 5, 10, 20, 30, 60, 120 requests/minute). Keys separate route scopes and use Cloudflare's client IP, never caller-controlled X-Forwarded-For. Missing/failing bindings return 503; exhausted limits return 429. Memory fallback is development-only.
- Turnstile rejects missing production secrets, malformed/oversized tokens, wrong hostname/action, upstream errors and timeouts. Feedback and guestbook use separate actions. Loading Cloudflare remains behind explicit consent.
- The npm deploy command and GitHub Actions release gate require a non-test public key present in built browser assets and both production secret names. These checks cannot validate secret contents or provider-console settings, and direct Wrangler/OpenNext commands can bypass them.

Native counters are approximate and shared per Cloudflare location, not an exact global quota or a replacement for edge WAF protection. See [Cloudflare rate limits](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) and [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Release prerequisites — not yet applied

1. Provision a real Turnstile widget restricted to `openhios.dev`, set `NEXT_PUBLIC_TURNSTILE_SITEKEY` in the build environment (GitHub Actions repository variable if using CI), and provision `TURNSTILE_SECRET_KEY` for the release. Do not commit either credential configuration file. Wrangler secret writes can deploy; coordinate this with the authorized release. Without the secret, production feedback and guestbook writes now intentionally fail closed.
2. Verify OAuth provider settings and a complete login/logout after release, including the canonical callback. Verify custom-domain routing before disabling alternate hosts.
3. Obtain access to WAF, zone security settings and Workers Builds configuration. Current OAuth returns 403 for these endpoints; this does not establish whether protections exist. Review edge limits, HTTPS configuration and the automatic deployment trigger before pushing: the previous push triggered Workers Builds.
4. Account-wide 2FA enforcement was false; individual enrollment was not visible. Check member enrollment and recovery access before enforcing it. GitHub main was unprotected with no rulesets; choose and configure branch protection before release.
5. After an authorized release, check production version, cookie flags, no-store API responses, native-limit behavior, successful/failed captcha submissions and alternate-host shutdown. Confirm query redaction in new logs.

## Validation

The production security self-test exercises native limiter allow/deny/failure, trusted IP selection, Turnstile failure modes and hostname/action separation, deployment configuration, and the missing-key release guard. API integration tests run against the compiled Worker and local D1, including a missing-secret rejection and repeated-write 429 check. No test contacts the live Turnstile verification endpoint.

Validation completed: ESLint passed; 47/47 self-test groups passed; OpenNext production build passed; 8/8 local Worker API security tests passed. The expanded configuration/release-guard self-test also passed after its final assertions were added.
