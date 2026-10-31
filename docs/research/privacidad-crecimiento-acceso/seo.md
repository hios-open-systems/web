# SEO y descubrimiento de HIOS

## ¿Está bien implementada la base técnica y qué llega a producción?

### Takeaway
La base técnica de SEO está bastante trabajada: canonical, alternativas de idioma, sitemap, contenido prerenderizado y datos estructurados ya existen. Las verificaciones realizadas el 24 de octubre de 2026 confirman esas piezas en una muestra de producción; esto no demuestra por sí mismo que Google haya indexado las páginas ni que generen tráfico.

### Cited Findings
- El sitemap de producción respondió HTTP 200 y contiene **364 URLs distintas**, sin duplicados y sin fechas `lastmod` inventadas. `robots.txt` respondió 200, permite `/`, bloquea `/api/` y apunta al sitemap correcto. — [Sitemap](https://openhios.dev/sitemap.xml), [robots.txt](https://openhios.dev/robots.txt). Inspección HTTP directa con Node `fetch`; el lector web no logró abrir esos dos recursos, pero eso fue una limitación del lector, no un fallo del sitio.
- Inicio EN/ES y la herramienta Ley de Ohm EN/ES respondieron HTTP 200 con un canonical autorreferente, cuatro alternativas de idioma (en, es, de, it) y `x-default` a EN, título/descripción localizados y `index, follow`. — [Inicio ES](https://openhios.dev/es), [Inicio EN](https://openhios.dev/en), [Ley de Ohm ES](https://openhios.dev/es/workbench/ohms-law), [Ohm EN](https://openhios.dev/en/workbench/ohms-law). El generador compartido está en [lib/seo.ts](C:/Users/juanparedez/Desktop/code/web/lib/seo.ts:10) y [lib/seo-sitemap.ts](C:/Users/juanparedez/Desktop/code/web/lib/seo-sitemap.ts:13).
- Google exige enlaces de idioma recíprocos y autorreferentes; las variantes deben apuntar a URLs absolutas. HIOS satisface esos aspectos en la muestra. Google aclara que detecta el idioma por el contenido, no simplemente por `lang` o `hreflang`. — [Google: versiones localizadas](https://developers.google.com/search/docs/specialty/international/localized-versions).
- Ley de Ohm devuelve, antes de ejecutar JS, un H1, descripción, instrucciones y fórmulas; contiene `BreadcrumbList` y `WebApplication`. La portada contiene `WebSite`. — [Ley de Ohm](https://openhios.dev/es/workbench/ohms-law), [Inicio](https://openhios.dev/es), [ToolPageIntro.tsx](C:/Users/juanparedez/Desktop/code/web/components/workbench/ToolPageIntro.tsx:9), [structured-data.ts](C:/Users/juanparedez/Desktop/code/web/lib/structured-data.ts:34).
- Blog QPSK en EN/ES/DE respondió 200 con título, cuerpo y `Article.inLanguage` coherentes con el idioma. Los 12 artículos fuente tienen archivo de traducción en EN, DE e IT. Esto verifica presencia, no revisión lingüística exhaustiva de las 36 traducciones. — [QPSK EN](https://openhios.dev/en/blog/ref-modulacion-qpsk), [QPSK ES](https://openhios.dev/es/blog/ref-modulacion-qpsk), [QPSK DE](https://openhios.dev/de/blog/ref-modulacion-qpsk), [Carga del blog](C:/Users/juanparedez/Desktop/code/web/lib/blog.ts:32).
- `/en/projects/btdac` respondió 200 con contenido inglés, canonical, breadcrumbs y `WebPage`. `/es/admin` respondió con `noindex, nofollow` y sin canonical heredado. Una ruta inexistente de prueba devolvió 404 y `noindex`. — [BTDAC EN](https://openhios.dev/en/projects/btdac), [Admin](https://openhios.dev/es/admin), [Ruta inexistente auditada](https://openhios.dev/es/not-a-real-page-for-seo-audit).
- Pasaron `npm run test:seo` y `npm run test:sitemap`. También pasaron `node --experimental-strip-types scripts/seo-selftest.ts --built` (**372 páginas renderizadas**) y `node --experimental-strip-types scripts/sitemap-selftest.ts --built` (**364 URLs canónicas**). Esos dos últimos analizaron el **build local ya existente**, sin construir de nuevo ni desplegar. — [Prueba SEO](C:/Users/juanparedez/Desktop/code/web/scripts/seo-selftest.ts:44), [Prueba sitemap](C:/Users/juanparedez/Desktop/code/web/scripts/sitemap-selftest.ts:26).

### Inferences
- No corresponde proponer «agregar sitemap/canonical/hreflang» como si faltaran: conviene mantenerlos y ampliar sus regresiones.
- El patrón artículo técnico → herramienta → proyecto ya está presente y constituye una base útil para adquisición orgánica. Conviene profundizarlo según consultas reales, sin necesitar redes sociales.

### Gaps
- No se consultó una cuenta de Search Console: no se conocen páginas indexadas, exclusiones, canonical elegido por Google, impresiones, clics, CTR, consultas ni posiciones.
- No se rastrearon las 364 URLs live. El alcance de producción fue una muestra de portada, herramienta, artículo, proyecto, páginas internas, robots/sitemap y 404.
- No se ejecutó Rich Results Test ni una auditoría visual completa. JSON-LD presente no equivale a resultados enriquecidos garantizados.

## ¿Qué problemas concretos conviene corregir o medir?

### Takeaway
Los ajustes inmediatos son pequeños: evitar la indexación de interfaces internas y obtener mediciones reales de rendimiento. Hay una oportunidad clara de reducir HTML e i18n que se entregan en todas las rutas, pero todavía no hay evidencia para declarar malos Core Web Vitals.

### Cited Findings
- **Settings y feedback son indexables.** `/es/workbench/settings` y `/es/workbench/feedback` responden 200 y `index, follow`, heredado del layout. Están excluidos expresamente del test de cobertura del sitemap, pero eso no impide indexarlos a través de enlaces. — [Settings live](https://openhios.dev/es/workbench/settings), [Feedback live](https://openhios.dev/es/workbench/feedback), [Metadata settings](C:/Users/juanparedez/Desktop/code/web/app/[locale]/workbench/settings/page.tsx:6), [Metadata feedback](C:/Users/juanparedez/Desktop/code/web/app/[locale]/workbench/feedback/page.tsx:6), [Layout](C:/Users/juanparedez/Desktop/code/web/app/[locale]/layout.tsx:63), [Exclusión en test](C:/Users/juanparedez/Desktop/code/web/scripts/sitemap-selftest.ts:37).
- Para excluir una página de Google se puede usar `noindex`; el rastreador debe poder acceder a ella para leer esa instrucción. — [Google: bloquear indexación](https://developers.google.com/search/docs/crawling-indexing/block-indexing). Propuesta: `noindex, follow` en ambas interfaces y prueba que compruebe el resultado. **No se detectó una filtración de información privada**: este hallazgo trata de calidad de resultados de búsqueda. `noindex` no reemplaza la autenticación.
- **Payload común voluminoso.** Los cuerpos HTML recibidos midieron 542.036 bytes para `/en`, 557.513 para `/es`, 486.288 para Ohm EN, 501.356 para Ohm ES y 782.362 para BTDAC EN. Son bytes del cuerpo HTML obtenido con `fetch`, no el peso total de la página, ni una medición de LCP o INP. En las respuestas inspeccionadas no apareció `Content-Encoding`; no se hizo una captura independiente de transferencia comprimida en navegador. — [Inicio EN](https://openhios.dev/en), [Inicio ES](https://openhios.dev/es), [Ohm EN](https://openhios.dev/en/workbench/ohms-law), [Ohm ES](https://openhios.dev/es/workbench/ohms-law), [BTDAC EN](https://openhios.dev/en/projects/btdac).
- El layout obtiene **todos** los mensajes y se los entrega a `NextIntlClientProvider` en todas las páginas. Serializados como JSON, los diccionarios locales tienen 173.596 bytes EN, 188.444 ES, 185.971 DE y 184.694 IT. — [getMessages](C:/Users/juanparedez/Desktop/code/web/app/[locale]/layout.tsx:89), [Provider](C:/Users/juanparedez/Desktop/code/web/app/[locale]/layout.tsx:100), [EN](C:/Users/juanparedez/Desktop/code/web/messages/en.json), [ES](C:/Users/juanparedez/Desktop/code/web/messages/es.json). Cálculo reproducible: `Buffer.byteLength(JSON.stringify(JSON.parse(fs.readFileSync(..., 'utf8'))))`.
- Toda página localizada recibe `Cache-Control: private, no-cache, no-store, must-revalidate, no-transform`, confirmado en producción. El comentario del código explica que busca prevenir analytics inyectados por CDN y evitar cachear páginas autenticadas como públicas. — [Cabecera](C:/Users/juanparedez/Desktop/code/web/next.config.mjs:189), [Ohm ES](https://openhios.dev/es/workbench/ohms-law).
- `Article` ya incluye título, descripción, fecha de publicación e idioma, pero no autor, imagen o fecha de modificación. Google documenta cómo enriquecer el marcado de artículos. Estas propiedades solo deberían agregarse cuando existan datos y contenido correspondientes. — [Structured data](C:/Users/juanparedez/Desktop/code/web/lib/structured-data.ts:44), [Google: Article](https://developers.google.com/search/docs/appearance/structured-data/article).
- Core Web Vitals evalúa carga, respuesta a interacciones y estabilidad visual. Google recomienda LCP ≤2,5 s, INP <200 ms y CLS ≤0,1; las métricas de campo son distintas del tamaño de un documento o la duración de un único `fetch`. — [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

### Inferences
- Prioridad corta: corregir indexabilidad de settings/feedback, conservar fuera del sitemap y agregar comprobación; no es una urgencia de seguridad.
- Prioridad de rendimiento: cargar solo namespaces necesarios por ruta/área, reducir datos serializados redundantes y medir JS de entrada de herramientas. Antes/después con Lighthouse móvil reproducible y, si existe volumen suficiente, CrUX/Search Console.
- Revisar la política de caché por tipo de ruta podría beneficiar costo y tiempos de carga. No quitar `private/no-store/no-transform` globalmente a ciegas: primero demostrar qué HTML es estático y anónimo y mantener la separación de sesiones, API y datos personales. La política actual tiene una motivación de privacidad explícita.
- El artículo QPSK ya es un buen ejemplo editorial. Expandir casos concretos y relaciones entre herramientas es más útil que generar páginas genéricas en masa.

### Gaps
- No se midieron LCP, INP, CLS, Lighthouse móvil, peso transferido total ni experiencia de usuarios reales. No afirmar «sitio lento», «mal CWV» ni impacto cuantificado en ranking.
- No se midió caché interna OpenNext/Worker ni costo; un header del navegador/CDN no describe por sí solo todos los niveles de caché.
- No se auditó la implementación actual de permisos de feedback; el acceso no es parte del hallazgo SEO.

## ¿Cómo medir y mejorar la adquisición sin invadir privacidad?

### Takeaway
Search Console permite medir la aparición del sitio en Google sin instalar un rastreador de visitantes. La recomendación es conectar o revisar esa fuente, fijar una línea de base y elegir pocas familias de herramientas/proyectos con evidencia de demanda.

### Cited Findings
- Search Console muestra impresiones, clics, consultas y posición media; para utilizarlo hay que demostrar propiedad o recibir acceso de un propietario. — [Google: medir rendimiento](https://support.google.com/webmasters/answer/9131543?hl=en).
- La verificación por DNS está disponible y permite verificar una propiedad de dominio; no obliga a introducir Google Analytics ni Tag Manager. — [Google: verificar propiedad](https://support.google.com/webmasters/answer/9008080?hl=en). No se verificó si HIOS ya tiene una propiedad activa: la falta de etiquetas HTML no lo demostraría, porque podría estar verificada por DNS.
- Las páginas de artículo y proyecto ya ofrecen enlaces contextuales hacia herramientas relacionadas. — [QPSK y recursos relacionados](C:/Users/juanparedez/Desktop/code/web/app/[locale]/blog/[slug]/page.tsx:40), [Proyecto y recursos relacionados](C:/Users/juanparedez/Desktop/code/web/app/[locale]/projects/[slug]/page.tsx:97), [QPSK live](https://openhios.dev/es/blog/ref-modulacion-qpsk).

### Inferences
- Orden propuesto: (1) verificar/revisar propiedad Search Console y envío de sitemap; (2) extraer una línea base de 28/90 días, según disponibilidad, por página, consulta, idioma y dispositivo; (3) inspeccionar URLs con exclusiones o canonical diferente; (4) priorizar páginas con impresiones y CTR bajo, posiciones cercanas a primera página y herramientas que ya resuelven problemas concretos; (5) medir efecto después de cambios, sin atribuir causalidad a una sola fluctuación.
- Dos frentes plausibles para desarrollar, sujetos a datos: electrónica/ESP32 (pinouts, BOM, montaje, cálculos, monitor serie) y audio/DSP (QPSK, análisis de espectro, generador de señales). El material actual diferencia a HIOS frente a un catálogo genérico de utilidades.
- Para aumentar uso: rutas de trabajo completas con ejemplos reproducibles y exportación local; enlazar resultados útiles hacia proyectos/espacios. El SEO puede atraer la primera visita, pero la tarea resuelta y la continuidad del espacio dan razones para volver.
- Para patrocinios, reportar **clics de Google y uso agregado de herramientas como métricas diferentes**. No sumar impresiones, pageviews, aperturas y usuarios registrados como si fueran personas únicas ni prometer una audiencia deduplicada inexistente.
- Las estadísticas de búsqueda pueden ser agregadas y administradas fuera de la página pública. No requieren conectar al visitante con Google al cargar una herramienta.

### Gaps
- No hay datos observados de demanda por consulta o retorno, por lo que las familias recomendadas son hipótesis editoriales, no una conclusión de mercado.
- No se configuró Search Console ni se envió el sitemap: eso requiere acceso a la propiedad y no formó parte de esta auditoría de solo lectura.
- No se modificó código, contenido de producción, configuración del dominio ni despliegues.
