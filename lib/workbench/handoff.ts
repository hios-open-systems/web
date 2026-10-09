export interface Handoff { version: 1; toolId: string; values: Record<string, string>; createdAt: number }
export function createHandoff(toolId: string, values: Record<string, string>): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem(`hios-handoff:${id}`, JSON.stringify({ version: 1, toolId, values, createdAt: Date.now() }));
  return id;
}
export function readHandoff(id: string, toolId: string): Record<string, string> | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(`hios-handoff:${id}`) ?? 'null') as Handoff | null;
    if (!data || data.version !== 1 || data.toolId !== toolId || Date.now() - data.createdAt > 3_600_000
      || !data.values || Object.values(data.values).some(value => typeof value !== 'string')) return null;
    return data.values;
  } catch { return null; }
}
