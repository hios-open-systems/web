# Server-side traffic stats (2026-10-31)

Replaces the manual Cloudflare snapshot. Nothing to run by hand.

## How it works

`worker.js` wraps the OpenNext handler. After each response it calls
`recordTraffic()` inside `ctx.waitUntil`, so the visitor never waits for D1.
Static files served by the `ASSETS` binding never reach the Worker; `_next/*`
and files with an extension that do reach it are skipped unless they fail.

| Table | What | Retention |
|---|---|---|
| `traffic_pages` | page views per day × path × locale × country × referrer | 400 days |
| `traffic_visitors` | daily-rotating HMAC(day, ip, ua) → unique visitors per day | 400 days |
| `traffic_requests` | requests per day × kind (page/nav/api/asset/other) × status class × bot | 400 days |
| `traffic_clients` | per client: HMAC(ip), /24 or /48 prefix, ASN, provider, country, UA, requests, errors, 404s, last path | 14 days |

A page view is a human, successful GET of an HTML page or a Next client
navigation (`RSC: 1`), never a prefetch. Bots are detected by UA plus
Cloudflare verified-bot fields when present.

Raw IPs are never stored. The HMAC key is the `ANALYTICS_SALT` Worker secret,
falling back to `GITHUB_CLIENT_SECRET`. Changing the secret resets client ids.

The schema lives in `lib/traffic/schema.ts` and `migrations/0009_traffic.sql`
(the self-test keeps them equal). The Worker also runs `CREATE TABLE IF NOT
EXISTS` once per isolate, so a deploy without `npm run db:migrate` still works.

Flood protection: a client over 120 requests/minute (per Cloudflare location)
stops being written until it slows down, so it cannot burn the D1 write quota.
D1 free tier is 100k rows written/day; a page view writes 4 rows, an API call 2.

## Where to read it

- Public: `/stats` → `/api/stats/public` (30 days, rows with < 2 hits hidden, edge-cached 1 h).
- Owner: `/admin` → `/api/admin/traffic?days=N` (full lists, request breakdown, heaviest clients).

## Blocking abuse

Find the client in `/admin` (many requests, many 404s, scanner paths like
`/wp-login.php`). Block in Cloudflare → Security → WAF → custom rule using the
IP prefix (`ip.src in {203.0.113.0/24}`), the ASN (`ip.geoip.asnum eq 12345`),
or the user agent.

## Admin access (passkey)

`/admin` and `/admin/traffic` need two things: the owner's GitHub session
(`isOwner`, GitHub id 37183343) and a passkey step-up (WebAuthn, so
fingerprint, face or device PIN). `GET /api/admin/traffic` enforces both on the
server (`requireAdmin` in `lib/admin/context.ts`); the UI gate is only UX.

- First passkey: only within 15 minutes of a fresh GitHub login, and only
  while no passkey exists. An old or stolen session cannot enroll.
- More passkeys (another device): only from an already verified admin session.
- The step-up cookie `hios_admin` (HttpOnly, Secure, SameSite=Strict) lasts 8 h
  and is bound to the GitHub session; logging out or "Bloquear admin" ends it.
- Lost every passkey: `npx wrangler d1 execute hios-playground --remote --command "DELETE FROM admin_passkeys"`,
  then log in again with GitHub and register a new one within 15 minutes.
