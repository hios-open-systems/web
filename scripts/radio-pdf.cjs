// Genera el PDF de la guía de radioaficionado desde la versión imprimible (/es/radio/imprimir).
// Uso: npm run build && npm run start, y en otra terminal: npm run radio:pdf [-- http://localhost:3000 [salida.pdf]]
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const path = require('path');

const base = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || path.join(__dirname, '..', 'public', 'downloads', 'radio', 'guia-radioaficionado-novicio.pdf');

// Sólo se oculta el marco del sitio; el estilo del documento vive en components/radio/print/print.module.css.
const CHROME_CSS = `
  .ant-layout-header, .ant-layout-footer, .ant-layout > footer, [class*="footer_"], [class*="signature"] { display: none !important; }
  html, body, .ant-layout, .ant-layout-content { background: #fff !important; }
`;

// <details> se fragmenta mal entre páginas en Chromium: se reemplaza por bloques comunes.
function unwrapDetails() {
  const swap = (el) => { const d = document.createElement('div'); d.className = el.className; for (const a of el.attributes) if (a.name.startsWith('data-')) d.setAttribute(a.name, a.value); d.append(...el.childNodes); el.replaceWith(d); return d; };
  document.querySelectorAll('details').forEach((el) => { const d = swap(el); d.querySelectorAll(':scope > summary').forEach(swap); });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ colorScheme: 'light' });
  await page.goto(`${base}/es/radio/imprimir`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: CHROME_CSS });
  await page.evaluate(unwrapDetails);
  await page.pdf({
    path: out, format: 'A4', printBackground: true, outline: true, tagged: true,
    margin: { top: '15mm', bottom: '16mm', left: '0', right: '0' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:7.5px;width:100%;padding:0 18mm;display:flex;justify-content:space-between;color:#777;font-family:sans-serif"><span>Guía de estudio Novicio · openhios.dev/radio</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  });
  await browser.close();
  console.log('PDF:', out);
})();
