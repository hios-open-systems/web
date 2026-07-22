# Hardening — estado y pendientes

_Última actualización: 2026-07-21._

## ✅ Live en producción
- **Headers**: CSP (enforcing) · Permissions-Policy · X-Frame-Options · nosniff · Referrer-Policy · **HSTS** (en código, portable)
- **Vulnerabilidades npm**: bajadas 21→5 con overrides (`prismjs`, `lodash-es`)
- **security.txt** (RFC 9116) en `/.well-known/`
- **Error 1102 (exceededCpu)**: edge rule anti-scanner (14,4% → 1,1% de fallas)
- **Cold-start / timeout en páginas pesadas**: `calculators`/`workbench` pasadas a SSG → cacheadas en el edge (adiós timeout/503)
- **CLS** de `/es/projects`: corregido (0,284 → ~0)
- **Turnstile**: código deployado pero **inactivo** hasta cargar las keys (feature-flagged)

## 🔧 Pendiente de CÓDIGO (lo hace Claude)
- [ ] **Sitekey de Turnstile**: cuando lo crees, pasámelo y lo pongo en el código (1 línea)
- [ ] _(opcional/cosmético)_ silenciar warnings `exhaustive-deps` en `useCalculatorState.tsx` (falsos positivos, no son bug)

## ⚠️ Vulns de npm — NUNCA `npm audit fix --force`
`npm audit fix --force` **downgradea Next 15 → 9.3.3** (rompe todo: App Router, React 19, OpenNext) y trae ~900 deps viejas → de 6 a 93 vulns. Recuperación: `git checkout package.json package-lock.json && npm ci`.
Las high residuales (`immutable`, `sharp`, `miniflare`, `wrangler`, un CVE de `next`) son advisories nuevos en deps de **build/dev**, riesgo real bajo, y sus fixes son majors breaking → **se aceptan** hasta que haya patch semver-ok. Solo usar `npm audit fix` (sin `--force`) y overrides de **patch** (ya hay: `prismjs`, `lodash-es`).

## 👤 Pendiente TUYO (dashboard / CLI — no es código)
### Activar Turnstile (opcional; el código ya está)
1. **Dashboard → Turnstile → Add widget**: dominios `openhios.dev`, `localhost`, `127.0.0.1`; mode **Managed**.
   _(Alternativa: agregá `Turnstile:Edit` al API token y lo creo yo por API.)_
2. Pasame el **sitekey** (público) → lo pongo en el código.
3. Cargá el **secret**: `printf '%s' 'TU_SECRET' | npx wrangler secret put TURNSTILE_SECRET_KEY`

### Toggles de Cloudflare (Security / SSL-TLS)
- [ ] **Rate limiting rule** para `/api` POST (expresión en el chat)
- [ ] **Bot Fight Mode**: ON
- [ ] **Always Use HTTPS**: ON
- [ ] **Min TLS 1.2**
- [x] Edge rule anti-scanner (ya la creaste)

## 🧳 Portabilidad (si migrás de Cloudflare)
| Portable (viaja con el repo) | CF-only (se reemplaza con el WAF del nuevo host) |
|---|---|
| CSP · Permissions-Policy · HSTS · vulns · security.txt · scanner→404 · Turnstile · SSG cache | edge rule · rate limit · Bot Fight Mode · Always-HTTPS |
