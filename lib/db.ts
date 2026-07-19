import type { D1Database } from '@cloudflare/workers-types';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Devuelve el binding D1 del Worker (@opennextjs/cloudflare).
 *
 * Antes (next-on-pages/Pages) el binding llegaba por `process.env.DB`. Con OpenNext
 * los bindings NO están en process.env: se acceden por `getCloudflareContext().env`.
 * getCloudflareContext() es sincrónico y solo tiene contexto en tiempo de request
 * (route handlers, server actions) — que es donde se usa esto.
 *
 * En `next dev` plano (sin wrangler / sin initOpenNextCloudflareForDev) no hay
 * contexto y esto explota — intencional, para que se note y no caigamos en un mock
 * silencioso. Para D1 local: `npm run preview` (wrangler) o `wrangler d1 ...`.
 */
export function getDb(): D1Database {
    const db = (getCloudflareContext().env as { DB?: D1Database }).DB;
    if (!db) {
        throw new Error(
            'D1 binding "DB" no disponible. Corré la app con `npm run preview` (wrangler) o configurá el binding en el Worker de Cloudflare.',
        );
    }
    return db;
}
