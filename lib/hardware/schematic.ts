import type { HwDesign, HwModule, HwPin } from './model.ts';

/**
 * Esquema de cableado a nivel módulo, como SVG autocontenido: el MCU a la
 * izquierda, cada módulo a la derecha con sus líneas de GPIO, y los rieles
 * abajo. Determinístico (mismo diseño → mismos bytes) para que el self-test
 * pueda detectar un archivo publicado que quedó viejo.
 */
const W = 1120;
const ROW = 24;
const MCU_X = 32;
const MCU_W = 300;
const MOD_X = 600;
const MOD_W = 488;

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s: string, max: number): string => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export const fullTitle = (design: HwDesign): string =>
  design.title.startsWith('HIOS') ? design.title : `HIOS ${design.title}`;

const text = (x: number, y: number, s: string, cls = ''): string =>
  `<text x="${x}" y="${y}"${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;

interface Group {
  mod: HwModule;
  pins: HwPin[];
}

function groups(design: HwDesign): Group[] {
  return design.modules
    .map((mod) => ({ mod, pins: design.pins.filter((p) => p.module === mod.id) }))
    .filter((g) => g.pins.length > 0 || g.mod.id === 'power');
}

function header(design: HwDesign, y: number): { svg: string[]; y: number } {
  const svg = [
    text(MCU_X, y, `${fullTitle(design)} — esquema de cableado (rev ${design.rev})`, 'title'),
    text(MCU_X, y + 22, `MCU: ${design.mcu} · pines desde ${design.source}`, 'meta'),
    text(MCU_X, y + 40, design.status === 'verified'
      ? 'Generado por scripts/gen-hardware-docs.ts. Pines verificados contra el firmware por npm test. Cableado entre módulos, no una PCB.'
      : 'BORRADOR — generado de la documentación; no hay firmware que lo confirme por completo. No soldar hasta resolver las advertencias.', 'meta'),
  ];
  let cy = y + 64;
  for (const warning of design.warnings) {
    for (const line of wrap(`⚠ ${warning}`, 130)) {
      svg.push(text(MCU_X, cy, line, 'warn'));
      cy += 16;
    }
  }
  return { svg, y: cy + 12 };
}

/** Cajas encadenadas con flechas: el camino de la energía de la batería al MCU. */
function powerChainBlock(chain: string[] | undefined, y: number): { svg: string[]; y: number } {
  if (!chain?.length) return { svg: [], y };
  const gap = 28;
  const w = (W - 2 * MCU_X - gap * (chain.length - 1)) / chain.length;
  const svg = [text(MCU_X, y, 'Camino de la energía', 'modname')];
  chain.forEach((label, i) => {
    const x = MCU_X + i * (w + gap);
    svg.push(`<rect x="${x}" y="${y + 10}" width="${w}" height="34" class="rail"/>`);
    svg.push(text(x + 8, y + 31, clip(label, Math.floor(w / 7)), 'railname'));
    if (i > 0) svg.push(`<path d="M${x - gap + 2} ${y + 27} H${x - 4}" class="wire"/><path d="M${x - 9} ${y + 22} L${x - 3} ${y + 27} L${x - 9} ${y + 32}" class="wire"/>`);
  });
  return { svg, y: y + 64 };
}

function moduleBlock(group: Group, y: number, mcuPinY: Map<number, number>): { svg: string[]; y: number } {
  const lines = [group.mod.power, ...(group.mod.load ? [`carga: ${group.mod.load}`] : [])].flatMap((l) => wrap(l, 68));
  const h = 26 + lines.length * 15 + group.pins.length * ROW + 8;
  const svg = [
    `<rect x="${MOD_X}" y="${y}" width="${MOD_W}" height="${h}" class="mod"/>`,
    text(MOD_X + 12, y + 18, group.mod.name, 'modname'),
    ...lines.map((l, i) => text(MOD_X + 12, y + 36 + i * 15, l, 'power')),
  ];
  let py = y + 26 + lines.length * 15 + 4;
  for (const pin of group.pins) {
    const cy = py + ROW / 2;
    mcuPinY.set(pin.gpio, cy);
    svg.push(`<circle cx="${MOD_X}" cy="${cy}" r="3" class="dot"/>`);
    svg.push(text(MOD_X + 12, cy + 4, clip(`${pin.signal}: ${pin.to}`, 68), 'pin'));
    py += ROW;
  }
  return { svg, y: y + h + 14 };
}

function mcuBlock(design: HwDesign, top: number, bottom: number, pinY: Map<number, number>): string[] {
  const svg = [
    `<rect x="${MCU_X}" y="${top}" width="${MCU_W}" height="${bottom - top}" class="mcu"/>`,
    text(MCU_X + 12, top + 20, design.mcu, 'modname'),
  ];
  for (const pin of design.pins) {
    const y = pinY.get(pin.gpio);
    if (y === undefined) continue;
    svg.push(text(MCU_X + MCU_W - 12, y + 4, `${pin.signal} · GPIO${pin.gpio}`, 'gpio'));
    svg.push(`<path d="M${MCU_X + MCU_W} ${y} H${MOD_X}" class="${pin.note ? 'wire flag' : 'wire'}"/>`);
  }
  return svg;
}

function railsBlock(design: HwDesign, y: number): { svg: string[]; y: number } {
  const svg = [
    ...(design.pins.some((p) => p.note)
      ? [text(MCU_X, y, 'Línea roja punteada = el pin tiene una nota: leela en hardware/README.md antes de soldar.', 'meta')]
      : []),
    text(MCU_X, y + 24, 'Rieles de alimentación', 'modname'),
  ];
  let cy = y + 44;
  for (const rail of design.rails) {
    const lines = wrap(rail.connects, 120);
    svg.push(`<rect x="${MCU_X}" y="${cy - 14}" width="${W - 2 * MCU_X}" height="${lines.length * 15 + 10}" class="rail"/>`);
    svg.push(text(MCU_X + 12, cy + 1, rail.name, 'railname'));
    lines.forEach((l, i) => svg.push(text(MCU_X + 220, cy + 1 + i * 15, l, 'power')));
    cy += lines.length * 15 + 18;
  }
  return { svg, y: cy };
}

const STYLE = `<style>
text{font-family:ui-monospace,Menlo,Consolas,monospace;fill:#111}
.title{font-size:20px;font-weight:700}.meta{font-size:11px;fill:#444}
.warn{font-size:12px;fill:#b00020;font-weight:700}
.modname{font-size:13px;font-weight:700}.power{font-size:11px;fill:#333}
.pin{font-size:11px}.gpio{font-size:11px;text-anchor:end;font-weight:700}
.mcu{fill:#eef4ff;stroke:#1d4ed8;stroke-width:2}.mod{fill:#f7f7f7;stroke:#333;stroke-width:1.5}
.rail{fill:#fff8e6;stroke:#b7791f}.railname{font-size:12px;font-weight:700}
.wire{stroke:#1d4ed8;stroke-width:1.5;fill:none}.flag{stroke:#b00020;stroke-dasharray:5 3}.dot{fill:#1d4ed8}
</style>`;

export function renderSchematicSvg(design: HwDesign): string {
  const head = header(design, 36);
  const chain = powerChainBlock(design.powerChain, head.y);
  const top = chain.y;
  const pinY = new Map<number, number>();
  const mods: string[] = [];
  let y = top;
  for (const group of groups(design)) {
    const block = moduleBlock(group, y, pinY);
    mods.push(...block.svg);
    y = block.y;
  }
  const mcu = mcuBlock(design, top, Math.max(y - 14, top + 60), pinY);
  const rails = railsBlock(design, y + 16);
  const h = rails.y + 16;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">`,
    `<title>${esc(fullTitle(design))} — esquema de cableado</title>`,
    STYLE,
    `<rect width="${W}" height="${h}" fill="#ffffff"/>`,
    ...head.svg, ...chain.svg, ...mods, ...mcu, ...rails.svg,
    '</svg>',
    '',
  ].join('\n');
}
