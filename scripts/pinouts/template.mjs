/**
 * Shared pinout page generator. Every module HTML is produced from this one
 * template so they are structurally identical and aligned by construction
 * (board + pin columns share the same fixed-height flex rows — a raster photo
 * can never track the DOM, which is why the old WROOM photo drifted).
 */

function contrast(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance — dark text on light chips, light text on dark ones.
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rootVars(categories) {
  return categories.map((c) => `      --cat-${c.key}: ${c.color};`).join('\n');
}

function labelRules(categories) {
  return categories
    .map((c) => `    .pin-label[data-type="${c.key}"] { background: var(--cat-${c.key}); color: ${contrast(c.color)}; }`)
    .join('\n');
}

/**
 * Vector drawing of a 3.5mm audio plug: each conductor (Tip / Ring / Sleeve)
 * is a metal band painted with its pin color, separated by black insulators,
 * with a rounded tip and the body/cable at the bottom. Scales perfectly and
 * tracks the same colors as the pin labels.
 */
/**
 * Connector diagram: a horizontal audio plug with a callout per conductor
 * (a line from each ring up to a colored pill with its function), plus the
 * ring label on each band and any extras (e.g. the jack's detection switch)
 * noted below — so it reads as a real plug, not a column of pins.
 */
function connectorDiagram(segments, extras) {
  const n = segments.length;
  const tipX = 24;
  const domeW = 12;
  const segArea = 170;
  const segW = segArea / n;
  const bodyW = 54;
  const cy = 88;
  const cylH = 34;
  const yCyl = cy - cylH / 2;
  const bodyH = 52;
  const yBody = cy - bodyH / 2;
  const bodyX = tipX + segArea;
  const cableW = 18;
  const W = bodyX + bodyW + cableW + 8;
  const hasExtras = Array.isArray(extras) && extras.length > 0;
  const H = hasExtras ? 168 : 138;

  const parts = [];

  // Callouts above each ring: line + colored pill with the function.
  segments.forEach((seg, i) => {
    const cxSeg = tipX + i * segW + segW / 2;
    const pillY = 12;
    const pillH = 20;
    const pillW = Math.max(30, esc(seg.fn).length * 5.6 + 12);
    parts.push(`<line x1="${cxSeg}" y1="${pillY + pillH}" x2="${cxSeg}" y2="${yCyl}" stroke="${seg.color}" stroke-width="1.4" stroke-opacity="0.55"/>`);
    parts.push(`<rect x="${cxSeg - pillW / 2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="6" fill="${seg.color}"/>`);
    parts.push(`<text x="${cxSeg}" y="${pillY + 14}" text-anchor="middle" font-size="9" font-weight="700" fill="${contrast(seg.color)}" font-family="ui-monospace, monospace">${esc(seg.fn)}</text>`);
  });

  // Plug: cable, grip body, then the colored bands (so bands cover the overlap).
  parts.push(`<rect x="${bodyX + bodyW - 6}" y="${cy - 4}" width="${cableW + 8}" height="8" rx="3" fill="#2b2b2b"/>`);
  parts.push(`<rect x="${bodyX - 6}" y="${yBody}" width="${bodyW + 6}" height="${bodyH}" rx="10" fill="#16181d" stroke="#3a3a3a"/>`);
  parts.push(`<rect x="${bodyX - 6}" y="${yBody}" width="${bodyW + 6}" height="${bodyH}" rx="10" fill="url(#plugShine)" opacity="0.6"/>`);
  parts.push(`<path d="M${bodyX + 10} ${yBody + 8} v ${bodyH - 16} M${bodyX + 22} ${yBody + 8} v ${bodyH - 16} M${bodyX + 34} ${yBody + 8} v ${bodyH - 16}" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>`);

  segments.forEach((seg, i) => {
    const x = tipX + i * segW;
    if (i === 0) {
      const tip = `M${x + domeW} ${yCyl} a ${domeW} ${cylH / 2} 0 0 0 0 ${cylH} h ${segW - domeW} v -${cylH} z`;
      parts.push(`<path d="${tip}" fill="${seg.color}"/><path d="${tip}" fill="url(#plugShine)"/>`);
    } else {
      parts.push(`<rect x="${x}" y="${yCyl}" width="${segW}" height="${cylH}" fill="${seg.color}"/><rect x="${x}" y="${yCyl}" width="${segW}" height="${cylH}" fill="url(#plugShine)"/><rect x="${x - 1.5}" y="${yCyl}" width="3" height="${cylH}" fill="#0a0a0a"/>`);
    }
    parts.push(`<text x="${x + segW / 2}" y="${cy + 3.5}" text-anchor="middle" font-size="11" font-weight="700" fill="${contrast(seg.color)}" font-family="ui-monospace, monospace">${esc(seg.ring)}</text>`);
  });

  // Extras below (e.g. the jack's detection switch — not a ring of the plug).
  if (hasExtras) {
    const ey = cy + bodyH / 2 + 22;
    extras.forEach((ex, i) => {
      const exY = ey + i * 16;
      const col = ex.color || '#f97316';
      parts.push(`<circle cx="${tipX + 5}" cy="${exY - 4}" r="5" fill="none" stroke="${col}" stroke-width="1.5"/>`);
      parts.push(`<text x="${tipX + 16}" y="${exY}" font-size="10" fill="#9ca3af" font-family="ui-monospace, monospace"><tspan font-weight="700" fill="${col}">${esc(ex.label)}</tspan> · ${esc(ex.note)}</text>`);
    });
  }

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Conector de audio">
        <defs>
          <linearGradient id="plugShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#000" stop-opacity="0.42"/>
            <stop offset="0.42" stop-color="#fff" stop-opacity="0.52"/>
            <stop offset="0.6" stop-color="#fff" stop-opacity="0.36"/>
            <stop offset="1" stop-color="#000" stop-opacity="0.46"/>
          </linearGradient>
        </defs>
        ${parts.join('\n        ')}
      </svg>`;
}

/**
 * ESP32 DevKit board: dark PCB with the metal-can module + meander antenna,
 * USB connector, two buttons and unlabeled side headers. Illustrative on
 * purpose — no pin labels that would imply alignment with the pin columns.
 */
function mcuSvg(chip) {
  const W = 116;
  const H = 300;
  const pcbX = 22;
  const pcbW = 72;
  const pcbR = pcbX + pcbW;
  const cx = W / 2;
  const nPads = 16;
  const padTop = 80;
  const padBottom = H - 14;
  const padGap = (padBottom - padTop) / (nPads - 1);
  const pads = [];
  for (let i = 0; i < nPads; i += 1) {
    const py = padTop + i * padGap;
    pads.push(`<circle cx="${pcbX + 6}" cy="${py}" r="3" fill="#0b0b0b" stroke="#333"/>`);
    pads.push(`<circle cx="${pcbR - 6}" cy="${py}" r="3" fill="#0b0b0b" stroke="#333"/>`);
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(chip.name)} DevKit">
        <defs>
          <linearGradient id="mcuMetal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#8a8f96"/>
            <stop offset="0.5" stop-color="#cbcfd4"/>
            <stop offset="1" stop-color="#7e838a"/>
          </linearGradient>
        </defs>
        <rect x="${pcbX}" y="6" width="${pcbW}" height="${H - 12}" rx="7" fill="#15181f" stroke="#2a2f3a"/>
        ${pads.join('')}
        <rect x="${cx - 13}" y="0" width="26" height="16" rx="2" fill="#aeb2b8" stroke="#7c8088"/>
        <rect x="${pcbX + 8}" y="26" width="13" height="13" rx="2" fill="#1b1b1b" stroke="#3a3a3a"/>
        <rect x="${pcbR - 21}" y="26" width="13" height="13" rx="2" fill="#1b1b1b" stroke="#3a3a3a"/>
        <rect x="${pcbX + 10}" y="46" width="${pcbW - 20}" height="9" rx="2" fill="#0e0e0e"/>
        <rect x="${cx - 18}" y="60" width="36" height="22" rx="2" fill="#10131a"/>
        <path d="M${cx - 14} 65 h28 M${cx - 14} 71 h28 M${cx - 14} 77 h28" stroke="#3a4150" stroke-width="2"/>
        <rect x="${pcbX + 8}" y="88" width="${pcbW - 16}" height="158" rx="3" fill="url(#mcuMetal)" stroke="#6b7077"/>
        <text x="${cx}" y="167" text-anchor="middle" font-size="13" font-weight="700" fill="#585d64" font-family="ui-monospace, monospace" transform="rotate(-90 ${cx} 167)">${esc(chip.name)}</text>
      </svg>`;
}

/** SOIC/TSSOP-style chip: dark body with gull-wing pins, a pin-1 dot, name rotated inside. */
function icSvg(name) {
  const W = 80;
  const cx = 40;
  const bodyW = 46;
  const bodyH = 104;
  const x = cx - bodyW / 2;
  const y = 16;
  const perSide = 6;
  const pinW = 12;
  const pinH = 5;
  const span = bodyH - 20;
  const pins = [];
  for (let i = 0; i < perSide; i += 1) {
    const py = y + 10 + (span / (perSide - 1)) * i - pinH / 2;
    pins.push(`<rect x="${x - pinW + 3}" y="${py}" width="${pinW}" height="${pinH}" rx="1.5" fill="#9ca3af"/>`);
    pins.push(`<rect x="${x + bodyW - 3}" y="${py}" width="${pinW}" height="${pinH}" rx="1.5" fill="#9ca3af"/>`);
  }
  return `<svg viewBox="0 0 ${W} ${bodyH + 32}" width="${W}" height="${bodyH + 32}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(name)}">
        <defs>
          <linearGradient id="icBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#1f1f1f"/>
            <stop offset="0.5" stop-color="#3a3a3a"/>
            <stop offset="1" stop-color="#161616"/>
          </linearGradient>
        </defs>
        ${pins.join('')}
        <rect x="${x}" y="${y}" width="${bodyW}" height="${bodyH}" rx="5" fill="url(#icBody)" stroke="#4a4a4a"/>
        <circle cx="${x + 9}" cy="${y + 11}" r="2.8" fill="#777"/>
        <text x="${cx}" y="${y + bodyH / 2}" text-anchor="middle" font-size="11" font-weight="700" fill="#9ca3af" font-family="ui-monospace, monospace" transform="rotate(-90 ${cx} ${y + bodyH / 2})">${esc(name)}</text>
      </svg>`;
}

/** LM2596-style buck module: green PCB with electrolytic cap, shielded inductor, blue trimmer pot and the IC. */
function buckSvg() {
  const W = 92;
  const H = 128;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Modulo buck LM2596">
        <rect x="6" y="6" width="80" height="116" rx="5" fill="#0e3b2e" stroke="#1c6b51"/>
        <rect x="14" y="18" width="26" height="34" rx="12" fill="#181826" stroke="#333"/>
        <ellipse cx="27" cy="20" rx="13" ry="4.5" fill="#26263c"/>
        <rect x="48" y="18" width="30" height="30" rx="4" fill="#161616" stroke="#3a3a3a"/>
        <path d="M54 25 h18 M54 31 h18 M54 37 h18 M54 43 h18" stroke="#555" stroke-width="2.4"/>
        <rect x="14" y="84" width="28" height="28" rx="3" fill="#1e40af" stroke="#1b357f"/>
        <circle cx="28" cy="98" r="9" fill="#d4d9e0"/>
        <line x1="21" y1="98" x2="35" y2="98" stroke="#475569" stroke-width="3"/>
        <rect x="50" y="86" width="30" height="22" rx="2" fill="#14161b" stroke="#333"/>
        <text x="65" y="99" text-anchor="middle" font-size="6.5" fill="#9ca3af" font-family="ui-monospace, monospace">LM2596</text>
      </svg>`;
}

function chipHtml(chip) {
  if (chip.image) {
    return `<div class="chip board">
        <img src="${esc(chip.image)}" alt="${esc(chip.name)}" class="board-img" loading="lazy" />
      </div>`;
  }
  if (chip.type === 'ic') {
    return `<div class="chip ic">
        ${icSvg(chip.name)}
        ${chip.sub ? `<span class="chip-module">${esc(chip.sub)}</span>` : ''}
      </div>`;
  }
  if (chip.type === 'buck') {
    return `<div class="chip buck">
        ${buckSvg()}
        <span class="chip-name">${esc(chip.name)}</span>
        ${chip.sub ? `<span class="chip-module">${esc(chip.sub)}</span>` : ''}
      </div>`;
  }
  if (chip.type === 'mcu') {
    return `<div class="chip mcu">
        ${mcuSvg(chip)}
        ${chip.sub ? `<span class="chip-module">${esc(chip.sub)}</span>` : ''}
      </div>`;
  }
  if (chip.type === 'module') {
    return `<div class="chip module">
        <div class="display">${esc(chip.display ?? '')}</div>
        <span class="chip-name">${esc(chip.name)}</span>
        ${chip.sub ? `<span class="chip-module">${esc(chip.sub)}</span>` : ''}
      </div>`;
  }
  return `<div class="chip ic">
        <div class="ic-notch"></div>
        <span class="chip-name">${esc(chip.name)}</span>
        ${chip.sub ? `<span class="chip-module">${esc(chip.sub)}</span>` : ''}
      </div>`;
}

function pinRow(pin, side) {
  const ordered = side === 'left'
    ? [...pin.labels.filter((l) => !l.primary), ...pin.labels.filter((l) => l.primary)]
    : [...pin.labels.filter((l) => l.primary), ...pin.labels.filter((l) => !l.primary)];
  const types = [...new Set(pin.labels.map((l) => l.type))].join(' ');
  const labels = ordered
    .map((l) => `<span class="pin-label${l.primary ? ' primary' : ''}" data-type="${l.type}">${esc(l.text)}</span>`)
    .join('');
  const num = `<span class="pin-num">${esc(pin.num)}</span>`;
  const labelsSpan = `<span class="pin-labels">${labels}</span>`;
  return `        <div class="pin-row" data-types="${types}">${side === 'left' ? labelsSpan + num : num + labelsSpan}</div>`;
}

export function renderPinout(m) {
  const filters = m.categories
    .map(
      (c) => `        <button class="filter-btn active" data-filter="${c.key}">
          <span class="dot" style="background: var(--cat-${c.key})"></span>${esc(c.label)}
        </button>`,
    )
    .join('\n');

  const allKeys = JSON.stringify(m.categories.map((c) => c.key));

  const info = (m.info ?? [])
    .map(
      (card) => `        <div class="info-card">
          <h4><span class="dot" style="background: ${card.color}"></span>${esc(card.title)}</h4>
          <p>${card.html}</p>
        </div>`,
    )
    .join('\n');

  const isConnector = m.chip.type === 'connector';

  const toolbarHtml = isConnector
    ? ''
    : `<div class="toolbar">
      <div class="toolbar-group">
${filters}
      </div>
      <div class="btn-group">
        <button class="btn-small" onclick="selectAll()">Todos</button>
        <button class="btn-small" onclick="selectNone()">Ninguno</button>
      </div>
    </div>`;

  const centerHtml = isConnector
    ? `<div class="pinout-container connector-diagram">
      ${connectorDiagram(m.chip.segments ?? [], m.chip.extras ?? [])}
    </div>`
    : `<div class="pinout-container">
      <div class="pin-column left">
${m.left.map((p) => pinRow(p, 'left')).join('\n')}
      </div>

      ${chipHtml(m.chip)}

      <div class="pin-column right">
${m.right.map((p) => pinRow(p, 'right')).join('\n')}
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(m.title)} - Pinout Interactivo</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --card: #141414;
      --border: #2a2a2a;
      --text: #e5e5e5;
      --text-dim: #888;
      --accent: #10b981;
${rootVars(m.categories)}
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 20px;
      line-height: 1.5;
      min-height: 100vh;
    }

    .container { max-width: 1100px; margin: 0 auto; }

    header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    h1 { color: var(--accent); font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: var(--text-dim); font-size: 14px; }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      background: var(--accent);
      color: #000;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--card);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .toolbar-group { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }

    .filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: transparent;
      color: var(--text);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover { border-color: var(--accent); }
    .filter-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
    .filter-btn .dot { width: 10px; height: 10px; border-radius: 2px; }

    .btn-group {
      display: flex;
      gap: 4px;
      margin-left: 12px;
      padding-left: 12px;
      border-left: 1px solid var(--border);
    }

    .btn-small {
      padding: 4px 10px;
      font-size: 11px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text-dim);
      cursor: pointer;
    }

    .btn-small:hover { color: var(--text); border-color: var(--accent); }

    .pinout-container {
      display: flex;
      justify-content: center;
      align-items: stretch;
      gap: 0;
      margin: 24px 0;
      overflow-x: auto;
      padding: 20px 0;
    }

    .pinout-container.connector-diagram { align-items: center; padding: 8px 16px 24px; }
    .pinout-container.connector-diagram svg { width: 100%; height: auto; }

    .pin-column { display: flex; flex-direction: column; gap: 1px; }
    .pin-column.left { align-items: flex-end; }
    .pin-column.right { align-items: flex-start; }

    .chip {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      width: 120px;
      background: linear-gradient(180deg, #1f1f1f 0%, #0f0f0f 100%);
      border: 2px solid #333;
      border-radius: 6px;
      padding: 12px 8px;
      position: relative;
    }

    .chip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 12px;
      background: #333;
      border-radius: 0 0 12px 12px;
    }

    .chip.module::before, .chip.board::before, .chip.connector::before, .chip.ic::before, .chip.buck::before, .chip.mcu::before { display: none; }

    .chip.board, .chip.connector, .chip.ic, .chip.buck, .chip.mcu {
      border: none;
      background: transparent;
      width: auto;
      min-width: 120px;
      padding: 0 6px;
      justify-content: center;
      gap: 6px;
    }

    .chip.mcu svg { display: block; height: 100%; width: auto; max-height: 560px; }

    .board-img {
      height: 100%;
      width: auto;
      max-height: 560px;
      object-fit: contain;
      display: block;
      border-radius: 8px;
    }

    .chip.connector svg, .chip.ic svg, .chip.buck svg { display: block; }

    .chip-name { font-size: 12px; font-weight: 700; color: #888; text-align: center; margin-top: 8px; }
    .chip-module { font-size: 9px; color: #555; margin-top: 2px; }

    .antenna {
      width: 45px;
      height: 55px;
      border: 2px solid #444;
      border-radius: 4px;
      margin-bottom: 8px;
      background: repeating-linear-gradient(0deg, #333 0px, #333 2px, transparent 2px, transparent 4px);
    }

    .usb-port {
      width: 30px;
      height: 14px;
      background: #444;
      border-radius: 2px;
      margin-top: 8px;
      position: relative;
    }

    .usb-port::after {
      content: 'USB';
      font-size: 6px;
      color: #666;
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
    }

    .ic-notch {
      width: 26px;
      height: 13px;
      border: 2px solid #444;
      border-top: none;
      border-radius: 0 0 26px 26px;
      margin-bottom: 10px;
    }

    .display {
      width: 84px;
      height: 38px;
      background: #050505;
      border: 1px solid #333;
      border-radius: 4px;
      color: #22c55e;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      box-shadow: inset 0 0 8px rgba(34, 197, 94, 0.25);
    }

    .pin-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      min-height: 24px;
      border-radius: 3px;
      transition: all 0.15s;
      cursor: default;
    }

    .pin-row:hover { background: rgba(255, 255, 255, 0.05); }
    .pin-row.dimmed { opacity: 0.15; }
    .pin-row.highlight { background: rgba(16, 185, 129, 0.15); }

    .pin-num { min-width: 18px; font-size: 10px; font-weight: 600; color: var(--text-dim); text-align: center; }
    .pin-labels { display: flex; gap: 3px; flex-wrap: wrap; }
    .left .pin-labels { justify-content: flex-end; }

    .pin-label {
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      font-family: 'SF Mono', 'Consolas', monospace;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .pin-label.primary { font-weight: 700; font-size: 10px; }

${labelRules(m.categories)}
    .pin-label[data-type="nc"] { background: #333; color: #666; }

    .info-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }

    .info-section h3 { font-size: 14px; color: var(--accent); margin-bottom: 12px; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .info-card { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 12px; }

    .info-card h4 {
      font-size: 12px;
      color: var(--text);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .info-card h4 .dot { width: 8px; height: 8px; border-radius: 2px; }
    .info-card p { font-size: 11px; color: var(--text-dim); line-height: 1.6; }
    .info-card code { background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; font-size: 10px; }

    .print-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      background: var(--accent);
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: var(--text-dim);
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .footer a { color: var(--accent); text-decoration: none; }

    @media print {
      body { background: #fff; color: #000; padding: 10mm; }
      .toolbar, .print-btn { display: none !important; }
      .pin-label { border: 1px solid currentColor; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .chip { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .info-section { background: #f9f9f9; border: 1px solid #ccc; }
      @page { size: A4 landscape; margin: 8mm; }
    }

    @media (max-width: 768px) {
      .pinout-container { transform: scale(0.8); transform-origin: top center; }
      .filter-btn { padding: 5px 8px; font-size: 11px; }
    }
  </style>
</head>

<body>
  <button class="print-btn" onclick="window.print()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
    Imprimir
  </button>

  <div class="container">
    <header>
      <h1>${esc(m.title)}${m.badge ? ` <span class="badge">${esc(m.badge)}</span>` : ''}</h1>
      <p class="subtitle">${esc(m.subtitle)}</p>
    </header>

    ${toolbarHtml}

    ${centerHtml}

    <div class="info-section">
      <h3>Información de Pines · ${esc(m.title)}</h3>
      <div class="info-grid">
${info}
      </div>
    </div>

    <footer class="footer">
      HIOS Pinouts • Inspirado en <a href="https://www.luisllamas.es/en/esp32-hardware-details-pinout/" target="_blank">luisllamas.es</a>
    </footer>
  </div>

  <script>
    const filterBtns = document.querySelectorAll('.filter-btn');
    const pinRows = document.querySelectorAll('.pin-row');
    const allKeys = ${allKeys};
    const activeFilters = new Set(allKeys);

    function updateFilters() {
      pinRows.forEach(row => {
        const types = (row.dataset.types || '').split(' ').filter(Boolean);
        const hasMatch = types.some(t => activeFilters.has(t));
        row.classList.toggle('dimmed', !hasMatch && activeFilters.size > 0);
        row.classList.toggle('highlight', hasMatch && activeFilters.size < allKeys.length);
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        btn.classList.toggle('active');
        if (activeFilters.has(filter)) activeFilters.delete(filter);
        else activeFilters.add(filter);
        updateFilters();
      });
    });

    function selectAll() {
      filterBtns.forEach(btn => { btn.classList.add('active'); activeFilters.add(btn.dataset.filter); });
      updateFilters();
    }

    function selectNone() {
      filterBtns.forEach(btn => { btn.classList.remove('active'); activeFilters.delete(btn.dataset.filter); });
      updateFilters();
    }
  </script>
</body>

</html>
`;
}
