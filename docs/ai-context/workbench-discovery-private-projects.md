# Workbench, landing demos and private projects

Local implementation, October 2026. No push, deployment, remote schema migration or OAuth client registration is part of this delivery.

## Discover and try
The catalog and its heading count the same internal tools. Search, activity and execution filters combine with favorites/recent views. Task shortcuts lead to music, pinouts, JSON and repository documentation.

The landing selects one of four demos after hydration. The selector never advances automatically. Only the active demo mounts; audio starts explicitly and closes when leaving it. Pinouts use the shared MAX98357A data and QPSK uses the simulator's Gray mapper/carrier. The original two-bar trap sketch combines drum steps and a compact editable piano roll using the composer's synth/drums. Continue passes the edited song through same-origin sessionStorage to the canonical /composer route, without embedding notes in the URL or sending them to a server.

## Google login
Set server-only GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and AUTH_BASE_URL. Register the exact callback https://openhios.dev/api/auth/google/callback in a Google OAuth web client. Configure the consent screen and testing/publishing status in Google Cloud. Never put secrets in NEXT_PUBLIC_* variables. The button appears only when all three settings exist.

Before releasing, back up D1 and apply pending migrations in order, including 0007 and 0008. Migration 0008 preserves internal account IDs and dependent records while making GitHub fields nullable. It snapshots dependent tables within the atomic migration because SQLite DROP TABLE runs cascading foreign keys. It was exercised with existing sessions, snippets, settings, workspaces and feedback, including deletion cascades after migration. Do not run raw schema migrations repeatedly against a seeded database; use Wrangler's migration ledger.

OIDC code flow requests openid profile, with PKCE S256, state cookie, nonce, short-lived one-use D1 transaction and jose RS256/JWKS validation (issuer, audience, authorized party, expiration and issuance). Tokens are exchanged only after user navigation to Google and are never stored. No email, Gmail or Drive scopes; no remote avatar rendering. Existing users sign in with GitHub, then explicitly link Google from their account menu. Linking is bound to that still-valid session; a Google identity already used by another account is rejected. No email-based account merging. Owner access remains bound to the verified GitHub ID.

Missing credentials: local integration and cryptographic tests are complete, but real Google account authorization requires a registered client. This is not a claim of a live successful Google sign-in.

Reference: https://developers.google.com/identity/openid-connect/openid-connect

## Read-only repositories
The first version connects directly from the browser to GitHub.com or GitLab.com, using a token entered by the user for that session. It does not reuse the login token. A notice names destination and data before connecting. The app sends GET requests only, never follows redirects, uses no ambient cookies and never stores tokens or repository contents in browser storage or on the HIOS server. Disconnect clears the in-memory connection, drafts and requests; closing the page also discards them.

Use a GitHub fine-grained token restricted to selected repositories with Contents: read-only. GitLab project tokens with read_api and Reporter are restricted to the project; GitLab.com requires Premium/Ultimate for project access tokens. The application cannot prove that a pasted token has no extra permissions: users must scope it at the provider. The code uses no write endpoint.

Browse folders, read UTF-8 files, edit local copies, preview safe Markdown and download changes. Drafts survive file switching in the current reader session. Raw HTML, linked images and interactive external links are not executed/fetched. Limits: roughly 1 MB per file, 1000 entries per GitHub directory (explicit truncation notice), paginated GitLab directories. Binary files, wikis outside repository files, GitLab self-managed and persistent connections are out of scope for this first reader.

References:
- https://docs.github.com/en/rest/repos/contents
- https://docs.gitlab.com/user/project/settings/project_access_tokens/

## Next useful additions
Prioritize a local documentation workspace (Markdown links, offline full-text search and local folders), secret redaction before sharing, and project BOM/pinout comparison. They reuse existing tools and keep private files on device. A GitHub App with selected repositories and Contents read-only would remove manual token entry; GitLab OAuth needs a separately scoped connector. Neither should inherit permissions merely because someone signed in.

Reference for selected repositories and scoped app permissions: https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps

## Verification
- Next/OpenNext production build, TypeScript and ESLint passed.
- Four-locale message parity passed.
- Google cryptographic, state replay, linking conflict and migration data-preservation self-tests passed.
- Repository URL/host/method/size boundaries and demo round trips passed.
- 14 Worker + D1 security tests passed, including Google cross-account callback rejection.
- 20 browser tests passed across desktop, mobile 360/390 and tablet 768: catalog, demos, audio cleanup, composer handoff, provider UI, repository mocks, consent/cache regression and external-request controls.
- GitHub/GitLab reader tests use synthetic credentials and mocked provider responses. Real private repositories and live Google authorization have not been accessed.
