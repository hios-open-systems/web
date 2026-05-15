import type { D1Database } from '@cloudflare/workers-types';

/**
 * Devuelve el binding D1 inyectado por Cloudflare Pages.
 * En producción: process.env.DB viene del binding configurado en el dashboard.
 * En dev local (`wrangler pages dev`): wrangler.toml lo provee.
 *
 * En `next dev` plano (sin wrangler) no hay D1 y esto explota — eso es intencional,
 * para que se note rápido y no caigamos en un mock silencioso.
 */
export function getDb(): D1Database {
    const db = (process.env as { DB?: D1Database }).DB;
    if (!db) {
        throw new Error(
            'D1 binding "DB" no disponible. Corré la app con `wrangler pages dev` o configurá el binding en Cloudflare Pages.',
        );
    }
    return db;
}
