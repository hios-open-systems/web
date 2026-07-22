// Config del adaptador @opennextjs/cloudflare (reemplaza a @cloudflare/next-on-pages).
//
// incrementalCache: staticAssetsIncrementalCache
//   Sirve las páginas prerenderizadas (SSG) desde el binding ASSETS, sin R2/KV.
//   Sin esto el cache "dummy" siempre falla → el Worker RE-RENDERIZA cada página
//   prerenderizada en cada isolate frío (SSR de antd + cssinjs ≈ 122ms CPU) →
//   "Worker exceeded CPU time limit" / Error 1102 en /de, /es/tools, etc.
//   Solo válido si NINGUNA ruta usa ISR/revalidate (verificado: revalidate=false
//   en todas). Si algún día se agrega ISR, hay que migrar a r2IncrementalCache.
//
// enableCacheInterception: true
//   Intercepta el request y sirve la página cacheada ANTES de correr el pipeline
//   de render de Next → evita cargar el módulo de la ruta + antd en cada hit.
//   Debe ser false si se usa PPR (no lo usamos).
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
