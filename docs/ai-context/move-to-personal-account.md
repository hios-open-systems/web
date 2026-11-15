# Move OpenHios to personal accounts (2026-11-15)

Target Cloudflare account: `5f41ffae9202926d95a48448ea3965bd` (personal, Workers Paid).
Old account: `74517853847d3bfb25721012cf268858` (hios/devsolutions).
Target GitHub repo: `juanjparedez/openhios` (from `hios-open-systems/web`).

## Already done in the personal account

- D1 `hios-playground` created, id `7c113fd7-8cbf-4e33-a31d-bb10117e1e00` (empty; data comes from the old export).
- Zone `openhios.dev` added (pending). It turns active when the Registrar move lands.
- Turnstile widget for `openhios.dev`, site key `0x4AAAAAAGBfbG5Ah4d36fkE`. Its secret is already set on the worker.
- Placeholder worker `hios-platform` (503 page, workers.dev off) holding secrets
  `TURNSTILE_SECRET_KEY` and a new `ANALYTICS_SALT`. The first real deploy replaces the code and keeps the secrets.
- Rate-limit bindings need nothing: namespace ids are per account and are created on deploy.

## Steps that need Juanjo, in order

1. Export the old DB (from the web folder, logged in to the OLD account, before pulling this PR):
   `npx wrangler d1 export hios-playground --remote --output hios-old.sql`
2. Old dashboard → openhios.dev → DNS → Records → Export. Save the file next to `hios-old.sql`.
3. Transfer the repo: GitHub → hios-open-systems/web → Settings → Transfer → `juanjparedez`.
4. Personal Cloudflare → My Profile → API Tokens → "Edit Cloudflare Workers" template (add D1 Edit). Then in the GitHub repo → Settings → Secrets and variables → Actions:
   - secret `CLOUDFLARE_API_TOKEN` = that token
   - variable `CLOUDFLARE_ACCOUNT_ID` = `5f41ffae9202926d95a48448ea3965bd`
   - variable `NEXT_PUBLIC_TURNSTILE_SITEKEY` = `0x4AAAAAAGBfbG5Ah4d36fkE`
5. Personal Cloudflare → Workers → hios-platform → Settings → Variables and Secrets: add `GITHUB_CLIENT_SECRET`
   (generate a new one in the GitHub OAuth app) and, if Google login is used, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Old dashboard → Domain Registration → openhios.dev → Configuration: DNSSEC off, then move the domain to account
   `5f41ffae9202926d95a48448ea3965bd`. Approve the email in the personal account. The site is down from here until step 7.
7. Claude imports the DB and DNS. Juanjo merges this PR and runs Actions → CI → Run workflow on main.

## After it is live

- Old account: delete the old worker, D1 and Turnstile widget; disconnect Cloudflare Git builds.
- Optional: transfer the GitHub OAuth app to the personal account.
