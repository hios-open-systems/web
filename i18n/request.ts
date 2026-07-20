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

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    const primary = await loadMessages(locale);
    const fallback = locale === 'en' ? null : await loadMessages('en');

    return {
        locale,
        messages: fallback ? deepMerge(fallback, primary) : primary,
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
