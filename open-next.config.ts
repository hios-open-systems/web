// Config del adaptador @opennextjs/cloudflare (reemplaza a @cloudflare/next-on-pages).
//
// Config mínima a propósito: sin incrementalCache (R2) por ahora. La app es casi
// toda dinámica + estática; el cache incremental de ISR se puede sumar después
// creando un bucket R2 y agregando el override r2IncrementalCache acá.
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({});
