import { esc, fullTitle } from './schematic.ts';
import type { BomItem, HwDesign } from './model.ts';

/** Netlist + BOM + checklist en Markdown y CSV, desde el mismo modelo que el SVG. */
const csvCell = (v: string | number | null): string => {
  const s = v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function renderBomCsv(bom: BomItem[]): string {
  const rows = bom.map((b) => [b.qty, b.part, b.role, b.notes, b.source].map(csvCell).join(','));
  return ['qty,part,role,notes,source', ...rows, ''].join('\n');
}

const mdCell = (s: string): string => s.replace(/\|/g, '\\|');

function statusLine(design: HwDesign): string {
  return design.status === 'verified'
    ? `Pines verificados contra el firmware (\`${design.source}\`) en cada \`npm test\`.`
    : `**Borrador.** Transcrito de \`${design.source}\`; el firmware no confirma todo el cableado. No soldar hasta resolver las advertencias.`;
}

function netlistMd(design: HwDesign): string[] {
  const out: string[] = [];
  for (const mod of design.modules) {
    const pins = design.pins.filter((p) => p.module === mod.id);
    out.push(`### ${mod.name}`, '', `Alimentación: ${mod.power}`);
    if (mod.load) out.push('', `Carga: ${mod.load}`);
    if (pins.length) {
      out.push('', '| GPIO | Señal | Hacia | Nota |', '|---|---|---|---|');
      for (const p of pins) out.push(`| ${p.gpio} | ${mdCell(p.signal)} | ${mdCell(p.to)} | ${mdCell(p.note ?? '')} |`);
    }
    out.push('');
  }
  return out;
}

function sectionsMd(design: HwDesign): string[] {
  if (!design.sections.length) return [];
  const out = ['## Detalle por bloque', ''];
  for (const sec of design.sections) {
    out.push(`### ${sec.title}`, '');
    if (sec.tip) out.push(sec.tip, '');
    if (sec.rows.length) {
      out.push('| Pin | Qué | Hacia | Nota |', '|---|---|---|---|');
      out.push(...sec.rows.map((r) => `| ${mdCell(r.pin)} | ${mdCell(r.name)} | ${mdCell(r.to)} | ${mdCell(r.note ?? '')} |`), '');
    }
  }
  return out;
}

export function renderWiringMd(design: HwDesign, bom: BomItem[]): string {
  const out = [
    `# ${fullTitle(design)} — cableado y BOM`, '',
    `> Generado por \`scripts/gen-hardware-docs.ts\` desde \`config/hardware/\`. No editar a mano: corré \`npm run gen:hardware\`.`, '',
    `MCU: **${design.mcu}** · rev ${design.rev}`, '', statusLine(design), '',
    'Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.', '',
  ];
  if (design.warnings.length) out.push('## Advertencias', '', ...design.warnings.map((w) => `- ⚠️ ${w}`), '');
  if (design.powerChain?.length) out.push('## Camino de la energía', '', design.powerChain.join(' → '), '');
  out.push('## Conexiones por módulo', '', ...netlistMd(design));
  out.push('## Rieles', '', '| Riel | Conecta |', '|---|---|');
  out.push(...design.rails.map((r) => `| ${mdCell(r.name)} | ${mdCell(r.connects)} |`), '');
  out.push(...sectionsMd(design));
  out.push('## BOM', '', '| Cant. | Componente | Función | Notas | Fuente |', '|---|---|---|---|---|');
  out.push(...bom.map((b) => `| ${b.qty ?? '¿?'} | ${mdCell(b.part)} | ${mdCell(b.role)} | ${mdCell(b.notes)} | \`${b.source}\` |`), '');
  out.push('`¿?` = la cantidad no está documentada todavía.', '');
  out.push('## Checklist antes de energizar', '', ...design.checks.map((c) => `- [ ] ${c}`), '');
  return out.join('\n');
}

const row = (cells: string[], tag = 'td'): string => `<tr>${cells.map((c) => `<${tag}>${esc(c)}</${tag}>`).join('')}</tr>`;

/** HTML imprimible (lo usa gen-hardware-pdf para la guía de soldadura). */
export function renderGuideHtml(design: HwDesign, bom: BomItem[], svg: string): string {
  const nets = design.modules.flatMap((m) =>
    design.pins.filter((p) => p.module === m.id).map((p) => row([`GPIO${p.gpio}`, p.signal, p.to, '☐'])));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(fullTitle(design))} — guía de soldadura</title>
<style>body{font:12px/1.4 system-ui,sans-serif;margin:24px;color:#111}h1{font-size:20px}h2{font-size:15px;margin-top:20px}
table{border-collapse:collapse;width:100%;margin:6px 0}td,th{border:1px solid #999;padding:3px 6px;text-align:left;vertical-align:top}
th{background:#eee}.warn{color:#b00020;font-weight:700}svg{width:100%;height:auto}.page{break-before:page}</style></head><body>
<h1>${esc(fullTitle(design))} — guía de soldadura (rev ${esc(design.rev)})</h1>
<p>MCU: <b>${esc(design.mcu)}</b>. ${esc(design.status === 'verified' ? `Pines verificados contra ${design.source}.` : `BORRADOR transcrito de ${design.source}.`)}
Generada desde config/hardware/ por scripts/gen-hardware-pdf.ts.</p>
${design.warnings.map((w) => `<p class="warn">⚠ ${esc(w)}</p>`).join('')}
<h2>Checklist antes de energizar</h2><table>${design.checks.map((c) => row(['☐', c])).join('')}</table>
<h2>Conexiones de señal</h2><table>${row(['GPIO', 'Señal', 'Hacia', '✓'], 'th')}${nets.join('')}</table>
<h2>Alimentación de cada módulo</h2><table>${design.modules.map((m) => row([m.name, m.power + (m.load ? ` · carga: ${m.load}` : '')])).join('')}</table>
<h2>Rieles</h2><table>${design.rails.map((r) => row([r.name, r.connects])).join('')}</table>
${design.sections.map((sec) => `<h2>${esc(sec.title)}</h2>${sec.tip ? `<p>${esc(sec.tip)}</p>` : ''}${sec.rows.length ? `<table>${sec.rows.map((r) => row([r.pin, r.name, r.to, r.note ?? ''])).join('')}</table>` : ''}`).join('')}
<h2>BOM</h2><table>${row(['Cant.', 'Componente', 'Función', 'Notas'], 'th')}${bom.map((b) => row([b.qty === null ? '¿?' : String(b.qty), b.part, b.role, b.notes])).join('')}</table>
<div class="page">${svg}</div></body></html>`;
}
