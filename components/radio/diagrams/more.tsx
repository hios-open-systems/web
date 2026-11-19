// Diagramas estáticos de los bloques A–C. Cada uno muestra una sola idea.

const path = (pts: ReadonlyArray<readonly [number, number]>) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const sample = (n: number, f: (t: number) => [number, number]) => Array.from({ length: n + 1 }, (_, i) => f(i / n));

function Head() {
  return (
    <defs>
      <marker id="ah2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill="currentColor" />
      </marker>
    </defs>
  );
}

/** Pasa-bajos: deja pasar f, atenúa 2f y 3f. */
export function LowPassResponse() {
  const x0 = 50, y0 = 30, w = 420, h = 160, fc = 0.42;
  const pts = sample(120, (t) => [x0 + t * w, y0 + h * (1 - 1 / Math.sqrt(1 + (t / fc) ** 10))]);
  const marks: ReadonlyArray<[number, string]> = [[0.3, 'f'], [0.6, '2f'], [0.9, '3f']];
  return (
    <svg viewBox="0 0 520 230" role="img" aria-label="Respuesta de un filtro pasa bajos: la fundamental pasa y las armónicas se atenúan">
      <path className="thin" d={`M${x0} ${y0 - 10} V${y0 + h} H${x0 + w + 10}`} />
      <path d={path(pts)} className="a1" />
      <line x1={x0 + fc * w} y1={y0} x2={x0 + fc * w} y2={y0 + h} className="dash" />
      <text x={x0 + fc * w - 10} y={y0 + h + 18}>fc</text>
      {marks.map(([t, l]) => (
        <g key={l}>
          <line x1={x0 + t * w} y1={y0 + h} x2={x0 + t * w} y2={y0 + h - 40} className="a2" />
          <text x={x0 + t * w - 6} y={y0 + h - 46}>{l}</text>
        </g>
      ))}
      <text x={x0 + 4} y={y0 + 14} className="muted">pasa</text>
      <text x={x0 + w - 70} y={y0 + h - 60} className="muted">atenúa</text>
      <text x={x0 + w} y={y0 + h + 18}>f</text>
    </svg>
  );
}

/** Espectro de AM (portadora + 2 bandas laterales) contra SSB (una banda lateral). */
export function SpectrumAmSsb() {
  const base = 90, x = (f: number, off: number) => off + f * 26;
  const bar = (cx: number, hgt: number, cls: string, wd = 8) => <rect x={cx - wd / 2} y={base - hgt} width={wd} height={hgt} className={cls} />;
  const sb = (off: number, from: number, to: number) => <rect x={x(from, off)} y={base - 38} width={(to - from) * 26} height={38} className="fa1" opacity={0.55} />;
  return (
    <svg viewBox="0 0 520 130" role="img" aria-label="AM tiene portadora y dos bandas laterales; SSB tiene una sola banda lateral">
      {[[20, 'AM'], [280, 'SSB (USB)']].map(([off, l]) => (
        <g key={l as string}>
          <line x1={off as number} y1={base} x2={(off as number) + 220} y2={base} className="thin" />
          <text x={(off as number) + 80} y={122}>{l}</text>
        </g>
      ))}
      {sb(20, 1, 3.6)}{bar(x(4.2, 20), 70, 'fa2')}{sb(20, 4.8, 7.4)}
      <text x={x(3.6, 20)} y={14} className="muted">portadora</text>
      {sb(280, 4.8, 7.4)}
      <line x1={x(4.2, 280)} y1={base} x2={x(4.2, 280)} y2={base - 70} className="dash" />
      <text x={x(4.2, 280) - 54} y={14} className="muted">sin portadora</text>
    </svg>
  );
}

/** Cadena de bloques horizontal (receptor, transmisor). */
export function BlockChain({ blocks, label }: { blocks: ReadonlyArray<string>; label: string }) {
  const bw = 92, gap = 22, h = 46, y = 20;
  const width = blocks.length * bw + (blocks.length - 1) * gap + 20;
  return (
    <svg viewBox={`0 0 ${width} 90`} role="img" aria-label={label}>
      <Head />
      {blocks.map((b, i) => {
        const x = 10 + i * (bw + gap);
        return (
          <g key={b}>
            <rect x={x} y={y} width={bw} height={h} rx={8} className="ln" />
            <text x={x + bw / 2} y={y + h / 2 + 5} textAnchor="middle" style={{ fontSize: 12 }}>{b}</text>
            {i < blocks.length - 1 ? <line x1={x + bw} y1={y + h / 2} x2={x + bw + gap - 3} y2={y + h / 2} className="ln" markerEnd="url(#ah2)" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** Onda incidente y reflejada en una línea mal adaptada. */
export function Reflection() {
  return (
    <svg viewBox="0 0 520 150" role="img" aria-label="Si la carga no es igual a Z0 parte de la potencia vuelve hacia el transmisor">
      <Head />
      <rect x={20} y={50} width={70} height={46} rx={6} className="ln" />
      <text x={34} y={78}>TX</text>
      <line x1={90} y1={64} x2={400} y2={64} className="ln" />
      <line x1={90} y1={82} x2={400} y2={82} className="ln" />
      <text x={220} y={104} className="muted">línea Z₀ = 50 Ω</text>
      <path className="a2" d="M400 64 l10 0 l6 -8 l-12 -6 l12 -6 l-12 -6 l6 -4 M400 82 l16 0" />
      <text x={426} y={78}>Z ≠ 50 Ω</text>
      <line x1={130} y1={40} x2={330} y2={40} className="a1" markerEnd="url(#ah2)" />
      <text x={190} y={30}>incidente</text>
      <line x1={330} y1={124} x2={170} y2={124} className="a2" markerEnd="url(#ah2)" />
      <text x={200} y={144}>reflejada</text>
    </svg>
  );
}

/** Dipolo λ/2 y su diagrama de radiación en ocho (vista desde arriba). */
export function DipolePattern() {
  const cx = 380, cy = 95, r = 70;
  const pts = sample(180, (t) => {
    const th = t * 2 * Math.PI, g = Math.abs(Math.cos(th));
    return [cx + r * g * Math.cos(th), cy + r * g * Math.sin(th)];
  });
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="Dipolo de media onda alimentado al centro y su diagrama de radiación en forma de ocho">
      <Head />
      <line x1={30} y1={95} x2={110} y2={95} className="a2" />
      <line x1={130} y1={95} x2={210} y2={95} className="a2" />
      <line x1={110} y1={95} x2={110} y2={150} className="thin" /><line x1={130} y1={95} x2={130} y2={150} className="thin" />
      <text x={86} y={170} className="muted">alimentación</text>
      <line x1={30} y1={70} x2={210} y2={70} className="thin" markerEnd="url(#ah2)" markerStart="url(#ah2)" />
      <text x={104} y={62}>λ/2</text>
      <line x1={cx} y1={cy - 85} x2={cx} y2={cy + 85} className="dash" />
      <text x={cx + 6} y={cy - 74} className="muted">eje del dipolo</text>
      <path d={path(pts)} className="a1" />
      <text x={cx + r + 6} y={cy + 4} className="muted">máx.</text>
    </svg>
  );
}

/** Onda ionosférica: salto en la capa F. */
export function Skywave() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="La onda sube, se refracta en la ionosfera y vuelve a tierra lejos del transmisor">
      <path className="thin" d="M10 165 Q260 140 510 165" />
      <path className="dash" d="M10 40 Q260 15 510 40" />
      <text x={20} y={34} className="muted">capa F (≈ 200–400 km)</text>
      <path className="dash" d="M10 85 Q260 65 510 85" />
      <text x={20} y={80} className="muted">capa D: absorbe de día</text>
      <path className="a1" d="M60 160 L260 28 L460 160" />
      <circle cx={60} cy={160} r={5} className="fa2" /><circle cx={460} cy={160} r={5} className="fa2" />
      <text x={40} y={184}>TX</text><text x={445} y={184}>RX</text>
      <text x={200} y={150} className="muted">zona de silencio</text>
    </svg>
  );
}

/** Horizonte radioeléctrico: la curvatura de la Tierra limita la línea de vista. */
export function Horizon() {
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="Dos antenas sobre la curvatura de la Tierra: a mayor altura, mayor alcance">
      <path className="ln" d="M10 150 Q260 90 510 150" />
      <line x1={70} y1={137} x2={70} y2={80} className="a2" /><line x1={450} y1={137} x2={450} y2={95} className="a2" />
      <text x={76} y={96}>h₁</text><text x={424} y={110}>h₂</text>
      <line x1={70} y1={80} x2={450} y2={95} className="a1" />
      <text x={160} y={70} className="muted">línea de vista</text>
      <text x={150} y={166} className="muted">d (km) ≈ 4,12 · (√h₁ + √h₂)</text>
    </svg>
  );
}
