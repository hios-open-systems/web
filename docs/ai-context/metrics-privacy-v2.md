# Métricas de uso y privacidad, versión 2

Implementación local del 24 de octubre de 2026. La migración y la configuración del Worker deben publicarse juntas en el próximo release autorizado; este trabajo no cambia producción.

## Qué se mide

La participación continúa siendo voluntaria. La nueva clave `hios-telemetry-v2` exige volver a activar el consentimiento: el permiso anterior solo describía visitas y aperturas. Do Not Track y Global Privacy Control lo anulan en cliente y servidor. El cliente de desarrollo no envía eventos.

| Evento | Significado y límite |
|---|---|
| `page_view` | Navegación a una página admitida. Volver a una página o recargar puede sumar otra vista. |
| `tool_open` | Apertura de una herramienta del catálogo; no acredita uso exitoso. |
| `search_select` | Selección de un resultado con consulta activa. Nunca contiene la consulta. |
| `preset_open` | Inicio de apertura de un preset; no acredita aplicación. |
| `workspace_open` | Apertura de un espacio; no contiene su ID ni nombre. |
| `handoff_complete` | Transferencia leída y entregada al receptor de la herramienta. No certifica que todos los parámetros fueran válidos ni una tarea completada. |
| `export_generated` | Archivo preparado y descarga iniciada mediante `downloadBlob`. No confirma guardado en disco, ni cubre herramientas que exportan por otro mecanismo. |

No existe una métrica de personas o usuarios únicos. Las métricas anteriores basadas en `COUNT(DISTINCT user_id)` se eliminaron. El tráfico del dueño sigue siendo parte de la muestra si activa voluntariamente la medición en su navegador; puede dejarla desactivada. No se consulta la sesión para clasificarlo.

## Datos y retención

El cliente envía exclusivamente versión, un UUID aleatorio por evento, tipo de evento, categoría de página o herramienta e idioma. Usa `fetch` con `credentials: omit` y `referrerPolicy: no-referrer`. No usa Beacon, que incluiría las cookies. No persiste un identificador de visitante. La preferencia de consentimiento es local al navegador.

Las rutas dinámicas se reducen antes del envío a familias como `/projects/:project`, `/blog/:article` y `/workbench/spaces`. Configuración, feedback, administración y el panel privado de analítica no generan vistas. La API admite un esquema cerrado, idiomas conocidos y herramientas del catálogo. Rechaza campos adicionales, rutas arbitrarias, parámetros y herramientas inconsistentes con el tipo de evento.

`usage_daily` guarda únicamente día UTC, evento, categoría, idioma, herramienta, versión de medición y contador. Conserva los últimos 90 días UTC, incluido el actual. `usage_receipts` guarda solo UUID de evento y día UTC: conserva el día actual y anterior. La limpieza diaria y la ingesta eliminan los vencidos; una repetición del mismo UUID dentro de esta ventana no incrementa dos veces, incluso en peticiones concurrentes, porque contador y recibo se escriben en un batch transaccional D1.

La tarea `scheduled` en `worker.js`, configurada a las 00:00 UTC, elimina vencidos incluso sin tráfico. Los triggers de ingesta permiten recuperarse si Cron se retrasa. Se debe monitorizar el éxito de Cron en Workers; la ventana de eliminación puede prolongarse si falla la infraestructura. No se almacenan cuenta, sesión, IP, navegador, país, referencia, Cloudflare Ray, contenido, nombre de archivo ni timestamp preciso del evento en estas tablas. Cloudflare sigue procesando solicitudes, aplicando límites operativos y gestionando sus logs/backups con políticas independientes. La migración no borra retrospectivamente backups del proveedor.

## Datos anteriores

`0007_usage_aggregates.sql` agrega los últimos 90 días de `usage_events` y elimina la tabla granular. Conserva conteos, idiomas conocidos y herramientas reconocidas; colapsa todas las rutas anteriores a `/legacy`. Marca los agregados como versión 1, sin atribuirles deduplicación, filtros de bots o consentimiento nuevo. Los paneles muestran cuántos eventos proceden de esa versión. No se importan solicitudes de Cloudflare en estos contadores.

Los clientes antiguos reciben 400 al enviar el protocolo anterior; no se intenta ampliar ni inferir su consentimiento. Una pestaña antigua podrá seguir usando herramientas, pero necesitará recargar y activar la preferencia nueva para compartir acciones.

## Bots e integridad

Se respetan señales de privacidad, se limita la ingesta a 60 solicitudes/minuto/IP y se filtran agentes reconocibles de bots, rastreadores y navegadores headless. La IP se usa solo en el limitador operativo, no en las tablas de analítica. El origen se verifica, pero esto no demuestra humanidad.

Si el contexto confiable de Cloudflare ofrece `botManagement`, se excluyen bots verificados y scores 1–29. Score 0 o ausencia de señal no se interpretan como actividad humana. No se confía en cabeceras de score enviadas por el cliente, ni se activan detecciones JavaScript/cookies nuevas. Los campos dependen del plan y pueden no existir. Hay falsos positivos y bots no detectados: las cifras no se presentan como audiencia humana certificada. [Clasificación oficial](https://developers.cloudflare.com/bots/concepts/bot-score/).

Los fallos de escritura devuelven 503 y producen únicamente el diagnóstico fijo `usage_aggregate_write_failed`, sin payload ni datos de solicitud. El cliente no reintenta automáticamente. El conteo no cubre eventos perdidos por navegación, bloqueadores, fallos de red o falta de consentimiento.

## Consultas y caché

El resumen público necesita dos SELECT paralelos por fallo de caché: agregados diarios y mensajes visibles del libro de visitas. Un acierto de Cache API evita D1. El panel privado usa una consulta de agregados. La ventana pública comprende 30 días UTC e incluye hoy incompleto; completa explícitamente los días sin eventos con cero.

Solo respuestas 200 de `/api/stats/public` sin `Set-Cookie` se almacenan durante una hora en Workers Cache API. La clave normaliza host/ruta, ignora consultas y cookies e incluye versión de esquema. La caché es local al centro de datos; no se promete una única consulta mundial por hora. El resumen incluye `generatedAt`. El navegador recibe `max-age=0`; la caché compartida, `s-maxage=3600`; se conserva `no-transform`.

La regla global de Next excluye exactamente esa ruta. Sus errores y todas las API privadas conservan `no-store`. No se modificó la política de caché de HTML ni se hizo público contenido autenticado. Un fallo de caché no impide servir un agregado válido; un fallo de base de datos no se convierte en ceros ficticios.

El público solo ve herramientas e idiomas con al menos cinco eventos en el período. Es un umbral de eventos, no de personas, y no constituye una garantía de k-anonimato. Los totales y series diarias incluyen también las categorías omitidas; no se deben sumar vistas, aperturas y exportaciones como si fueran visitantes distintos.

## Histórico agregado de Cloudflare

Es una fuente complementaria pendiente de acceso de lectura a la zona. El intento de lectura de la auditoría anterior fue rechazado. No se importaron datos ni se habilitó Web Analytics.

Cloudflare amplió varios datasets adaptativos a al menos 31 días de retención en Free/Pro y ventanas consultables de hasta 30 días. Esto no cambia el acceso a campos por plan: hay que consultar los settings reales del dataset y distinguir datos muestreados. [Retención](https://developers.cloudflare.com/changelog/post/2026-10-02-30-days-analytics-on-every-plan/), [Bot Analytics](https://developers.cloudflare.com/bots/bot-analytics/).

Un importador posterior deberá ser una acción explícita del administrador y conservar una serie separada con fecha, solicitudes, dataset, filtros, muestreo y clasificación de bots disponible. No importar IPs, huellas, cookies, URLs completas ni logs por persona. Filtrar HTML, assets, API, tráfico interno, bots verificados y automatizados según los campos autorizados; declarar los desconocidos. Las navegaciones cliente de Next y las tareas ejecutadas localmente no equivalen a solicitudes HTML. Datos vencidos o eventos de herramientas nunca recogidos no pueden reconstruirse. Etiqueta propuesta: “Tráfico estimado de Cloudflare con bots filtrados”, nunca “personas únicas” o “sin bots” garantizado.

## Verificación y release

- `npm run test:analytics`: migración desde datos personales ficticios, esquema mínimo, validación, duplicados, rollback, retención, fechas UTC, privacidad y consentimiento.
- `SECURITY_WORKER=1 npm run test:security`: D1 y Worker reales locales, idempotencia concurrente, permisos, cabeceras, caché entre cookies/queries, limpieza scheduled y recorrido navegador → ingesta → D1 → panel del dueño.
- `tests/analytics.spec.ts`: consentimiento nuevo, DNT/GPC, exportación local, ausencia de cookies/referencia/contenidos, días cero y errores no cacheables.
- Pruebas existentes de inputs locales, privacidad, visualización móvil, lint, tipos y build OpenNext.

Para el próximo release autorizado, aplicar la migración D1 y publicar este Worker en la misma ventana de mantenimiento, verificando después ingesta, estadísticas y Cron. La migración elimina los datos granulares: no volver al Worker anterior, que depende de `usage_events`. No ejecutar una migración remota ni un despliegue como parte de la verificación local. Revisar las políticas de backup del proveedor si se requiere un plazo de borrado que incluya copias históricas.
