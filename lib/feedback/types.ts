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

export interface FeedbackEntry {
    id: string;
    kind: FeedbackKind;
    title: string;
    /** Cuerpo libre. Para errores: el mensaje. Para entries manuales: lo que escriba el user. */
    body: string;
    /** Stack trace si aplica. */
    stack?: string;
    /** URL donde ocurrió (para errores) o donde estaba el usuario (para manuales). */
    url?: string;
    /** User-agent al momento de captura. */
    userAgent?: string;
    /** Timestamp epoch ms. */
    createdAt: number;
    /** Si el usuario ya lo vio en el inbox. */
    read: boolean;
}

export const FEEDBACK_STORAGE_KEY = 'hios-feedback-entries';
export const FEEDBACK_STORAGE_VERSION = 1;
export const FEEDBACK_CAP = 50;

export interface FeedbackPayload {
    version: 1;
    entries: FeedbackEntry[];
}

export function isFeedbackKind(value: unknown): value is FeedbackKind {
    return value === 'error' || value === 'bug' || value === 'idea' || value === 'note';
}
