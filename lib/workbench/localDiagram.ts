/** Reject resource-loading syntax before Mermaid creates DOM/CSS. */
export function hasDiagramResources(source: string): boolean {
  // CSS accepts comments and escaped identifiers (e.g. u\\72l); checking only
  // literal "url(" lets diagram styles initiate requests despite the guard.
  let normalized = source;
  for (let pass = 0; pass < 3; pass++) normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '').replace(
    /\\([0-9a-f]{1,6}\s?|[^\r\n])/gi,
    (_, escaped: string) => /^[0-9a-f]/i.test(escaped)
      ? String.fromCodePoint(Math.min(parseInt(escaped, 16), 0x10ffff)) : escaped,
  );
  return /\bimg\s*:|<\s*(?:img|image|iframe|object|embed)\b|!\[[^\]]*\]\(|url\s*\(|@import/i.test(normalized);
}
