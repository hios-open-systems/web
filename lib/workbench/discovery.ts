import type { WorkbenchTool } from '../../config/workbench.ts';

export const activities = ['development', 'maker', 'audio', 'ai', 'knowledge', 'software'] as const;
export type Activity = typeof activities[number];

export function activityFor(tool: WorkbenchTool): Activity {
  if (/llm|token-inspector|voice-ai/.test(tool.id)) return 'ai';
  if (tool.sectionId === 'audio') return 'audio';
  if (tool.sectionId === 'electronics' || tool.id === 'serial-monitor' || tool.id === 'embedded') return 'maker';
  if (tool.sectionId === 'reference' || tool.id === 'notes') return 'knowledge';
  return 'development';
}

export interface SearchEntry {
  label: string;
  hint: string;
  keywords?: string;
  id?: string;
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
    }
    previous = row;
  }
  return previous[b.length];
}

export function searchScore(entry: SearchEntry, query: string): number {
  const q = normalizeSearch(query).slice(0, 160);
  if (!q) return 0;
  const title = normalizeSearch(entry.label);
  if (title === q || entry.id === q) return 100;
  if (title.startsWith(q)) return 80;
  const words = normalizeSearch(`${title} ${entry.hint} ${entry.keywords ?? ''} ${entry.id ?? ''}`).split(/[^\p{L}\p{N}]+/u);
  const terms = q.split(/\s+/);
  if (terms.every(term => words.some(word => word.includes(term)))) return 60;
  if (terms.every(term => words.some(word => word.startsWith(term) || (term.length > 3 && distance(term, word) <= 1)))) return 30;
  return -1;
}

export function rankEntries<T extends SearchEntry>(entries: T[], query: string, pinned: string[] = [], recent: string[] = []): T[] {
  const preference = (id = '') => pinned.includes(id) ? 0 : recent.includes(id) ? 1 : 2;
  return entries.map((entry, index) => ({ entry, index, score: searchScore(entry, query) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score || preference(a.entry.id) - preference(b.entry.id) || a.index - b.index)
    .map(item => item.entry);
}
