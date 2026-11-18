# Move OpenHios to personal accounts (2026-11-15)

Target Cloudflare account: `5f41ffae9202926d95a48448ea3965bd` (personal, Workers Paid).
Old account: `74517853847d3bfb25721012cf268858` (hios/devsolutions).
Target GitHub repo: `juanjparedez/web` (from `hios-open-systems/web`).

## Already done in the personal account

- D1 `hios-playground` created, id `7c113fd7-8cbf-4e33-a31d-bb10117e1e00` (empty; data comes from the old export).
- Zone `openhios.dev` added (pending). It turns active when the Registrar move lands.
- Turnstile widget for `openhios.dev`, site key `0x4AAAAAAGBfbG5Ah4d36fkE`. Its secret is already set on the worker.
- Placeholder worker `hios-platform` (503 page, workers.dev off) holding secrets
  `TURNSTILE_SECRET_KEY` and a new `ANALYTICS_SALT`. The first real deploy replaces the code and keeps the secrets.
- Rate-limit bindings need nothing: namespace ids are per account and are created on deploy.

## Simplified plan (Juanjo, 2026-11-15)

- Old D1 data is NOT migrated: prod was pre-PR #11 (no traffic tables), guestbook empty. The new D1 has all
  migrations 0001-0010 applied by Claude via the API (recorded in `d1_migrations`).
- GitHub OAuth secret is optional for now: the release check only warns. Without it GitHub login and /admin are off.
  To enable later: generate a client secret in the OAuth app and add `GITHUB_CLIENT_SECRET` to the worker.
- Done by Juanjo: repo transferred to `juanjparedez/web`; GitHub token + account id + site key set.

### Only step left for Juanjo

Old dashboard → Domain Registration → openhios.dev → Configuration: DNSSEC off, then move the domain to
account `5f41ffae9202926d95a48448ea3965bd` and approve the email. Then Claude merges and starts the deploy.

## After it is live

- Old account: delete the old worker, D1 and Turnstile widget; disconnect Cloudflare Git builds.
- Optional: transfer the GitHub OAuth app to the personal account.
