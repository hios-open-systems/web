// ============================================================================
//  webui-selftest.cjs - Red anti-regresion de la PWA que sirve el pad.
//
//  Extrae el HTML/JS EXACTO del firmware (src/net/WebUi.cpp), lo sirve contra un
//  mock del contrato del pad (/api/config, /api/ui, /api/cmd, /api/config[/reset])
//  y lo maneja con chromium (Playwright) verificando que:
//    - render de capas + estado live del poll
//    - saltar de capa            (POST {layer})
//    - pad virtual 2x5 + encoder (POST {btn}/{enc}) + espejo de tecla fisica
//    - editor: edita nombre/color/labels y PRESERVA acciones/ALT/textos/macros
//    - token X-Pad-Token
//    - cero errores de JS en runtime
//
//  Correr:  npm run test:padwebui   (desde la raiz del repo web)
//  Requiere el navegador de Playwright:  npx playwright install chromium
// ============================================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('✗ Falta Playwright. Instalá deps del repo (npm i) y `npx playwright install chromium`.'); process.exit(2); }

// --- Extrae los bytes reales que sirve el firmware --------------------------
const WEBUI = path.join(__dirname, '../src/net/WebUi.cpp');
const src = fs.readFileSync(WEBUI, 'utf8');
const between = (s, open, close) => {
  const i = s.indexOf(open); const j = i < 0 ? -1 : s.indexOf(close, i + open.length);
  if (i < 0 || j < 0) throw new Error(`no encontré ${open}…${close} en WebUi.cpp`);
  return s.slice(i + open.length, j);
};
const PAGE = between(src, 'R"HTML(', ')HTML"');
const MANIFEST = between(src, 'R"JSON(', ')JSON"');

// --- Mock del pad -----------------------------------------------------------
const LAYERS = [
  { n: 'Edición', color: 0x07FF, group: 0 }, { n: 'Dev', color: 0x07E0, group: 0 },
  { n: 'Apps', color: 0xFFE0, group: 0 }, { n: 'Multimedia', color: 0xF81F, group: 1 },
  { n: 'Navegador', color: 0x001F, group: 2 }, { n: 'Meet', color: 0xFD20, group: 3 },
  { n: 'RGB', color: 0xF800, group: 4 },
];
const fullCfg = () => ({
  v: 1,
  layers: LAYERS.map(L => ({
    n: L.n, color: L.color, group: L.group,
    binds: [
      { id: 0, label: 'Copiar', press: { t: 'key', mods: 1, k: [6] } },
      { id: 1, label: 'Pegar', press: { t: 'key', mods: 1, k: [25] } },
      { id: 14, label: 'Volumen', cw: { t: 'media', u: 1 }, ccw: { t: 'media', u: 2 } },
    ],
  })),
  alt: { alt1: 'Launcher', alt2: 'Macros', linger: 600 },
  texts: ['hola', 'chau'],
  macros: [{ label: 'm1', steps: [{ kind: 0, action: { t: 'key', mods: 0, k: [4] } }] }],
});
const LABELS = ['Copiar', 'Pegar', 'Cortar', 'Deshacer', 'Rehacer', 'Buscar', 'Guardar', 'Nuevo', 'Cerrar', 'Abrir',
                'ALT1', 'ALT2', 'Menú', 'Click', 'Volumen', 'Mouse'];
const st = { active: 0, em: 0, pressedMask: 0, requireToken: null, lastCmd: null, savedCfg: null, reset: false, tokenSeen: [] };
const uiBlob = () => {
  const L = LAYERS[st.active];
  return {
    b: st.pressedMask, lay: st.active, enc: 12, sx: 2048, sy: 2048, mo: false, cf: 0, em: st.em, alt: 0,
    mic: true, cam: false, med: true, vol: 42, tp: 5, wOff: false, bat: 255,
    live: true, cpuT: 55, gpuT: 48, cpuL: 30, gpuL: 20, wOn: false, wBr: 0, wRoom: '', wTgt: '',
    layer: { i: st.active, n: L.n, color: L.color, group: L.group, count: LAYERS.length, labels: LABELS },
  };
};
const authOk = (req) => !st.requireToken || req.headers['x-pad-token'] === st.requireToken;
const server = http.createServer((req, res) => {
  const send = (c, t, b) => { res.writeHead(c, { 'Content-Type': t }); res.end(b); };
  if (req.url.startsWith('/api/')) st.tokenSeen.push({ url: req.url, tok: req.headers['x-pad-token'] || null });
  if (req.url === '/' || req.url === '/index.html') return send(200, 'text/html', PAGE);
  if (req.url === '/manifest.webmanifest') return send(200, 'application/manifest+json', MANIFEST);
  if (req.url.startsWith('/api/') && !authOk(req)) return send(401, 'text/plain', 'unauthorized');
  if (req.url === '/api/config' && req.method === 'GET') return send(200, 'application/json', JSON.stringify(fullCfg()));
  if (req.url === '/api/ui') return send(200, 'application/json', JSON.stringify(uiBlob()));
  if (req.url === '/api/config' && req.method === 'POST') { let b = ''; req.on('data', d => b += d); req.on('end', () => { try { st.savedCfg = JSON.parse(b); } catch {} send(200, 'application/json', '{"ok":true}'); }); return; }
  if (req.url === '/api/config/reset' && req.method === 'POST') { st.reset = true; return send(200, 'application/json', '{"ok":true}'); }
  if (req.url === '/api/cmd' && req.method === 'POST') { let b = ''; req.on('data', d => b += d); req.on('end', () => { try { const j = JSON.parse(b); st.lastCmd = j; if (Number.isInteger(j.layer)) st.active = j.layer; } catch {} send(200, 'application/json', '{"ok":true}'); }); return; }
  send(404, 'text/plain', 'nope');
});

// --- Test -------------------------------------------------------------------
const fails = [];
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails.push(msg); };
const PORT = 8791;

(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { console.error('✗ No pude lanzar chromium. Corré `npx playwright install chromium`.\n', String(e)); process.exit(2); }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); });
  const waitPost = (p) => page.waitForRequest(r => r.url().endsWith(p) && r.method() === 'POST', { timeout: 3000 });

  console.log('\n[1] Carga + capas'); await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#layers .lay', { timeout: 4000 });
  ok((await page.$$eval('#layers .lay', e => e.length)) === 7, 'renderiza 7 capas');

  console.log('\n[2] Poll /api/ui');
  await page.waitForFunction(() => document.querySelector('#layName').textContent === 'Edición', null, { timeout: 3000 }).catch(() => {});
  ok((await page.textContent('#layName')) === 'Edición', 'banner = capa activa');
  ok(await page.$eval('#live', e => e.classList.contains('on')), 'punto live encendido');
  ok(await page.$eval('#cUSB', e => e.classList.contains('on')) && !(await page.$eval('#cBLE', e => e.classList.contains('on'))), 'chips transporte (USB on, BLE off)');
  ok((await page.$eval('#layers .lay[data-i="0"] .bar', e => getComputedStyle(e).backgroundColor)) === 'rgb(0, 255, 255)', 'bar capa 0 = cyan (RGB565)');

  console.log('\n[3] Saltar de capa');
  const [rq] = await Promise.all([waitPost('/api/cmd'), page.click('#layers .lay[data-i="3"]')]);
  ok(JSON.parse(rq.postData() || '{}').layer === 3, 'POST {layer:3}');
  await page.waitForFunction(() => document.querySelector('#layName').textContent === 'Multimedia', null, { timeout: 3000 }).catch(() => {});
  ok((await page.textContent('#layName')) === 'Multimedia', 'banner cambió tras el poll');

  console.log('\n[4] Pad virtual');
  const caps = await page.$$eval('#pad .cap', els => els.map(e => ({ num: e.querySelector('.num').textContent, cl: e.querySelector('.cl').textContent })));
  ok(caps.length === 10 && caps.every((c, i) => c.num === String(i + 1)), '10 keycaps numeradas 1..10');
  ok(caps[0].cl === 'Copiar' && caps[9].cl === 'Abrir', 'labels de la capa pobladas');
  const [rb] = await Promise.all([waitPost('/api/cmd'), page.click('#pad .cap[data-i="4"]')]);
  ok(JSON.parse(rb.postData() || '{}').btn === 4, 'tap keycap #5 -> POST {btn:4}');
  const [re] = await Promise.all([waitPost('/api/cmd'), page.click('#encUp')]);
  ok(JSON.parse(re.postData() || '{}').enc === 1, 'encoder + -> POST {enc:1}');
  st.pressedMask = 1 << 2;
  await page.waitForFunction(() => document.querySelector('#pad .cap[data-i="2"]').classList.contains('down'), null, { timeout: 2000 }).catch(() => {});
  ok(await page.$eval('#pad .cap[data-i="2"]', e => e.classList.contains('down')), 'espejo: tecla física ilumina la virtual');
  st.pressedMask = 0;

  console.log('\n[5] Editor (edita + PRESERVA)');
  await page.click('#edit');
  ok(await page.$eval('#editor', e => !e.hidden) && await page.$eval('#control', e => e.hidden), 'editor visible, control oculto');
  await page.selectOption('#edLayer', '0');
  ok((await page.inputValue('#edName')) === 'Edición', 'carga nombre de capa');
  ok((await page.$$eval('#edLabels input', e => e.length)) === 11, '11 slots (10 teclas + encoder)');
  ok((await page.inputValue('#edLabels input[data-id="0"]')) === 'Copiar', 'carga label Tecla 1');
  await page.fill('#edName', 'EdiciónX');
  await page.fill('#edLabels input[data-id="0"]', 'NUEVO');
  await page.evaluate(() => { document.querySelector('#edColor').value = '#ff0000'; });
  const [rs] = await Promise.all([waitPost('/api/config'), page.click('#edSave')]);
  const saved = JSON.parse(rs.postData() || '{}');
  ok(saved.layers[0].n === 'EdiciónX', 'guarda nombre editado');
  ok(saved.layers[0].color === 63488, 'guarda color (#ff0000 -> 63488)');
  const b0 = (saved.layers[0].binds || []).find(b => b.id === 0);
  ok(b0 && b0.label === 'NUEVO', 'guarda label editado');
  ok(b0 && b0.press && b0.press.t === 'key' && b0.press.mods === 1, 'PRESERVA la acción del bind');
  ok(saved.alt && saved.alt.alt1 === 'Launcher' && Array.isArray(saved.texts) && saved.texts.length === 2 && Array.isArray(saved.macros) && saved.macros.length === 1, 'PRESERVA alt/textos/macros verbatim');
  page.once('dialog', d => d.accept());
  await page.click('#edit');
  const [, ] = await Promise.all([waitPost('/api/config/reset'), page.click('#edReset')]);
  ok(st.reset === true, 'Reset de fábrica -> POST /api/config/reset');

  console.log('\n[6] Token');
  await page.click('#gear'); await page.fill('#tokIn', 'secreto');
  st.requireToken = 'secreto'; st.tokenSeen = [];
  await page.click('#tokSave'); await page.waitForTimeout(900);
  ok(st.tokenSeen.filter(r => r.tok === 'secreto').length > 0 && st.tokenSeen.filter(r => r.tok === null).length === 0, 'todos los requests llevan X-Pad-Token');

  console.log('\n[7] Runtime');
  ok(errs.length === 0, 'sin errores de JS' + (errs.length ? ': ' + errs.join(' | ') : ''));

  await browser.close(); server.close();
  console.log('\n' + (fails.length ? `❌ ${fails.length} fallo(s):\n - ` + fails.join('\n - ') : '✅ PWA del pad: todos los checks pasaron'));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
