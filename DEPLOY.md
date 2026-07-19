# Deploy — openhios.dev (Cloudflare Workers + OpenNext)

La app se sirve como **Cloudflare Worker** vía el adaptador `@opennextjs/cloudflare`
(reemplaza al viejo modelo Pages / `next-on-pages`).

El deploy es **push-to-deploy con Workers Builds**: NO se corre `wrangler deploy` ni
`wrangler login` desde tu máquina. Cloudflare buildea y publica en su nube en cada push.

- Worker: `hios-platform` (ver `wrangler.jsonc`)
- Dominio: `openhios.dev`
- Base de datos: D1 `hios-playground` (binding `DB`) — **compartida, no borrar**

---

## Setup inicial (una sola vez, en el dashboard)

### 1. Conectar el repo a Workers Builds
Dashboard → **Compute (Workers)** → **Create** → **Import a repository** →
autorizar la GitHub App de Cloudflare para `hios-open-systems/web` → elegir el repo.

Configurar el build:
- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`
- **Production branch:** `main` (los demás branches generan preview deployments)

### 2. Secret del Worker
Las vars públicas (`GITHUB_CLIENT_ID`, `AUTH_BASE_URL`) ya están en `wrangler.jsonc`.
El secreto va aparte, en el dashboard (no en git):

Worker `hios-platform` → **Settings → Variables and Secrets** → Add → Secret:
- `GITHUB_CLIENT_SECRET = <valor>`

(La callback del GitHub OAuth app apunta a `openhios.dev`, que no cambia — no hay que
tocar la app de GitHub.)

### 3. Cutover del dominio (Pages → Worker) — ORDEN IMPORTA
El dominio solo lo puede servir una cosa a la vez. Secuencia segura:

1. Dejá que Workers Builds haga el primer deploy → probá en `hios-platform.<sub>.workers.dev`.
2. Cuando esté OK: en el **proyecto Pages viejo** → Custom domains → **quitar** `openhios.dev`.
3. En el **Worker** → Settings → Domains & Routes → **Add Custom Domain** → `openhios.dev`.
4. Verificá que `openhios.dev` sirva el Worker (el `NEXT_PUBLIC_DEPLOY_VERSION` en el
   footer/VersionWatcher debe coincidir con el commit deployado).
5. Recién ahí: borrá el proyecto Pages viejo. **NO toques la base D1** — es la misma.

---

## Deploy normal (día a día)
`git push` a `main` → Workers Builds buildea y publica. Nada más.

## Preview de un branch
`git push` de cualquier branch → Workers Builds genera un preview deployment con URL propia.

---

## Migraciones D1
Las migraciones **no** corren solas en el deploy; son un paso aparte, solo cuando cambia
el esquema (`migrations/*.sql`). La base es la misma que ya estaba en prod, así que el
cutover no requiere migrar nada.

- **Local** (para `npm run preview`, sin login):
  ```bash
  npm run db:migrate:local
  ```
- **Remoto** (prod) — sin OAuth, con un API token de scope D1 (Dashboard → Profile →
  API Tokens → Create → permiso Account · D1 · Edit):
  ```bash
  CLOUDFLARE_API_TOKEN=<token> npm run db:migrate
  ```

---

## Desarrollo local (offline, sin login)
- `npm run dev` — Next dev server, HMR. **No** expone el binding D1 (ver nota en `lib/db.ts`):
  las rutas que tocan la DB tiran error a propósito.
- `npm run preview` — corre el Worker buildeado en workerd con **D1 local** real. Usalo
  cuando trabajás features de base de datos. Todo offline, sin autenticarte.
