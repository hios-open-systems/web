// Regenera las imágenes OpenGraph estáticas en public/og/<locale>.png desde el
// mismo template que antes vivía en app/[locale]/opengraph-image.tsx.
//
// Se sacó ese route de la app porque next/og (satori+resvg ~1.4MB) quedaba
// embebido en el bundle del Worker y engordaba el cold-start (causa del Error
// 1102). Ahora las OG son estáticas (servidas desde ASSETS) y next/og es solo
// una dependencia de build/dev.
//
// Correr tras cambiar Hero.title / Hero.subtitle en messages/*.json:
//   node scripts/gen-og.mjs

import { ImageResponse } from 'next/og.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createElement as h } from 'react';

const LOCALES = ['en', 'es', 'de', 'it'];
const SIZE = { width: 1200, height: 630 };
const OUT_DIR = new URL('../public/og/', import.meta.url);

mkdirSync(OUT_DIR, { recursive: true });

for (const locale of LOCALES) {
  const msgs = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'));
  const title = msgs.Hero?.title ?? 'HIOS';
  const subtitle = msgs.Hero?.subtitle ?? '';

  const element = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: 'linear-gradient(135deg,#0b1220 0%,#0f172a 60%,#1e1b4b 100%)',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      },
    },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 16 } },
      h(
        'div',
        {
          style: {
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b1220',
            fontSize: 28,
            fontWeight: 800,
          },
        },
        'H',
      ),
      h('div', { style: { fontSize: 30, fontWeight: 700, letterSpacing: 1 } }, 'HIOS'),
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
      h('div', { style: { fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 } }, title),
      h('div', { style: { fontSize: 30, color: '#94a3b8', maxWidth: 900 } }, subtitle),
    ),
    h('div', { style: { fontSize: 24, color: '#cbd5e1' } }, 'openhios.dev · local-first · open source'),
  );

  const res = new ImageResponse(element, SIZE);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(new URL(`../public/og/${locale}.png`, import.meta.url), buf);
  console.log(`  public/og/${locale}.png (${buf.length} bytes)`);
}
