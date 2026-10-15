/** A URL, navigation, image or prefetch must never trigger a proxy request. */
export function requireExternalConsent(request: Request): Response | null {
  if (request.headers.get('x-hios-external-consent') !== '1') {
    return Response.json({ error: 'Explicit external-query consent is required.' }, { status: 403 });
  }
  return null;
}
