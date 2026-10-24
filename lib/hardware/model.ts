import { moduleOf, parseInline } from '../../config/pinouts/wiring.ts';
import type { WiringGuide } from '../../config/pinouts/wiring.ts';

/**
 * Modelo neutro de un diseño de hardware a nivel módulo: qué GPIO va a qué
 * módulo y de qué riel come cada módulo. Es lo que se publica como esquema,
 * netlist y BOM. No describe una PCB: describe el cableado entre breakouts.
 */
export interface HwPin {
  gpio: number;
  signal: string;
  module: string;
  to: string;
  note?: string;
}

export interface HwModule {
  id: string;
  name: string;
  power: string;
  load?: string;
}

export interface HwRail {
  name: string;
  connects: string;
}

export interface HwSection {
  title: string;
  tip?: string;
  rows: { pin: string; name: string; to: string; note?: string }[];
}

export interface HwDesign {
  slug: string;
  title: string;
  rev: string;
  mcu: string;
  /** de dónde salen los pines (archivo de firmware o doc) */
  source: string;
  /** verified = un self-test compara los pines contra el firmware */
  status: 'verified' | 'draft';
  warnings: string[];
  modules: HwModule[];
  pins: HwPin[];
  rails: HwRail[];
  checks: string[];
  /** cadena de alimentación de izquierda a derecha, para dibujarla en el esquema */
  powerChain?: string[];
  /** detalle por bloque (alimentación, jumpers, SD…) tal como lo trae la guía */
  sections: HwSection[];
}

export interface BomItem {
  /** null = la cantidad no está documentada en ninguna fuente del repo */
  qty: number | null;
  part: string;
  role: string;
  notes: string;
  /** archivo del repo de donde se transcribió la fila */
  source: string;
}

/** Quita el markdown inline (**, `, _) para texto plano en SVG/CSV. */
export const plain = (text: string): string =>
  parseInline(text)
    .map((t) => t.text)
    .join('');

/** Los pines `dim` son reservados de la placa (USB/UART): no se cablean. */
export function fromWiringGuide(slug: string, guide: WiringGuide, warnings: string[] = []): HwDesign {
  const pins = guide.pins
    .filter((p) => p.kind !== 'dim')
    .sort((a, b) => moduleOf(guide, a).step - moduleOf(guide, b).step || a.gpio - b.gpio);
  const used = new Set(pins.map((p) => p.mod));
  return {
    slug,
    title: guide.meta.title,
    rev: guide.meta.rev,
    mcu: guide.meta.mcu,
    source: `projects/${slug}/${guide.meta.source}`,
    status: 'verified',
    warnings,
    modules: guide.modules
      .filter((m) => used.has(m.id) || m.id === 'power')
      .sort((a, b) => a.step - b.step)
      .map((m) => ({ id: m.id, name: plain(m.name), power: plain(m.power), load: m.load && plain(m.load) })),
    pins: pins.map((p) => ({ gpio: p.gpio, signal: p.name, module: p.mod, to: plain(p.dest), note: p.note && plain(p.note) })),
    rails: guide.rails.map((r) => ({ name: plain(r.t), connects: plain(r.c).replace(/^→\s*/, '') })),
    checks: guide.check.map(plain),
    sections: guide.sections.map((sec) => ({
      title: plain(sec.t),
      tip: sec.tip && plain(sec.tip),
      rows: (sec.rows ?? []).map((r) => ({ pin: r.pin, name: plain(r.nm), to: plain(r.to ?? ''), note: r.note && plain(r.note) })),
    })),
  };
}
