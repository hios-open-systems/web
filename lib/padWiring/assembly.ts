import type { WiringGuide } from '../../config/pinouts/wiring.ts';

export const ASSEMBLY_PHASES = ['prepare', 'solder', 'inspect'] as const;
export type AssemblyPhase = typeof ASSEMBLY_PHASES[number];

/** The existing firmware-backed guide owns all GPIOs and electrical instructions. */
export function assemblyModules(guide: WiringGuide) {
  return [...guide.modules].filter(module => module.id !== 'system').sort((a, b) => a.step - b.step);
}

export function moduleConnections(guide: WiringGuide, moduleId: string) {
  return guide.pins.filter(pin => pin.mod === moduleId).map(pin => ({ ...pin, id: `${moduleId}:gpio-${pin.gpio}` }));
}

export function moduleSections(guide: WiringGuide, moduleId: string) {
  const group = guide.modules.find(item => item.id === moduleId)?.sectionGroup ?? moduleId;
  return guide.sections.filter(section => section.group === group);
}

export function assemblyTaskIds(guide: WiringGuide) {
  return assemblyModules(guide).flatMap(module => ASSEMBLY_PHASES.map(phase => `${module.id}:${phase}`));
}

export function assemblyStorageKey(guide: WiringGuide) {
  return `hios:assembly:v1:${guide.meta.id}:${guide.meta.rev}`;
}

export function parseAssemblyProgress(raw: string | null, validIds: string[]): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.includes(id)))] : [];
  } catch { return []; }
}
