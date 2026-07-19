/**
 * Trigger a client-side file download from in-memory data. Extracts the
 * blob -> object URL -> anchor -> click -> revoke dance so tools don't
 * hand-roll it (was duplicated in MermaidTool / ExcalidrawTool). Client-only,
 * no login, no network.
 */
export function downloadBlob(data: BlobPart, filename: string, mime: string): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
