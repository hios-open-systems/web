# Deploy — openhios.dev (Cloudflare Workers + OpenNext)

La app se sirve como **Cloudflare Worker** vía el adaptador `@opennextjs/cloudflare`
(reemplaza al viejo modelo Pages / `next-on-pages`).

El flujo definido en `.github/workflows/ci.yml` publica desde GitHub Actions **solo
cuando pasan todas las validaciones**. Antes de activarlo hay que completar la
configuración externa indicada abajo; editar el YAML no desactiva Workers Builds.

- Worker: `hios-platform` (ver `wrangler.jsonc`).
- Dominio: `openhios.dev`.
- D1: `hios-playground`, binding `DB` — **compartida, no borrar**.

## Activación inicial (antes del primer push de este workflow)

1. En la cuenta de Cloudflare que sirve **openhios.dev**, abrir el Worker →
   Settings → Builds y desactivar los builds automáticos de producción y previews
   (o desconectar la integración Git). No modificar el Worker homónimo antiguo
   que solo tiene un dominio `workers.dev`.
2. Crear un API token de despliegue limitado a esa cuenta, con los permisos que
   requiere Wrangler para Workers Scripts y los bindings existentes. Guardarlo
   como secret de GitHub Actions `CLOUDFLARE_API_TOKEN`; nunca en git ni logs.
3. Configurar la variable de Actions `CLOUDFLARE_ACCOUNT_ID` con la cuenta verificada.
4. Solo después de comprobar que el auto-deploy anterior está desactivado, crear
   la variable `WORKERS_BUILDS_DISABLED=true`. Es una constancia administrativa;
   el workflow no puede consultar ni modificar Workers Builds con esa variable.
5. Subir `main`, seguir el workflow y comprobar la versión publicada.

Referencia: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/

## Deploy normal

`git push origin main` ejecuta, en orden:

1. Lint y todos los self-tests descubiertos.
2. Build OpenNext del Worker y validaciones SEO, sitemap, contenido, privacidad,
   instrumentos, electrónica, traducciones, pinouts y móvil con Playwright.
3. Verificación de credenciales, configuración externa y que el SHA probado siga
   siendo la punta de `main`. Un run viejo falla antes de publicar.
4. `opennextjs-cloudflare deploy`, usando **el mismo output ya probado**, sin rebuild.
5. Comprobación de `/api/version` contra el SHA y respuesta HTML correcta de veinte
   rutas de calculadoras, QPSK y guías PAD/BTDAC/Speaker en los cuatro idiomas.

Los PR ejecutan las pruebas pero nunca los pasos con credenciales de despliegue.
Un fallo en cualquier validación impide publicar. Los pushes a main se serializan
para no interrumpir un upload; los runs de PR obsoletos sí se cancelan.
Los diagnósticos de Playwright se conservan siete días cuando falla una prueba.

Los tests de navegador previos al deploy usan `next start`; el build comprueba el
empaquetado Worker y el smoke posterior comprueba el runtime publicado. Ese smoke
no reemplaza una prueba funcional completa de producción. Si falla después del
upload, el workflow falla pero **no revierte automáticamente** el despliegue.

## Recuperación y previews

Si falla antes de publicar, producción conserva su versión anterior. Corregir y
subir un nuevo commit, o reintentar el run solo si sigue siendo la punta de main.
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
