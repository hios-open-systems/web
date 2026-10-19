import type { WiringGuide } from './wiring';
import { MAX_SD_EXAMPLE_VALUES } from '../../lib/electronics/max98357.ts';

export type GuideCopy = Record<string, string>;
type Translate = (key: string, source: string) => string;

/** Only prose is translatable: GPIOs, module IDs, topology and checklist order stay fixed. */
export function mapGuideText(guide: WiringGuide, t: Translate): WiringGuide {
  const fields = <T extends object>(value: T, path: string, keys: (keyof T)[]): T => {
    const result = { ...value };
    for (const key of keys) {
      if (typeof value[key] === 'string') {
        result[key] = t(`${path}_${String(key)}`, value[key] as string) as T[keyof T];
      }
    }
    return result;
  };
  return {
    ...guide,
    meta: fields(guide.meta, 'meta', ['title', 'subtitle', 'note']),
    modules: guide.modules.map(m => fields(m, `module_${m.id}`, ['name', 'power', 'tip', 'load'])),
    pins: guide.pins.map(p => fields(p, `pin_${p.gpio}`, ['name', 'dest', 'note'])),
    rails: guide.rails.map(r => fields(r, `rail_${r.k}`, ['t', 'c'])),
    sections: guide.sections.map((s, i) => ({
      ...fields(s, `section_${i}`, ['t', 'cnt', 'ascii', 'tip']),
      rows: s.rows?.map((r, j) => fields(r, `section_${i}_row_${j}`, ['nm', 'to', 'note'])),
    })),
    check: guide.check.map((s, i) => t(`check_${i}`, s)),
    divergence: guide.divergence?.map((d, i) => fields(d, `divergence_${i}`, ['guide', 'firmware', 'why'])),
    keymap: guide.keymap ? {
      ...guide.keymap,
      rows: guide.keymap.rows.map(r => fields(r, `matrix_${r.r}`, ['name'])),
      navRow: guide.keymap.navRow.map((n, i) => n.kind === 'aux' ? fields(n, `nav_${i}`, ['label']) : n),
    } : undefined,
  };
}

export function guideCopy(guide: WiringGuide): GuideCopy {
  const copy: GuideCopy = {};
  mapGuideText(guide, (key, source) => { copy[key] = source; return source; });
  return copy;
}

export function localizeGuide(guide: WiringGuide, copy: GuideCopy): WiringGuide {
  const values: Record<string, string | number> = {
    sdResistance: MAX_SD_EXAMPLE_VALUES.resistance,
    sdVoltage: MAX_SD_EXAMPLE_VALUES.voltage,
    sdMin: MAX_SD_EXAMPLE_VALUES.min,
    sdMax: MAX_SD_EXAMPLE_VALUES.max,
  };
  return mapGuideText(guide, (key) => {
    if (typeof copy[key] !== 'string') throw new Error(`Missing guide translation: ${guide.meta.id}.${key}`);
    return copy[key].replace(/\{(\w+)\}/g, (_, token: string) => {
      if (!(token in values)) throw new Error(`Unknown guide value: ${token}`);
      return String(values[token]);
    });
  });
}
