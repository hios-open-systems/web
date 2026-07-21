import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

async function loadMessages(locale: string) {
    return (await import(`../messages/${locale}.json`)).default;
}

function deepMerge<T extends Record<string, any>>(base: T, override: T): T {
    const result: Record<string, any> = { ...base };
    for (const [key, value] of Object.entries(override ?? {})) {
        if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            result[key] &&
            typeof result[key] === 'object' &&
            !Array.isArray(result[key])
        ) {
            result[key] = deepMerge(result[key], value);
        } else {
            result[key] = value;
        }
    }
    return result as T;
}

// Cache del árbol de mensajes ya mergeado, por locale (máx 4 entradas). Los
// mensajes no cambian entre requests dentro de un isolate, así que memoizar es
// seguro. Sin esto, cada request no-inglés re-clonaba ~100KB/1769 nodos en el
// deepMerge — allocación transitoria que, bajo concurrencia, empujaba el isolate
// hacia el techo de 128MB (una de las causas del Error 1102).
const mergedMessagesCache: Record<string, Record<string, unknown>> = {};

async function getMergedMessages(locale: string): Promise<Record<string, unknown>> {
    const cached = mergedMessagesCache[locale];
    if (cached) return cached;

    const primary = await loadMessages(locale);
    const merged = locale === 'en' ? primary : deepMerge(await loadMessages('en'), primary);
    mergedMessagesCache[locale] = merged;
    return merged;
}

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: await getMergedMessages(locale),
        // En prod se traga el error a propósito: una clave faltante degrada a
        // su nombre, no tira la página. Pero en dev tiene que hacer ruido —
        // callarlo es lo que dejó pasar claves rotas hasta producción.
        onError: (error) => {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[i18n] ${error.message}`);
            }
        },
        getMessageFallback: ({ key }) => key,
    };
});
