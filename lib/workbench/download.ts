/**
 * Trigger a client-side file download from in-memory data. Extracts the
 * blob -> object URL -> anchor -> click -> revoke dance so tools don't
 * hand-roll it (was duplicated in MermaidTool / ExcalidrawTool). Client-only,
 * no login. An optional aggregate event contains no filename or file content.
 */
import { trackWorkbench } from './events';

export function downloadBlob(data: BlobPart, filename: string, mime: string): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  trackWorkbench('export_generated');
  // Give mobile browsers time to consume the URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
