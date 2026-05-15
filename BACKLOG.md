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
  2. Cerrar contrato primero: `GET/POST/PATCH/DELETE /api/snippets` + `POST /api/snippets/import` + lectura pública para `is_public = 1`.
  3. Sin sesión sigue local-only. Con sesión, D1 pasa a ser canónico y local queda como cache.
  4. Al loguearse primera vez, ofrecer import explícito de snippets locales a la cuenta. Nada de merge silencioso.
  5. Ruta pública `/s/[id]` para snippets con `is_public = 1`.
- **Dependencies**: auth ya está andando. Ver reglas de ownership y contrato en `PLATFORM_PLAYBOOK.md`.
- **Status**: next.

---

## Theme sync hardening
- **Why**: el sync base ya existe, pero todavía falta blindarlo con cobertura autenticada y una pasada de cleanup para no dejar patrones medio distintos respecto a snippets.
- **Sketch**:
  1. Agregar validación automatizada del flujo logueado con entorno controlado o fixture real de D1.
  2. Revisar si el primer import explícito del accent necesita copy o affordance más clara.
  3. Consolidar helpers compartidos de sync entre snippets y theme si se vuelven repetitivos.
- **Dependencies**: resolver la estrategia de runtime de tests autenticados con D1.
- **Status**: parked.

---

## Feedback inbox hardening (severidad + contexto + dedupe)
- **Why**: hoy captura errores reales, pero cada ocurrencia entra cruda. Falta clasificar mejor la señal y consolidar duplicados para que prod no se vuelva ruido.
- **Sketch**:
  1. Extender entry local con `source`, `severity`, `fingerprint`, `occurrences`, `lastSeenAt`, `buildId`, `locale`, `toolSlug`, `authState`.
  2. Dedupe local por fingerprint (`kind + title normalizado + first stack frame + pathname`).
  3. En UI mostrar contador de repeticiones y último momento visto.
  4. Mantenerlo local-first; evaluar uplink a servidor después, no antes.
- **Dependencies**: ninguna fuerte. Conviene hacerlo después de snippets para no abrir dos frentes de modelo local/sync a la vez.
- **Status**: next.

---

## Cleanup técnico post-snippets
- **Why**: auth, feedback, temas y el volantazo de UX entraron rápido. Después de snippets conviene consolidar nombres, contratos y bordes antes de seguir apilando features.
- **Sketch**:
  1. Revisar helpers duplicados de storage/sync y normalizar patrones.
  2. Limpiar TODOs, comentarios de contexto ya resuelto y ramas viejas.
  3. Verificar que `TOOLS.md`, smoke tests y docs de ownership queden alineados con el código final.
  4. Hacer una pasada corta de copy y estados vacíos/error/loading en las superficies tocadas.
- **Dependencies**: terminar snippets y el endurecimiento mínimo del feedback inbox.
- **Status**: parked.

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
