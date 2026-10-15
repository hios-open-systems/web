/** Relative self-hosted resources only; no implicit remote loads from pasted content. */
export function isLocalResource(url: string): boolean {
  try {
    const base = 'https://local.invalid';
    const parsed = new URL(url, base);
    return parsed.origin === base && !/^[a-z][a-z\d+.-]*:/i.test(url.trim());
  } catch { return false; }
}
