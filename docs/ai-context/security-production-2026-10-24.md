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

## Turnstile provisioning follow-up

- Created `HIOS production` in the verified account, managed mode, domain allowlist `openhios.dev`, pre-clearance disabled (`no_clearance`). Cloudflare domain allowlists also include subdomains; the application additionally verifies the exact canonical hostname.
- Configured the real public key in ignored `.env.local` and the GitHub Actions repository variable `NEXT_PUBLIC_TURNSTILE_SITEKEY`. No secret key was stored in Git or GitHub repository variables.
- Saved the secret using `wrangler versions secret put`, which creates a version without deploying. Staged version: `aeaa80f7-c294-4aa2-ab1b-25f9e29980a2`, tag `turnstile-staged`. Both GitHub and Turnstile secret bindings were verified on this version. This is a copy of the previous Worker, **not the new security build**; do not deploy this version by itself as the security release.
- Confirmed production deployment remained `7946b0e7-bc8f-4cd6-90ba-36a679a86ad5`, serving version `3d658823-e452-4109-97c2-a55f1b95540b` at 100% after staging. `wrangler secret list` now lists the staged Turnstile binding; this does not mean production is using it.
- Encrypted local recovery copy: `.wrangler/security/turnstile-secret.dpapi`, protected by Windows DPAPI for the current Windows user. Public key copy: `.wrangler/security/turnstile-sitekey.txt`. Both paths and `.env.local` are ignored by Git. Do not print, commit, or send the decrypted value through chat. If recovery is needed, decrypt only in memory and pipe to the authorized Cloudflare secret command.
- WAF/SSL/Workers Builds inspection still returns HTTP 403 with the current OAuth scopes. Account-wide 2FA enforcement is still false; member/user API responses do not expose enrollment. The last remote main commit has a successful `Workers Builds: hios-platform` check, so automatic deployment must be reviewed in the panel before a push. No WAF, 2FA or build-trigger settings have been changed.

For the eventual release, build from updated local main with the real public key, preserve/verify both secret bindings on the new version, run security tests and release prerequisites, then deploy only after explicit authorization. GitHub Actions has the public build variable; any independent Workers Builds environment still needs inspection. The first checklist item above is now provisioned for local/Actions builds and staged Worker secrets, but production activation and end-to-end captcha verification remain pending.

Follow-up validation: OpenNext build with the real public site key completed successfully. The read-only `security-release-check.mjs` passed against the built assets and staged secret names. This is not an end-to-end captcha test or authorization to deploy. Browser review remains blocked because the authenticated Chrome window is not exposed by the connected extension; desktop control was stopped by its URL-verification safeguard.
