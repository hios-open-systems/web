# Security review: authentication, permissions and API endpoints

Scope: local source review of every app/api handler, session/OAuth helpers, owner checks, snippets, user settings, workspace/preset persistence, SQL migrations and outbound network tools. No production scans or database changes.

## Corrections

- Owner permissions use immutable GitHub user ID 37183343, verified using https://api.github.com/users/juanjparedez. A renamed owner keeps access; another account with the former login does not acquire it. Forks must configure ADMIN_GITHUB_ID. A legacy ADMIN_GITHUB_LOGIN override without an ID fails closed.
- All state-changing handlers require an exact Origin match. This includes anonymous submissions which can be associated with a session. Missing/null/cross-origin requests receive 403; non-browser clients must provide Origin explicitly. Checks live in handlers, independent of middleware.
- Logout is POST-only and redirects with 303. GET cannot revoke a session. OAuth error responses clear both temporary cookies; post-login paths reject control characters.
- Snippet creation/update/import validates the boolean visibility field and string types at runtime. In particular, the string "false" no longer publishes a snippet. Invalid import entries are skipped instead of crashing after partial writes.
- JSON readers bound streamed bytes, not just Content-Length: 32 KiB for small submissions/settings, 64 KiB for individual snippets, 2.2 MB for imports and 1.1 MB for workspace/preset records. Oversize payloads return 413 before parsing; streams exceeding the limit are cancelled.
- API responses default to private/no-store, including session-dependent guestbook moderation results and private lists. Public aggregate statistics retain their explicit public caching policy.
- Saturating the in-memory rate-limit map no longer clears existing active limits.

## Verified existing controls

Sessions use cryptographic random tokens, expiration checks and HttpOnly/Secure/SameSite=Lax cookies. Snippet updates/deletes and document/settings operations bind the authenticated user ID in parameterized SQL; client-supplied user IDs do not select another account. Public snippet reads require is_public=1. Account deletion cascades to sessions and snippets. Workspace revision conflicts cannot modify another user's records. OAuth callback verifies state before contacting GitHub.

Network tools use fixed upstream providers and validated/encoded hostnames, explicit consent headers and per-isolate limits. RDAP follows provider-directed referrals. No generic arbitrary-URL fetch endpoint was found. Public statistics expose aggregates; feedback inbox and usage summary require owner authorization.

## Reproducible checks

- npm run lint
- npm test (45 self-test groups; auth group additionally covers streamed bodies, origin checks, owner IDs, redirect controls and rate-limit saturation)
- npx opennextjs-cloudflare build
- npm run test:security (Next dev + local D1)
- SECURITY_WORKER=1 npm run test:security (built OpenNext Worker + local D1; PowerShell: $env:SECURITY_WORKER='1')

The security suite seeds synthetic users in a dedicated local D1 binding and checks unauthorized/expired sessions, administrator identity, cross-origin mutations, snippet privacy/type validation, account isolation, private cache headers, payload limits, OAuth failure cleanup, logout revocation and account deletion. The Worker variant is included in CI. The local Next development proxy now uses the same v3 persistence directory as the Wrangler CLI.

Validation result: lint and all 45 self-test groups passed; the expanded auth checks were rerun after the rate-limit change. The production OpenNext build passed, and all 7 integration scenarios passed against the local Worker. Initial dev-harness issues were corrected (Wrangler v3 database path and separating oversized-body connections from OAuth requests).

## Limits of this review

This is source review plus local integration coverage, not a guarantee of absence of vulnerabilities. Successful live GitHub OAuth exchange, production WAF configuration and distributed abuse resistance were not exercised. Rate limits remain per isolate, not a global quota; Turnstile remains optional when its secret is absent. CSP still permits inline scripts for the existing rendering architecture. Session tokens remain bearer tokens stored in D1; this review does not replace database access controls.
