/** Reject resource-loading syntax before Mermaid creates image elements. */
export function hasDiagramResources(source: string): boolean {
  return /\bimg\s*:|<\s*(?:img|image|iframe|object|embed)\b|!\[[^\]]*\]\(|url\s*\(|@import/i.test(source);
}
