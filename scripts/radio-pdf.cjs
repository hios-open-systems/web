// Genera el PDF de estudio de la guía de radioaficionado a partir de las páginas ya construidas.
// Uso: npm run build && npx next start -p 3123 &  luego  node scripts/radio-pdf.cjs http://localhost:3123
// Requiere Playwright (Chromium) y pdfunite (poppler-utils).
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const base = process.argv[2] || 'http://localhost:3123';
const out = process.argv[3] || path.join(__dirname, '..', 'public', 'downloads', 'radio', 'guia-radioaficionado-novicio.pdf');
const pages = ['', '/a-electricidad', '/b-modulacion-equipos', '/c-antenas-propagacion', '/d-reglamento'];
const PRINT_CSS = `
  .ant-layout > header, .ant-layout-header, .ant-layout > footer, .ant-layout-footer, body > div > footer,
  [class*="footer_"], [class*="signature"], nav, [class*="toc"], [class*="pager"], [class*="sim"], [class*="tools"], [class*="notice"] { display: none !important; }
  [class*="layout"] { display: block !important; }
  figure, table, [class*="eq"], [class*="example"], [class*="key"], [class*="def"] { break-inside: avoid; }
  section { break-inside: auto; }
  h1, h2, h3, [class*="kicker"] { break-after: avoid; }
  main *, main { overflow: visible !important; }
  [class*="teach_plan__"], [class*="teach_defs"] { display: block !important; }
  [class*="planBand"] { margin-bottom: 6px; }
  [class*="radio_section"], [class*="radio_content"] { display: block !important; }
  [class*="radio_section"] > * + * { margin-top: 14px; }
  [class*="radio_content"] > * + * { margin-top: 32px; }
  [class*="planBand"] > div:first-child { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 10px 14px; font-weight: 600; }
  a { color: inherit !important; text-decoration: none !important; }
`;

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'radio-pdf-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ colorScheme: 'light' });
  const parts = [];
  for (const [i, p] of pages.entries()) {
    await page.goto(`${base}/es/radio${p}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; document.querySelectorAll('details').forEach((d) => { const div = document.createElement('div'); div.className = d.className; div.append(...d.childNodes); d.replaceWith(div); div.querySelectorAll(':scope > summary').forEach((s) => { const h = document.createElement('div'); h.className = s.className; h.append(...s.childNodes); s.replaceWith(h); }); }); });
    await page.addStyleTag({ content: PRINT_CSS });
    const file = path.join(tmp, `${i}.pdf`);
    await page.pdf({
      path: file, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">openhios.dev/radio · Guía de estudio Novicio · <span class="pageNumber"></span></div>',
    });
    parts.push(file);
  }
  await browser.close();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('pdfunite', [...parts, out]);
  console.log('PDF:', out, Math.round(fs.statSync(out).size / 1024), 'KB');
})();
