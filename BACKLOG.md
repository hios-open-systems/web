# BACKLOG.md — Ideas pendientes

Una sección por idea. Llenala al menos hasta `Sketch` antes de empezarla — si no podés esbozar cómo construirla en 5 líneas, no la entendés todavía.

**Status**:
- `next` — la próxima vez que pidamos slice, esta es candidata.
- `parked` — buena idea pero no urgente, esperar disparador.
- `blocked` — depende de algo externo (plataforma, decisión, otra feature).
- `discarded` — probada, no convenció. Dejamos por qué.

---

## Auto-reload al detectar nueva versión deployada
- **Why**: hoy los visitantes que dejan la pestaña abierta siguen con un bundle viejo después de un deploy. Si entre tanto cambiamos un API contract o arreglamos un bug visible, no se enteran hasta que recargan a mano.
- **Sketch**:
  1. En build, Cloudflare Pages expone `CF_PAGES_COMMIT_SHA`. Lo embebimos en un archivo estático `/version.json` (escrito por el build script) o como `NEXT_PUBLIC_BUILD_ID` en el bundle.
  2. Cliente arranca un polling cada ~5 min a `/version.json`. Compara contra el id con el que cargó.
  3. Si difiere → toast persistente "Hay una nueva versión disponible" con botón "Recargar" → `window.location.reload()`. Cierre opcional con "Más tarde".
  4. Reutilizamos el FeedbackProvider / antd `message` que ya está montado, o agregamos un pequeño VersionWatcher en el ThemeLayout.
- **Dependencies**: ninguna real. Self-contained.
- **Status**: parked. Sumamos cuando notemos el problema en práctica.

---

## Snippets a D1 con públicos / privados
- **Why**: hoy los snippets viven solo en localStorage; si cambiás de máquina los perdés. Los usuarios logueados pueden tener backup en la nube, opcionalmente públicos para compartir por URL.
- **Sketch**:
  1. Esquema ya en `migrations/0001_init.sql` (`snippets` con `user_id`, `is_public`).
  2. Rutas `/api/snippets` GET/POST/DELETE (autenticadas).
  3. Cliente: si hay sesión, lecturas/escrituras van a la API en paralelo con localStorage. Sin sesión, sigue local solo.
  4. Al loguearse primera vez, ofrecer subir los snippets locales a la cuenta.
  5. Ruta pública `/s/[id]` para snippets con `is_public = 1` — compartible por URL.
- **Dependencies**: auth funcionando en plataforma (D1 binding + OAuth env vars en Cloudflare Pages). Código de auth ya está.
- **Status**: blocked en setup de plataforma.

---

## Themes per-user (sync a DB)
- **Why**: hoy el theme vive en localStorage; si cambiás de dispositivo no te sigue.
- **Sketch**:
  1. Tabla `user_settings` (user_id, key, value) o columnas en `users` (theme_accent).
  2. `GET /api/user/settings` y `PATCH /api/user/settings`.
  3. ThemeContext: al loguearse, sync up del local; en cambios siguientes, escribe en ambos lados.
- **Dependencies**: auth + un cambio chiquito de schema.
- **Status**: blocked.

---

## Self-host con DB propia
- **Why**: opción para usuarios que prefieren no subir nada a la nube — clonan el repo, levantan local, todo queda en su máquina.
- **Sketch**: doc en repo con `docker-compose` que arme Next + sqlite local + el mismo schema. Toggle por env var para usar sqlite-file en vez de D1. Adapter pattern delgado en `lib/db.ts`.
- **Dependencies**: pensar bien el adapter pattern. No es trivial — Next-on-Pages asume binding D1.
- **Status**: parked. Esperar a que aparezca demanda real.

---

## Users / roles / permisos
- **Why**: si abrimos auth pública en `openhios.dev`, va a haber usuarios random. Roles para distinguir owner / colaborador / visitante registrado / admin.
- **Sketch**: columna `role` en `users` (`user` | `admin`). Middleware que lee role en cada request. Página `/admin` que sólo permite admin (vos por github_id).
- **Dependencies**: auth + decisión sobre qué roles y qué pueden hacer cada uno.
- **Status**: parked. Por ahora vos sos el único usuario, no hace falta.

---

## Logging + admin de logs
- **Why**: hoy los errores se capturan en feedback inbox del usuario que los sufrió. No los vemos del lado del servidor.
- **Sketch**: tabla `events` (level, message, meta, user_id, created_at). API `/api/events` que recibe del cliente (rate-limited). Página `/admin/logs` con filtros por nivel, usuario, rango de fechas.
- **Dependencies**: auth + roles (sólo admin ve logs).
- **Status**: parked.

---

## Tutoriales con API + Swagger interactivo
- **Why**: idea original de mundo bl — tutoriales que son explicación + endpoints en vivo que el lector ejecuta desde la página.
- **Sketch**: TBD. Decidir en su momento si MDX con bloques live o OpenAPI embebido con RapiDoc/Stoplight.
- **Dependencies**: ninguna técnica fuerte, pero pide tiempo de diseño.
- **Status**: parked.

---

## SEO pass
- **Why**: cuando haya contenido real, conviene que indexe.
- **Sketch**: sitemap dinámico generado en build, OG tags por ruta, structured data en project pages, robots.txt.
- **Dependencies**: hacerlo al final, cuando el contenido ya esté.
- **Status**: parked.
