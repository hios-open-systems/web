/**
 * Feedback inbox: errores auto-capturados + entradas manuales del usuario.
 *
 * Diseño:
 *  - Una sola lista, varios tipos. Cada entry tiene `kind` para saber qué es.
 *  - Versionado en localStorage para poder migrar después.
 *  - Circular buffer cap 50 — los más nuevos pushean afuera a los más viejos.
 *  - Sin user_id por ahora (anónimo). Cuando llegue auth, se agrega y se sync-ea.
 */

export type FeedbackKind = 'error' | 'bug' | 'idea' | 'note';
export type FeedbackSource = 'runtime' | 'manual';
export type FeedbackSeverity = 'info' | 'warn' | 'error';
export type FeedbackAuthState = 'anonymous' | 'authenticated';

export interface FeedbackEntry {
    id: string;
    kind: FeedbackKind;
    source: FeedbackSource;
    severity: FeedbackSeverity;
    title: string;
    /** Cuerpo libre. Para errores: el mensaje. Para entries manuales: lo que escriba el user. */
    body: string;
    /** Stack trace si aplica. */
    stack?: string;
    /** URL donde ocurrió (para errores) o donde estaba el usuario (para manuales). */
    url?: string;
    /** User-agent al momento de captura. */
    userAgent?: string;
    /** Fingerprint estable para dedupe local. */
    fingerprint: string;
    /** Cantidad de veces que volvió a aparecer. */
    occurrences: number;
    /** Timestamp epoch ms. */
    createdAt: number;
    /** Timestamp del último evento consolidado. */
    lastSeenAt: number;
    /** Si el usuario ya lo vio en el inbox. */
    read: boolean;
    /** Puntuación opcional 1-5 (feedback manual con estrellas). */
    rating?: number;
    /** Si la entrada se envió al server (D1). */
    sentToServer?: boolean;
    /** Contexto útil para producción. */
    buildId?: string;
    locale?: string;
    toolSlug?: string;
    authState: FeedbackAuthState;
    userId?: string;
}

export const FEEDBACK_STORAGE_KEY = 'hios-feedback-entries';
export const FEEDBACK_STORAGE_VERSION = 2;
export const FEEDBACK_CAP = 50;

export interface FeedbackPayload {
    version: 2;
    entries: FeedbackEntry[];
}

export function isFeedbackKind(value: unknown): value is FeedbackKind {
    return value === 'error' || value === 'bug' || value === 'idea' || value === 'note';
}

export function isFeedbackSource(value: unknown): value is FeedbackSource {
    return value === 'runtime' || value === 'manual';
}

export function isFeedbackSeverity(value: unknown): value is FeedbackSeverity {
    return value === 'info' || value === 'warn' || value === 'error';
}

export function isFeedbackAuthState(value: unknown): value is FeedbackAuthState {
    return value === 'anonymous' || value === 'authenticated';
}
