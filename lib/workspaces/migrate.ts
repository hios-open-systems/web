import { readUsage } from '../workbench/usage';
import { makeRecord, type Workspace, type WorkspaceStore } from './model';
import { workbenchTools } from '@/config/workbench';

export function migrateLocal(store: WorkspaceStore): WorkspaceStore {
  if (store.migrated) return store;
  const records = [...store.records];
  const pinned = readUsage().pinned;
  if (pinned.length) {
    const space: Workspace = { id: 'favorites', version: 1, name: 'Workbench', entries: pinned.map(id => ({ id: crypto.randomUUID(), resourceId: `tool:${id}` })) };
    records.push(makeRecord(space, 'workspaces'));
  }
  for (const tool of workbenchTools) {
    try {
      const old: unknown = JSON.parse(localStorage.getItem(`hios-presets-${tool.id}`) ?? '[]');
      if (!Array.isArray(old)) continue;
      for (const preset of old) {
        if (!preset || typeof preset.name !== 'string' || typeof preset.query !== 'string') continue;
        records.push(makeRecord({ id: crypto.randomUUID(), version: 1, toolId: tool.id, name: preset.name.slice(0, 100), settings: {},
          content: Object.fromEntries(new URLSearchParams(preset.query)), syncContent: false }, 'presets'));
      }
    } catch { /* Leave malformed legacy entries untouched. */ }
  }
  return { ...store, records, migrated: true };
}
