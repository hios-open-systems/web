/** Cookie-authenticated mutations must originate from this exact origin. */
export function requireSameOrigin(request: Request): Response | null {
  if (request.headers.get('origin') !== new URL(request.url).origin
    || request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({ error: 'origin' }, { status: 403 });
  }
  return null;
}

/** Bound actual streamed bytes, including requests without Content-Length. */
export async function readJsonBody(request: Request, maxBytes = 32_768): Promise<unknown> {
  const tooLarge = () => Response.json({ error: 'too_large' }, { status: 413 });
  if (Number(request.headers.get('content-length')) > maxBytes) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing body');
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw tooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
