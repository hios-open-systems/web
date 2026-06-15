/**
 * Sends a feedback note to the server (D1) so the owner receives it. Anonymous —
 * no login required. Callers should ALSO keep a local copy (appendEntry) so a
 * server hiccup never loses the note; this only handles the remote hop.
 */
export interface FeedbackSubmission {
  kind: 'bug' | 'idea' | 'note';
  rating?: number;
  message: string;
  email?: string;
  toolSlug?: string;
}

export async function submitFeedback(input: FeedbackSubmission): Promise<{ ok: boolean }> {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        kind: input.kind,
        rating: input.rating,
        message: input.message,
        email: input.email,
        toolSlug: input.toolSlug,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        locale:
          typeof document !== 'undefined' && document.documentElement.lang
            ? document.documentElement.lang
            : undefined,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
