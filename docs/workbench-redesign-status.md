# Espacios y Payload: referencia de implementación

Revisado el 27 de octubre de 2026. Sustituye el checkpoint de una rama antigua.

Implementado: descubrimiento por actividad, espacios IndexedDB, accesos ordenados,
plantillas, transferencia JSON versionada, presets, consentimiento para contenido,
APIs D1 por cuenta y revisiones en conflicto. Payload usa un worker, árbol
virtualizado y transferencia de subconjuntos entre herramientas.

Los [borradores automáticos](ai-context/tool-state-audit.md) son locales y no
equivalen a presets sincronizados.

Pruebas existentes: `tests/workspaces.spec.ts`, `tests/workspaces.auth.spec.ts`,
`tests/mobile-workspaces.spec.ts`, `tests/workbench-catalog.spec.ts` y
`tests/tool-drafts.spec.ts`. Atención: `playwright.cloudflare.config.ts` todavía
arranca `wrangler pages dev .vercel/output/static`, y la suite de espacios fija
`localhost:3202` mientras esa configuración usa 3201. No es un comando vigente
para certificar espacios en Workers. `playwright.security.config.ts` sí tiene
un modo Worker para las pruebas de seguridad; no sustituye todos esos recorridos.

Las limitaciones de Payload y comprobaciones de sesiones están en
[BACKLOG.md](../BACKLOG.md). Esta actualización no certifica una nueva ejecución
de las suites de navegador.

La migración de espacios es `migrations/0006_workspaces.sql`. Aplicar únicamente
migraciones pendientes según el registro del entorno; no repetirlas a mano.
El procedimiento vigente está en [DEPLOY.md](../DEPLOY.md).
