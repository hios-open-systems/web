# Deploy — openhios.dev (Cloudflare Workers + OpenNext)

La app se sirve como **Cloudflare Worker** vía el adaptador `@opennextjs/cloudflare`
(reemplaza al viejo modelo Pages / `next-on-pages`).

**Deploy manual.** Ni un push ni un merge a `main` publican nada. Producción se
actualiza solo cuando alguien corre el workflow a mano:

> GitHub → **Actions** → **CI** → **Run workflow** → branch `main` → **Run workflow**.

Ese run valida todo y publica **solo si todas las validaciones pasan**.
Workers Builds (el auto-deploy de Cloudflare) está desactivado desde el 2026-10-24
y tiene que seguir así: si se reactiva, habría dos caminos de deploy.

- Worker: `hios-platform` (ver `wrangler.jsonc`).
- Dominio: `openhios.dev`.
- D1: `hios-playground`, binding `DB` — **compartida, no borrar**.

## Configuración (una sola vez)

En GitHub → Settings → Secrets and variables → **Actions**:

1. Secret `CLOUDFLARE_API_TOKEN`: token de Cloudflare limitado a la cuenta de
   openhios.dev, con permiso de edición de Workers Scripts (y los bindings que usa
   el Worker). Nunca en git ni en logs.
2. Variable `CLOUDFLARE_ACCOUNT_ID`: la cuenta que sirve openhios.dev.
3. Variable `NEXT_PUBLIC_TURNSTILE_SITEKEY`: la site key real (la exige el chequeo
   de release).

Sin el token o la cuenta, el run manual falla en "Verify production deployment
prerequisites", antes de tocar producción.

## Qué hace un run manual

1. Lint y todos los self-tests descubiertos.
2. Build OpenNext del Worker y validaciones SEO, sitemap, contenido, privacidad,
   instrumentos, electrónica, traducciones, pinouts y móvil con Playwright.
3. Verificación de credenciales, configuración externa y que el SHA probado siga
   siendo la punta de `main`. Un run viejo falla antes de publicar.
4. `opennextjs-cloudflare deploy`, usando **el mismo output ya probado**, sin rebuild.
5. Comprobación de `/api/version` contra el SHA y respuesta HTML correcta de veinte
   rutas de calculadoras, QPSK y guías PAD/BTDAC/Speaker en los cuatro idiomas.

Los pushes y PR corren las mismas pruebas pero nunca los pasos con credenciales.
Los runs sobre `main` se serializan para no interrumpir un upload; los runs de PR
obsoletos sí se cancelan. Los diagnósticos de Playwright se conservan siete días
cuando falla una prueba.

Los tests de navegador previos al deploy usan `next start`; el build comprueba el
empaquetado Worker y el smoke posterior comprueba el runtime publicado. Ese smoke
no reemplaza una prueba funcional completa de producción. Si falla después del
upload, el workflow falla pero **no revierte automáticamente** el despliegue.

Alternativa local (con login de Wrangler): `npm run deploy` desde `main` actualizado.

## Recuperación y previews

Si falla antes de publicar, producción conserva su versión anterior. Corregir,
mergear y volver a correr el workflow a mano sobre main.
Para una regresión publicada, revertir el commit y pasar nuevamente por CI.
Un rollback urgente desde Cloudflare debe ser una operación deliberada y luego
reflejarse en git. No reactivar Workers Builds para resolver un fallo de CI.

Los branches/PR no publican previews automáticamente con este flujo. Cualquier
preview futuro deberá usar un Worker separado y bindings ajenos a producción.

El secret runtime `GITHUB_CLIENT_SECRET` permanece en Cloudflare. No confundirlo
con el token de Actions. El dominio y D1 se conservan; no hace falta un cutover ni
migraciones para este cambio de pipeline.

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
