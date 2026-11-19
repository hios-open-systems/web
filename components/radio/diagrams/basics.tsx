// Diagramas estáticos del bloque A. Cada uno muestra una sola idea.

const path = (pts: ReadonlyArray<readonly [number, number]>) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

const sample = (n: number, f: (t: number) => [number, number]) =>
  Array.from({ length: n + 1 }, (_, i) => f(i / n));

function Arrow({ x1, y1, x2, y2, cls = 'thin', one = false }: { x1: number; y1: number; x2: number; y2: number; cls?: string; one?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} markerEnd="url(#ah)" markerStart={one ? undefined : 'url(#ah)'} />;
}

function Defs() {
  return (
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill="currentColor" />
      </marker>
    </defs>
  );
}

export function OhmCircuit() {
  return (
    <svg viewBox="0 0 420 200" role="img" aria-label="Circuito con fuente V, resistencia R y corriente I">
      <Defs />
      <path className="ln" d="M80 92 V40 H340 V70 M340 130 V160 H80 V108" />
      <line x1="60" y1="92" x2="100" y2="92" className="ln" />
      <line x1="70" y1="108" x2="90" y2="108" className="ln" style={{ strokeWidth: 4 }} />
      <text x="104" y="90">+</text>
      <text x="14" y="104">V</text>
      <path className="a2" d="M340 70 l12 5 l-24 10 l24 10 l-24 10 l24 10 l-12 5" />
      <text x="362" y="104">R</text>
      <line x1="180" y1="40" x2="240" y2="40" className="a1" markerEnd="url(#ah)" />
      <text x="200" y="28">I</text>
      <text x="150" y="192" className="muted">I = V / R</text>
    </svg>
  );
}

export function SineAnatomy() {
  const x0 = 50, w = 400, y0 = 115, a = 80;
  const pts = sample(120, (t) => [x0 + t * w, y0 - a * Math.sin(2 * Math.PI * t)]);
  const rms = y0 - a * Math.SQRT1_2;
  return (
    <svg viewBox="0 0 520 240" role="img" aria-label="Un ciclo de senoidal con valor pico, pico a pico, eficaz y período">
      <Defs />
      <line x1={x0} y1={y0} x2={x0 + w + 10} y2={y0} className="thin" />
      <path d={path(pts)} className="a1" />
      <line x1={x0} y1={rms} x2={x0 + w} y2={rms} className="dash" />
      <text x={x0 + w - 120} y={rms - 6} className="muted">Vrms = 0,707·Vp</text>
      <Arrow x1={x0 + w / 4} y1={y0} x2={x0 + w / 4} y2={y0 - a + 4} cls="a2" one />
      <text x={x0 + w / 4 + 8} y={y0 - a / 2}>Vp</text>
      <Arrow x1={x0 + w + 30} y1={y0 - a} x2={x0 + w + 30} y2={y0 + a} />
      <text x={x0 + w + 38} y={y0 + 4}>Vpp</text>
      <Arrow x1={x0} y1={y0 + a + 25} x2={x0 + w} y2={y0 + a + 25} />
      <text x={x0 + w / 2 - 50} y={y0 + a + 42}>T = 1 / f</text>
    </svg>
  );
}

export function Wavelength() {
  const x0 = 30, w = 460, y0 = 90, a = 45;
  const pts = sample(160, (t) => [x0 + t * w, y0 - a * Math.cos(2 * Math.PI * 2 * t)]);
  const crest2 = x0 + w / 2;
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="Onda en el espacio con una longitud de onda marcada entre dos crestas">
      <Defs />
      <line x1={x0} y1={y0} x2={x0 + w} y2={y0} className="thin" />
      <path d={path(pts)} className="a1" />
      <line x1={x0} y1={y0 - a - 20} x2={x0} y2={y0 - a} className="dash" />
      <line x1={crest2} y1={y0 - a - 20} x2={crest2} y2={y0 - a} className="dash" />
      <Arrow x1={x0} y1={y0 - a - 14} x2={crest2} y2={y0 - a - 14} cls="a2" />
      <text x={x0 + w / 4 - 8} y={y0 - a - 22}>λ</text>
      <text x={x0} y={180} className="muted">distancia →   λ (m) = 300 / f (MHz)</text>
    </svg>
  );
}

export function ReactanceVsFrequency() {
  const x0 = 50, y0 = 200, w = 420, h = 170;
  const f0 = 0.4;
  const xl = sample(60, (t) => [x0 + t * w, y0 - (t / f0) * (h / 2)]);
  const xc = sample(60, (t) => {
    const f = f0 / 2 + t * (1 - f0 / 2);
    return [x0 + f * w, y0 - (f0 / f) * (h / 2)];
  });
  return (
    <svg viewBox="0 0 520 240" role="img" aria-label="XL crece con la frecuencia, XC baja; se cruzan en f0">
      <Defs />
      <path className="thin" d={`M${x0} ${y0 - h - 10} V${y0} H${x0 + w + 10}`} />
      <text x={x0 - 30} y={y0 - h}>X</text>
      <text x={x0 + w} y={y0 + 20}>f</text>
      <path d={path(xl.filter(([, y]) => y >= y0 - h))} className="a2" />
      <path d={path(xc)} className="a1" />
      <line x1={x0 + f0 * w} y1={y0 - h / 2} x2={x0 + f0 * w} y2={y0} className="dash" />
      <text x={x0 + f0 * w - 8} y={y0 + 20}>f₀</text>
      <text x={x0 + 0.78 * w} y={y0 - h + 30}>XL = 2πfL</text>
      <text x={x0 + 0.62 * w} y={y0 - 30}>XC = 1/(2πfC)</text>
    </svg>
  );
}

export function ResonanceCurve() {
  const x0 = 50, y0 = 200, w = 420, h = 160, q = 4;
  const amp = (t: number) => {
    const r = (0.3 + t * 1.4);
    return 1 / Math.sqrt(1 + q * q * (r - 1 / r) ** 2);
  };
  const pts = sample(160, (t) => [x0 + t * w, y0 - h * amp(t)]);
  const lvl = y0 - h * Math.SQRT1_2;
  const fx = (r: number) => x0 + ((r - 0.3) / 1.4) * w;
  const half = 1 / (2 * q);
  const lo = fx(Math.sqrt(1 + half * half) - half), hi = fx(Math.sqrt(1 + half * half) + half);
  return (
    <svg viewBox="0 0 520 240" role="img" aria-label="Curva de resonancia con pico en f0 y ancho de banda a −3 dB">
      <Defs />
      <path className="thin" d={`M${x0} ${y0 - h - 10} V${y0} H${x0 + w + 10}`} />
      <path d={path(pts)} className="a1" />
      <line x1={x0} y1={lvl} x2={x0 + w} y2={lvl} className="dash" />
      <text x={x0 + w - 70} y={lvl - 6} className="muted">−3 dB</text>
      <line x1={fx(1)} y1={y0 - h} x2={fx(1)} y2={y0} className="dash" />
      <text x={fx(1) - 8} y={y0 + 20}>f₀</text>
      <Arrow x1={lo} y1={lvl + 14} x2={hi} y2={lvl + 14} cls="a2" />
      <text x={fx(1) - 14} y={lvl + 34}>BW</text>
    </svg>
  );
}
