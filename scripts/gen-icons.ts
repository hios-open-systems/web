import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { brandIconSvg, type BrandIconVariant } from '../lib/brandIcon.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Target {
  file: string;
  size: number;
  variant: BrandIconVariant;
}

// Todo vive en public/: son assets estáticos. Si estos PNG se sirvieran desde app/
// (app/icon.png, app/apple-icon.png), Next los trataría como RUTAS y el build de
// Cloudflare falla pidiéndoles `export const runtime = 'edge'`, que un .png no puede tener.
const TARGETS: Target[] = [
  { file: 'public/icons/icon-32.png', size: 32, variant: 'rounded' },
  { file: 'public/icons/apple-touch-icon.png', size: 180, variant: 'square' },
  { file: 'public/icons/icon-192.png', size: 192, variant: 'rounded' },
  { file: 'public/icons/icon-512.png', size: 512, variant: 'rounded' },
  { file: 'public/icons/icon-maskable-512.png', size: 512, variant: 'maskable' },
];

/**
 * Empaqueta un PNG en un contenedor .ico (el formato admite PNG embebido desde Vista).
 * Hace falta un favicon.ico real: sin él, /favicon.ico —que TODO browser pide por
 * defecto— cae en la ruta [locale] y devuelve la página HTML entera con status 200.
 */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

const browser = await chromium.launch();
let icon32: Buffer | null = null;

for (const { file, size, variant } of TARGETS) {
  const svg = brandIconSvg({ variant });
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><style>
       html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${size}px;height:${size}px}
     </style>${svg}`,
    { waitUntil: 'load' },
  );
  const png = await page.screenshot({ omitBackground: true, type: 'png' });
  await page.close();

  const out = resolve(ROOT, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  if (size === 32) icon32 = png;
  console.log(`${file.padEnd(34)} ${size}×${size}\t${variant.padEnd(8)} ${(png.length / 1024).toFixed(1)} KB`);
}

if (icon32) {
  const ico = pngToIco(icon32, 32);
  writeFileSync(resolve(ROOT, 'public/favicon.ico'), ico);
  console.log(`${'public/favicon.ico'.padEnd(34)} 32×32\tico      ${(ico.length / 1024).toFixed(1)} KB`);
}

const svgOut = resolve(ROOT, 'public/icons/icon.svg');
writeFileSync(svgOut, `${brandIconSvg({ variant: 'rounded' })}\n`);
console.log(`${'public/icons/icon.svg'.padEnd(34)} vector\trounded`);

await browser.close();
