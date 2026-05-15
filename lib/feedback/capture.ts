import { appendEntry } from './storage';
import type { FeedbackEntry } from './types';

interface CaptureOptions {
    /** Callback que se ejecuta al guardar una entrada (para mostrar toast, refrescar UI, etc). */
    onCapture?: (entry: FeedbackEntry) => void;
}

function safeUrl(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
        return window.location.href;
    } catch {
        return undefined;
    }
}

function safeUserAgent(): string | undefined {
    if (typeof navigator === 'undefined') return undefined;
    return navigator.userAgent;
}

function extractTitle(message: string): string {
    const firstLine = message.split('\n', 1)[0] ?? message;
    return firstLine.length > 120 ? firstLine.slice(0, 117) + '...' : firstLine;
}

/**
 * Instala listeners globales y devuelve una función de cleanup.
 * Pensado para usarse desde un useEffect en el provider.
 */
export function installCapture(options: CaptureOptions = {}): () => void {
    if (typeof window === 'undefined') return () => { };

    const handleError = (event: ErrorEvent) => {
        const message = event.message || event.error?.message || 'Error desconocido';
        const stack = event.error instanceof Error ? event.error.stack : undefined;
        const entry = appendEntry({
            kind: 'error',
            title: extractTitle(message),
            body: message,
            stack,
            url: safeUrl(),
            userAgent: safeUserAgent(),
        });
        options.onCapture?.(entry);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message =
            reason instanceof Error
                ? reason.message
                : typeof reason === 'string'
                    ? reason
                    : JSON.stringify(reason);
        const stack = reason instanceof Error ? reason.stack : undefined;
        const entry = appendEntry({
            kind: 'error',
            title: extractTitle(`Unhandled rejection: ${message}`),
            body: message,
            stack,
            url: safeUrl(),
            userAgent: safeUserAgent(),
        });
        options.onCapture?.(entry);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    // Marca de readiness: usada por los smoke tests para evitar races bajo carga.
    (window as unknown as { __hios_feedback_ready__?: boolean }).__hios_feedback_ready__ = true;

    return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
        delete (window as unknown as { __hios_feedback_ready__?: boolean }).__hios_feedback_ready__;
    };
}

/**
 * Helper para capturar manualmente desde código de la app (try/catch, etc).
 */
export function captureManual(
    kind: FeedbackEntry['kind'],
    title: string,
    body: string,
    extra?: { stack?: string },
): FeedbackEntry {
    return appendEntry({
        kind,
        title,
        body,
        stack: extra?.stack,
        url: safeUrl(),
        userAgent: safeUserAgent(),
    });
}
