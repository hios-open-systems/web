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

Acceso de lectura verificado el 24 de octubre de 2026 en la cuenta indicada por el dueño: sesión de Chrome y OAuth local existente de Wrangler. La zona activa `openhios.dev` está en Free. El fallo D1 de la auditoría no impedía consultar Analytics; no se ampliaron permisos ni se cambiaron credenciales.

El dataset `httpRequestsAdaptiveGroups` declara 2.678.400 segundos de retención (31 días), ventanas de 30 días y hasta 10.000 grupos por consulta. Está disponible `verifiedBotCategory`; el plan no expone los campos de puntaje de bot. La clasificación ausente no se interpreta como humanidad. [Settings del dataset](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/), [muestreo](https://developers.cloudflare.com/analytics/graphql-api/sampling/).

`data/analytics/cloudflare-traffic.json` contiene una instantánea real y fechada, separada de `usage_daily`, sus API, su consentimiento y sus totales. Se incluye en el build de `/stats` y sigue disponible aunque falle la API de uso voluntario. No genera consultas nuevas a Cloudflare al visitar el sitio, ni instala Web Analytics, cookies o detección JavaScript. Estos agregados de infraestructura provienen de solicitudes que el proveedor ya procesa para servir la web; la preferencia voluntaria y DNT/GPC controlan nuestros eventos, no los registros operativos del proveedor. El panel de privacidad lo explica.

La importación solo consulta grupos de conteos y bytes, clasificados por categoría de bot verificado, tipo de respuesta y estado HTTP. Filtra `requestSource: eyeball` y host exacto `openhios.dev`, excluyendo subsolicitudes y operaciones internas de Cloudflare. Nunca solicita IPs, identificadores de sesión, usuarios, rutas, referers, agentes de usuario, contenido, visitas ni visitantes únicos. Después de agregar, descarta también las categorías y los estados: conserva únicamente las cifras diarias y la información de muestreo.

- Solicitudes y transferencia totales: incluyen bots, para dimensionar carga real.
- Solicitudes excluidas: cualquier categoría de bot verificado no vacía, incluidas categorías futuras. No se usa una lista incompleta de nombres.
- Solicitudes y transferencia restantes: categoría vacía; pueden contener automatización no detectada, pruebas y tráfico propio. No se denominan visitas humanas.
- HTML exitoso restante: categoría vacía, tipo `html`, HTTP 200–299. Excluye assets, redirecciones y errores; no equivale a vistas de página ni refleja toda la navegación cliente.

Los conteos adaptativos ya están ponderados; no se multiplican otra vez por `sampleInterval`. El resultado es una estimación, incluso si se presenta como entero. El primer y último día son parciales y sus límites exactos se guardan en UTC. El importador deja cinco minutos de margen respecto del límite móvil de retención. Un cero en una muestra no acredita ausencia absoluta de tráfico. Datos vencidos, acciones locales o eventos nunca registrados no pueden reconstruirse.

### Actualización explícita

Ejecutar `npm run analytics:import-cloudflare -- --wrangler` para reutilizar la credencial OAuth local existente, o definir `CLOUDFLARE_ANALYTICS_TOKEN` en el entorno y ejecutar `npm run analytics:import-cloudflare`. Para un token dedicado, usar permisos de lectura Analytics y Zone solo sobre openhios.dev. No copiar tokens al repositorio ni usar variables públicas del frontend.

El comando descubre la zona por nombre, verifica campos y límites, consulta los intervalos UTC en dos bloques de hasta 16 días y solo reemplaza el archivo local después de validar el resultado completo. Falla si faltan permisos/clasificación/muestreo, si se alcanza el límite de resultados, si hay errores GraphQL o si la serie está incompleta. No sustituye fallos por ceros y preserva la instantánea anterior. Si Cloudflare agota el presupuesto de consultas, esperar el intervalo indicado antes de reintentar; no hay bucles automáticos. No escribe D1 ni configuración remota y no publica nada.

La instantánea cubre la ventana retenida al importar; una nueva ejecución la reemplaza, sin acumular indefinidamente días en el sitio. Los commits conservan versiones históricas de estos agregados sin identificadores. Su período y fecha de importación se muestran siempre; no se presenta como contador en vivo. Para actualizar producción hace falta incluir la nueva instantánea en un release autorizado. Este trabajo no añade un proceso recurrente ni una credencial al Worker.

## Verificación y release

- `npm run test:cloudflare-traffic`: filtros por categoría, ponderación, HTML exitoso, datos mínimos, períodos UTC, límites y preservación ante importación fallida.
- `npm run test:analytics`: migración desde datos personales ficticios, esquema mínimo, validación, duplicados, rollback, retención, fechas UTC, privacidad y consentimiento.
- `SECURITY_WORKER=1 npm run test:security`: D1 y Worker reales locales, idempotencia concurrente, permisos, cabeceras, caché entre cookies/queries, limpieza scheduled y recorrido navegador → ingesta → D1 → panel del dueño.
- `tests/analytics.spec.ts`: consentimiento nuevo, DNT/GPC, exportación local, ausencia de cookies/referencia/contenidos, días cero, errores no cacheables e histórico independiente sin conexiones externas nuevas.
- `tests/landing-styles.spec.ts`: CSS de la portada y del osciloscopio tras navegación cliente y recarga con caché; incluido en CI. No reproduce por sí solo todos los casos de caché antigua entre despliegues.
- Pruebas existentes de inputs locales, privacidad, visualización móvil, lint, tipos y build OpenNext.

Para el próximo release autorizado, aplicar la migración D1 y publicar este Worker en la misma ventana de mantenimiento, verificando después ingesta, estadísticas y Cron. La migración elimina los datos granulares: no volver al Worker anterior, que depende de `usage_events`. No ejecutar una migración remota ni un despliegue como parte de la verificación local. Revisar las políticas de backup del proveedor si se requiere un plazo de borrado que incluya copias históricas.
