export const BRAND_ACCENT = '#f59e0b';

const GLOW_CYAN = '#0ea5e9';
const BG_TOP = '#050816';
const BG_BOTTOM = '#0f172a';

const SIZE = 512;
const CENTER = SIZE / 2;

/**
 * rounded  — esquinas redondeadas propias (favicon, manifest `purpose: any`)
 * square   — full-bleed sin radio: iOS le aplica su propia máscara al apple-touch-icon
 * maskable — full-bleed y glifo reducido, para entrar en la safe zone circular de Android
 */
export type BrandIconVariant = 'rounded' | 'square' | 'maskable';

interface BrandIconOptions {
  accent?: string;
  variant?: BrandIconVariant;
}

const RADIUS: Record<BrandIconVariant, number> = { rounded: 114, square: 0, maskable: 0 };
const GLYPH_SCALE: Record<BrandIconVariant, number> = { rounded: 1, square: 1, maskable: 0.76 };

/**
 * Marca HIOS como SVG. La "H" son rects y no <text>: un <text> dependería de la
 * fuente del sistema y renderizaría distinto en cada OS.
 */
export function brandIconSvg({ accent = BRAND_ACCENT, variant = 'rounded' }: BrandIconOptions = {}): string {
  const radius = RADIUS[variant];
  const scale = GLYPH_SCALE[variant];

  const w = 196 * scale;
  const h = 228 * scale;
  const bw = 38 * scale;
  const ch = 36 * scale;
  const r = 9 * scale;

  // el travesaño va apenas sobre el centro geométrico: corrección óptica, si no
  // la letra se ve caída
  const opticalLift = 6 * scale;

  const left = CENTER - w / 2;
  const top = CENTER - h / 2;
  const rightBar = CENTER + w / 2 - bw;
  const crossX = left + bw;
  const crossY = CENTER - ch / 2 - opticalLift;
  const crossW = w - bw * 2;

  const glyph = `
    <rect x="${left}" y="${top}" width="${bw}" height="${h}" rx="${r}" fill="${accent}"/>
    <rect x="${rightBar}" y="${top}" width="${bw}" height="${h}" rx="${r}" fill="${accent}"/>
    <rect x="${crossX}" y="${crossY}" width="${crossW}" height="${ch}" rx="${r}" fill="${accent}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glowCyan" cx="0.18" cy="0.16" r="0.62">
      <stop offset="0%" stop-color="${GLOW_CYAN}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${GLOW_CYAN}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowAccent" cx="0.84" cy="0.86" r="0.66">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" rx="${radius}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${radius}" fill="url(#glowCyan)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${radius}" fill="url(#glowAccent)"/>

  <g filter="url(#halo)" opacity="0.5">${glyph}
  </g>
  <g>${glyph}
  </g>
</svg>`;
}

export function brandIconDataUri(accent: string = BRAND_ACCENT): string {
  return `data:image/svg+xml,${encodeURIComponent(brandIconSvg({ accent }))}`;
}
