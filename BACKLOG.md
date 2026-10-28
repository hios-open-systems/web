# Pendientes verificados

Revisión de código y documentación: 27 de octubre de 2026. Se distinguen
limitaciones comprobadas, verificaciones externas e ideas opcionales; no todas
las ideas son compromisos de implementación.

## Mejoras concretas

| Tema | Evidencia actual | Siguiente paso |
| --- | --- | --- |
| Payload: tabla de documentos grandes | `lib/workbench/payload.worker.ts` limita el preview a 100.000 caracteres; `components/workbench/PayloadTable.tsx` parsea el texto recibido. | Paginar desde datos completos del worker y probar arrays que excedan el preview. |
| Imágenes al compartir | Las páginas de proyecto y artículo llaman a `createPageMetadata()` sin imagen propia. | Usar portada del recurso con fallback local. |
| Datos estructurados | `lib/structured-data.ts` no incluye autor/imagen del artículo; el proyecto usa `WebPage`. | Completar campos disponibles y elegir el tipo según el recurso, sin inventar datos. |
| Cobertura de recorridos | Hay suites de borradores, espacios, temas y compositor fuera de la selección del workflow. | Incluir recorridos críticos en la validación local de release. Tener un test no certifica su última ejecución. |
| Harness autenticado antiguo | `playwright.cloudflare.config.ts` apunta a Pages y puerto 3201; `tests/workspaces.auth.spec.ts` fija localhost:3202. | Adaptar el harness a Workers y alinear origen, fixtures y puertos antes de certificar esos recorridos. |
| Peso de traducciones | `app/[locale]/layout.tsx` entrega los mensajes al proveedor cliente. | Medir transferencia y navegación antes de separar mensajes por ruta. Las cifras del informe anterior no son una medición actual. |

## Verificaciones que requieren entorno real

- **Google OAuth:** código y migración implementados. Esta revisión no tiene evidencia
  de consentimiento real completado; seguir la [guía local](docs/ai-context/workbench-discovery-private-projects.md).
- **Seguridad operativa:** comprobar captcha y login/logout reales, retención efectiva
  y configuración del proveedor al preparar un release. Los informes históricos no
  certifican el estado actual de dashboards o secretos.
- **Espacios autenticados:** comprobar dos sesiones, cambios de cuenta y recuperación
  offline con D1 local. El checkpoint viejo reportaba una ejecución fallida; esta
  revisión documental no vuelve a ejecutar esa suite.
- **Búsqueda y costos:** Search Console, facturación y rendimiento necesitan datos
  de las cuentas correspondientes. Su configuración no se deduce del repositorio.
- **Hardware:** los checklists de montaje, pruebas físicas y límites de firmware
  permanecen en `projects/`; una página web no certifica la validación física.

## Ideas opcionales, sin compromiso de implementación

- Documentación local: carpetas, enlaces Markdown relativos y búsqueda offline.
- Detección y redacción local de secretos antes de exportar contenido.
- Comparación de BOM/pinouts y GitHub App de solo lectura para el lector.
- Self-host con SQLite propio: `lib/db.ts` sigue dependiendo del binding D1.
- Roles adicionales, logs automáticos de servidor y tutoriales con API interactiva
  si aparece una necesidad concreta. Ya existen control de dueño y feedback explícito;
  no equivalen a un sistema general de roles y logs.
- Cobertura directa del aviso de nueva versión y ajuste del polling si hay un problema.
  El aviso ya existe en `components/common/VersionWatcher.tsx`.

## Retirado del backlog por estar implementado

Snippets privados/públicos en D1 e importación explícita; sync básico de temas;
feedback local con fingerprint y contador; sitemap, canonical/hreflang y JSON-LD
básico; espacios y presets; borradores; descubrimiento y demos; métricas agregadas
y caché pública; esquema OAuth multi-proveedor.

Los avisos antiguos de Next 14, vulnerabilidades de julio y tareas genéricas de
cleanup no son incidencias actuales reproducidas. Ver [CHANGELOG.md](CHANGELOG.md).
