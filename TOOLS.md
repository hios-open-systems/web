# TOOLS.md — Manifest del workbench

Una fila por herramienta. Sirve como **spec previo** (antes de codear) y como **inventario** (en 3 meses no te acordás qué hacía cada cosa, esto sí). Si una tool no entra en 5 líneas, no la entendés todavía — pensala más.

**Reglas:**
- Una tool no se mergea sin su fila acá.
- Si cambiás comportamiento, actualizás la fila junto con el código.
- `Status` honesto: `works` / `wip` / `broken` / `archived`. Nada de "casi listo".

---

## Workbench tools

### Payload Lab `/workbench/payload`
- **Propósito**: formatear, validar y compartir payloads JSON sin salir del navegador.
- **Input**: JSON pegado en textarea.
- **Output**: vista pretty/minified, métricas (chars, líneas, nodos, profundidad), inspector de paths, link shareable por URL.
- **Casos borde**: JSON inválido → muestra error de parse sin romper la pantalla. JSON gigante (>1MB) → puede laggear, no se valida límite todavía.
- **Status**: works

### Type Checker `/workbench/type-checker`
- **Propósito**: validar si un payload JSON es asignable a un tipo raíz de TypeScript, en el browser.
- **Input**: definiciones de tipos TS, nombre del tipo raíz, JSON value.
- **Output**: ok/no coincide + lista de diagnósticos por línea.
- **Casos borde**: tipos circulares, generics complejos no soportados (es un type-check liviano, no `tsc` completo).
- **Status**: works

### JWT Decode `/workbench/jwt-decode`
- **Propósito**: inspeccionar header y payload de JWTs en local, sin mandar el token afuera.
- **Input**: JWT en cualquier formato `header.payload.signature`.
- **Output**: header parseado, payload parseado, alg, type, expiración, largo de firma.
- **Casos borde**: token sin signature segment se acepta (header.payload). Base64 inválido → estado invalid con error.
- **Status**: works

### DNS Inspector `/workbench/dns-lookup`
- **Propósito**: consultar registros DNS en vivo (A, AAAA, CNAME, MX, TXT, NS).
- **Input**: dominio + tipo de registro.
- **Output**: respuestas DNS con prioridad, TTL, fetchedAt, duración.
- **Casos borde**: dominios inexistentes devuelven sin registros, no error. Resuelve vía `/api/workbench/dns` (Cloudflare DoH).
- **Status**: works

### Certificate Expiry `/workbench/certificate-check`
- **Propósito**: inspeccionar certificado TLS de un servidor, ver issuer y días de validez restantes.
- **Input**: hostname + puerto (default 443).
- **Output**: validFrom, validTo, daysRemaining, issuer, subject, SANs, fingerprint, serial.
- **Casos borde**: host no resuelve / puerto cerrado → falla con mensaje claro. Cert self-signed se muestra igual.
- **Status**: works

### Object to Types `/workbench/object-to-types`
- **Propósito**: generar interfaces y aliases TypeScript desde un objeto JSON real.
- **Input**: JSON object + nombre raíz.
- **Output**: bloque de tipos TS generado.
- **Casos borde**: arrays heterogéneos colapsan al union; null se separa explícito.
- **Status**: works

### Random String Generator `/workbench/random-string`
- **Propósito**: generar strings útiles para IDs, secrets, demos o fixtures.
- **Input**: largo, charsets (upper/lower/num/sym), excluir ambiguos.
- **Output**: 4 valores generados + entropía estimada.
- **Casos borde**: ningún charset elegido → mensaje "elegí al menos uno", no genera.
- **Status**: works

### Object Comparator `/workbench/object-compare`
- **Propósito**: comparar dos JSONs y detectar agregados, removidos y cambiados.
- **Input**: dos JSON pegados en lados izquierdo/derecho.
- **Output**: listado de diferencias estructurales con paths.
- **Casos borde**: arrays comparan por índice (no por contenido). JSON inválido en algún lado → marca cuál.
- **Status**: works

### Site Checker `/workbench/site-checker`
- **Propósito**: monitor de URLs cliente, corre en la pestaña del browser, opcionalmente notifica al escritorio.
- **Input**: URL, intervalo, timeout, toggle de notificaciones.
- **Output**: estado healthy/down/checking + historial de checks.
- **Casos borde**: CORS bloquea inspección profunda en sitios cross-origin (se muestra reachable pero opaque). El monitoreo se pausa cuando cerrás la tab — no es un cron de servidor.
- **Status**: works

### Snippets Shelf `/workbench/snippets`
- **Propósito**: guardar notas cortas, recetas y fragmentos de uso frecuente.
- **Input**: título + tags + body.
- **Output**: lista de snippets guardados, copia al portapapeles, eliminar.
- **Casos borde**: localStorage en este navegador, máximo 8 snippets (FIFO, los nuevos pushean afuera los viejos). **No hay backup a la nube todavía** — pendiente Fase 2 (snippets a DB con privados).
- **Status**: works

### Embedded Bridge `/calculators` (externa)
- **Propósito**: link a las calculadoras embebidas legacy desde el workbench. No es una tool nueva.
- **Status**: works

---

## Sistema (no-tool pero igual cuenta)

### Feedback inbox `/workbench/feedback`
- **Propósito**: capturar automáticamente errores runtime de la app y permitir al usuario sumar entradas manuales (bug, idea, nota). Inbox personal para no perder cosas mientras usás el playground.
- **Input automático**: `window.error` + `unhandledrejection` → entry tipo `error` con mensaje, stack, url y user-agent.
- **Input manual**: form con kind (bug/idea/note) + título + body.
- **Output**: lista en `/workbench/feedback`, con copy-to-clipboard (formato texto plano), borrar individual y borrar todo. Toast antd cuando se captura un error nuevo. Dot rojo en el icono de campana del header si hay entradas no leídas.
- **Storage**: `localStorage` bajo `hios-feedback-entries`, versionado, circular buffer de 50 entradas. Cross-tab via `storage` event.
- **Casos borde**: localStorage lleno → fail silencioso. JSON corrupto al leer → se devuelve lista vacía sin reventar. Stack ausente (rejection con string) → entry sin stack, igual visible.
- **Status**: works. Sync a DB pendiente para Fase 2 de auth.

### Theme settings `/workbench/settings`
- **Propósito**: customizar el accent del workbench (color de marca). El modo light/dark sigue en el toggle del header.
- **Input**: pick de un preset (Amber, Cyan, Violet, Lime, Rose) o hex custom (#rrggbb / #rgb).
- **Output**: CSS variable `--accent` aplicada en runtime a todos los componentes (header underline, hero kicker, badges, links de marca, avatar fallback). Persistido en `localStorage` bajo `hios-theme-config` (versionado).
- **Casos borde**: hex inválido → se marca el input, no se aplica. Cuando el accent matchea un preset, ese preset queda marcado como seleccionado. `Reset` vuelve al amber default.
- **Status**: works. Pendiente sync a DB cuando arme la capa de auth (Fase 2 de la auth).



### Auth (GitHub OAuth + sessions)
- **Propósito**: opcional. Login con GitHub para habilitar features con backup en la nube (snippets privados, themes per-user, etc).
- **Flujo**: `/api/auth/github/start` → GitHub authorize → `/api/auth/github/callback` → cookie de sesión opaca → DB lookup en cada request.
- **Storage**: Cloudflare D1, tablas `users` y `sessions`.
- **Casos borde**: sin env vars `GITHUB_CLIENT_*` configuradas el flujo falla con `auth_error=callback_failed`. `/api/auth/me` siempre devuelve `{user:null}` aunque la DB no esté disponible (no rompe la home).
- **Status**: works (depende de configurar D1 + OAuth app + env vars en Cloudflare Pages)

### i18n
- **Propósito**: locales `en` y `es` mantenidos, `de` y `it` con fallback profundo a `en`.
- **Casos borde**: keys faltantes en de/it caen a en automáticamente (ver `i18n/request.ts`).
- **Status**: works (en/es completos, de/it parciales)
