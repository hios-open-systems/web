import type { BadgeKind, WiringGuide } from '../../config/pinouts/wiring.ts';
import type { BoardPinout } from '../../config/pinouts/modules/breakout.ts';

/** A physical spot on the DevKit header, counted the way you count with the board in hand. */
export interface HeaderSpot {
  header: string;
  side: 'left' | 'right';
  /** 1 = the pin closest to the antenna */
  pos: number;
  silk: string;
}

/** One joint to solder: from the guide's section rows, or from a bare pin when no row covers it. */
export interface SolderWire {
  id: string;
  pin: string;
  kind: BadgeKind;
  name: string;
  to: string;
  note?: string;
  spot?: HeaderSpot;
}

/** The existing firmware-backed guide owns all GPIOs and electrical instructions. */
export function assemblyModules(guide: WiringGuide) {
  return [...guide.modules].filter(module => module.id !== 'system').sort((a, b) => a.step - b.step);
}

export function moduleSections(guide: WiringGuide, moduleId: string) {
  const group = guide.modules.find(item => item.id === moduleId)?.sectionGroup ?? moduleId;
  return guide.sections.filter(section => section.group === group);
}

/** Silk label printed next to a guide pin: numbers are GPIOs, the rest are rails. */
export function silkFor(pin: string) {
  return /^\d+$/.test(pin) ? `IO${pin}` : pin;
}

export function headerSpot(board: BoardPinout | undefined, pin: string): HeaderSpot | undefined {
  if (!board) return undefined;
  const silk = silkFor(pin);
  for (const side of ['left', 'right'] as const) {
    const found = board[side].find(item => item.labels[0]?.text === silk);
    if (found) return { header: board.headers[side], side, pos: found.pos, silk };
  }
  return undefined;
}

/**
 * Every joint of a module, in the order the guide lists them. Ids use section and row
 * indexes, never the translated text, so progress survives a locale switch.
 * Rails (5V/3V3/GND) only land on the header in the power module: everywhere else a
 * module's VCC/GND goes to the shared rail, and pinning it to J1-22 would be a lie.
 */
export function moduleWires(guide: WiringGuide, moduleId: string, board?: BoardPinout): SolderWire[] {
  const group = guide.modules.find(item => item.id === moduleId)?.sectionGroup ?? moduleId;
  const wires: SolderWire[] = [];
  const spotFor = (pin: string) => (moduleId === 'power' || /^\d+$/.test(pin) ? headerSpot(board, pin) : undefined);
  guide.sections.forEach((section, s) => {
    if (section.group !== group) return;
    section.rows?.forEach((row, r) => wires.push({
      id: `${moduleId}:s${s}r${r}`, pin: row.pin, kind: row.kind, name: row.nm, to: row.to ?? '', note: row.note,
      spot: spotFor(row.pin),
    }));
  });
  const covered = new Set(wires.map(wire => wire.pin));
  guide.pins.filter(pin => pin.mod === moduleId && !covered.has(String(pin.gpio))).forEach(pin => wires.push({
    id: `${moduleId}:gpio-${pin.gpio}`, pin: String(pin.gpio), kind: pin.kind, name: pin.name, to: pin.dest,
    note: pin.note, spot: headerSpot(board, String(pin.gpio)),
  }));
  return wires;
}

export function assemblyTaskIds(guide: WiringGuide) {
  return assemblyModules(guide).flatMap(module => moduleWires(guide, module.id).map(wire => wire.id));
}

export function assemblyStorageKey(guide: WiringGuide) {
  return `hios:solder:v2:${guide.meta.id}:${guide.meta.rev}`;
}

export function parseAssemblyProgress(raw: string | null, validIds: string[]): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.includes(id)))] : [];
  } catch { return []; }
}
