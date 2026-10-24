import { DEFAULT_ACCENT } from './config';
import { fetchRemoteThemeSettings, updateRemoteThemeAccent } from './sync';

export type ThemeSyncState = 'anonymous' | 'checking' | 'needs-import' | 'synced' | 'error' | 'unavailable';

/** One controller per mounted provider. Local intent wins over older responses. */
export class ThemeSyncController {
  private revision = 0;
  private editedAccent: string | null = null;
  private receivedFromTab = false;
  private writes: Promise<void> = Promise.resolve();
  private apply: (accent: string) => void;
  private report: (state: ThemeSyncState) => void;

  constructor(apply: (accent: string) => void, report: (state: ThemeSyncState) => void) {
    this.apply = apply;
    this.report = report;
  }

  edit(accent: string) {
    this.receivedFromTab = false;
    this.editedAccent = accent;
    this.revision++;
  }

  cancel() {
    this.revision++;
  }

  receive() {
    this.cancel();
    this.receivedFromTab = true;
    this.editedAccent = null;
  }

  async load(localAccent: string) {
    // The originating tab owns its account save. Never echo it from here or
    // let a delayed login restore an account value over the shared local one.
    if (this.receivedFromTab) { this.report('needs-import'); return; }
    // The user may have edited while /auth/me was still resolving.
    if (this.editedAccent !== null) return this.save(this.editedAccent);
    const revision = this.revision;
    this.report('checking');
    try {
      const settings = await fetchRemoteThemeSettings();
      if (revision !== this.revision) return;
      if (settings.themeAccent) this.apply(settings.themeAccent);
      this.report(!settings.themeAccent && localAccent !== DEFAULT_ACCENT ? 'needs-import' : 'synced');
    } catch {
      if (revision === this.revision) this.report('unavailable');
    }
  }

  save(accent: string): Promise<void> {
    const revision = ++this.revision;
    this.report('checking');
    // Serialize writes: an older request must not finish last in the database.
    // Skip queued choices that have already been superseded by another edit.
    this.writes = this.writes.then(async () => {
      if (revision !== this.revision) return;
      try {
        await updateRemoteThemeAccent(accent);
        if (revision === this.revision) this.report('synced');
      } catch {
        if (revision === this.revision) this.report('unavailable');
      }
    });
    return this.writes;
  }
}
