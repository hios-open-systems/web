// ============================================================================
//  monitor.cpp - ver monitor.h. Dibujo PARCIAL directo: chrome (marcos/labels)
//  se pinta en el full; los valores se redibujan solo si cambiaron, con clear
//  localizado (sin fillScreen, sin push full-screen).
// ============================================================================
#include "monitor.h"
#include "Layout.h"
#include "../app/Theme.h"
#include <string.h>

namespace monitor {

// --- historial para los sparklines (~1 muestra por update del companion) ---
static const int HN = 56;
static uint8_t  s_hist[4][HN];  // 0=cpuT 1=gpuT 2=cpuL 3=gpuL (0..100, 255=s/d)
static int      s_histHead = 0, s_histCount = 0;
static uint16_t s_net[2][HN];   // 0=down 1=up (KB/s, cap 65535)
static int      s_netHead = 0, s_netCount = 0;
static uint16_t s_disk[2][HN];  // 0=lectura 1=escritura (KB/s, cap 65535)
static int      s_diskHead = 0, s_diskCount = 0;

static uint8_t normTempPct(int16_t t) {            // 30..95C -> 0..100; 255 = s/d
  if (t <= -1000) return 255;
  int v = (int)(t - 30) * 100 / (95 - 30);
  return (uint8_t)(v < 0 ? 0 : (v > 100 ? 100 : v));
}
static void pushSensorHist(const UiSnapshot& s) {
  s_hist[0][s_histHead] = normTempPct(s.cpuTemp);
  s_hist[1][s_histHead] = normTempPct(s.gpuTemp);
  s_hist[2][s_histHead] = s.cpuLoad;
  s_hist[3][s_histHead] = s.gpuLoad;
  s_histHead = (s_histHead + 1) % HN;
  if (s_histCount < HN) s_histCount++;
}
static void pushNetHist(const UiSnapshot& s) {
  s_net[0][s_netHead] = s.netDown == 0xFFFFFFFF ? 0 : (uint16_t)(s.netDown > 65535 ? 65535 : s.netDown);
  s_net[1][s_netHead] = s.netUp   == 0xFFFFFFFF ? 0 : (uint16_t)(s.netUp   > 65535 ? 65535 : s.netUp);
  s_netHead = (s_netHead + 1) % HN;
  if (s_netCount < HN) s_netCount++;
}
static void pushDiskHist(const UiSnapshot& s) {
  s_disk[0][s_diskHead] = s.diskRd == 0xFFFFFFFF ? 0 : (uint16_t)(s.diskRd > 65535 ? 65535 : s.diskRd);
  s_disk[1][s_diskHead] = s.diskWr == 0xFFFFFFFF ? 0 : (uint16_t)(s.diskWr > 65535 ? 65535 : s.diskWr);
  s_diskHead = (s_diskHead + 1) % HN;
  if (s_diskCount < HN) s_diskCount++;
}

// Sparkline 0..100 (temps/cargas). Mas nuevo a la derecha; corta la linea en s/d.
static void drawSpark(TFT_eSPI& g, int metric, int spx, int spy, int spw, int sph, uint16_t col) {
  int n = s_histCount;
  if (n < 2) return;
  g.drawFastHLine(spx, spy + sph, spw, theme::EDGE);
  const uint8_t* h = s_hist[metric];
  int px = -1, py = -1;
  for (int k = 0; k < n; k++) {
    int idx = (s_histHead - n + k + HN * 2) % HN;
    uint8_t v = h[idx];
    if (v == 255) { px = -1; continue; }
    int sx = spx + spw - (n - 1 - k) * spw / (HN - 1);
    int sy = spy + sph - (int)v * sph / 100;
    if (px >= 0) g.drawLine(px, py, sx, sy, col);
    px = sx; py = sy;
  }
}
// Sparkline de throughput (red/disco): auto-escala al maximo de la ventana.
static void drawRateSpark(TFT_eSPI& g, const uint16_t* row, int head, int count,
                          int spx, int spy, int spw, int sph, uint16_t col) {
  g.drawFastHLine(spx, spy + sph, spw, theme::EDGE);
  if (count < 2) return;
  uint16_t mx = 1;
  for (int k = 0; k < count; k++) { int i = (head - count + k + HN * 2) % HN; if (row[i] > mx) mx = row[i]; }
  int px = -1, py = -1;
  for (int k = 0; k < count; k++) {
    int i = (head - count + k + HN * 2) % HN;
    int sx = spx + spw - (count - 1 - k) * spw / (HN - 1);
    int sy = spy + sph - (int)row[i] * sph / mx;
    if (px >= 0) g.drawLine(px, py, sx, sy, col);
    px = sx; py = sy;
  }
}

// --- color/format helpers ---
static uint16_t loadColor(uint8_t v) { return v >= 90 ? theme::RED : (v >= 70 ? theme::YELLOW : theme::GREEN); }
static uint16_t tempColor(int16_t t) { return t >= 80 ? theme::RED : (t >= 65 ? theme::YELLOW : theme::GREEN); }
static uint16_t pctColor(int p)      { return p >= 90 ? theme::RED : (p >= 75 ? theme::YELLOW : theme::CYAN); }
static void fmtRate(uint32_t kbs, char* num, size_t n, const char** unit) {
  if (kbs == 0xFFFFFFFF) { strncpy(num, "s/d", n); num[n - 1] = 0; *unit = ""; return; }
  if (kbs >= 1024) { unsigned long t = (kbs * 10UL) / 1024; snprintf(num, n, "%lu.%lu", t / 10, t % 10); *unit = "MB/s"; }
  else { snprintf(num, n, "%lu", (unsigned long)kbs); *unit = "KB/s"; }
}

// --- chrome / cells compartidos ---
static void title(TFT_eSPI& g, const char* t, uint16_t col, const char* clk) {
  g.setTextDatum(TL_DATUM); g.setTextColor(col, theme::BG);       g.drawString(t, 16, 14, 4);
  g.setTextDatum(TR_DATUM); g.setTextColor(theme::FG, theme::BG); g.drawString(clk, 464, 14, 4);
  g.setTextDatum(TL_DATUM);
}
static void livePill(TFT_eSPI& g, bool live) {
  uint16_t pc = live ? theme::GREEN : theme::DIM;
  const int px = 232, pw = 84;
  g.fillRoundRect(px, 16, pw, 22, 11, theme::blend(theme::BG, pc, 50));
  g.drawRoundRect(px, 16, pw, 22, 11, pc);
  g.setTextDatum(MC_DATUM); g.setTextColor(pc, theme::blend(theme::BG, pc, 50));
  g.drawString(live ? "LIVE" : "sin PC", px + pw / 2, 27, 2);
  g.setTextDatum(TL_DATUM);
}
static void cardChrome(TFT_eSPI& g, int x, int y, int w, int h, const char* name) {
  g.fillRoundRect(x, y, w, h, 12, theme::CARD);
  g.drawRoundRect(x, y, w, h, 12, theme::EDGE);
  g.setTextDatum(TL_DATUM); g.setTextColor(theme::SOFT, theme::CARD); g.drawString(name, x + 14, y + 10, 4);
  g.setTextColor(theme::DIM, theme::CARD); g.drawString("carga", x + 14, y + h - 50, 2);   // label estatica
}
static void drawFan(TFT_eSPI& g, int x, int y, int w, int fan, bool fanRpm) {
  bool no = fanRpm ? (fan < 0) : (fan == 255);
  char fb[16];
  if (no) strcpy(fb, "fan s/d");
  else if (fanRpm) snprintf(fb, sizeof(fb), "%d rpm", fan);
  else snprintf(fb, sizeof(fb), "fan %d%%", fan);
  g.fillRect(x + w - 116, y + 8, 102, 18, theme::CARD);       // clear localizado
  g.setTextDatum(TR_DATUM); g.setTextColor(no ? theme::DIM : theme::SOFT, theme::CARD);
  g.drawString(fb, x + w - 14, y + 14, 2); g.setTextDatum(TL_DATUM);
}
static void drawTempSpark(TFT_eSPI& g, int x, int y, int w, int sparkMetric, int16_t tempC) {
  bool noT = tempC <= -1000;
  uint16_t tc = noT ? theme::DIM : tempColor(tempC);
  g.fillRect(x + 12, y + 40, w - 110, 52, theme::CARD);       // clear numero
  g.fillRect(x + w - 100, y + 36, 88, 50, theme::CARD);       // clear spark
  g.setTextDatum(ML_DATUM);
  if (noT) { g.setTextColor(theme::DIM, theme::CARD); g.drawString("s/d", x + 14, y + 66, 4); }
  else {
    char b[8]; snprintf(b, sizeof(b), "%d", tempC);
    g.setTextColor(tc, theme::CARD); g.drawString(b, x + 14, y + 66, 6);
    g.setTextColor(theme::SOFT, theme::CARD); g.drawString("C", x + 14 + g.textWidth(b, 6) + 4, y + 66, 4);
  }
  g.setTextDatum(TL_DATUM);
  drawSpark(g, sparkMetric, x + w - 98, y + 38, 84, 44, noT ? theme::DIM : tc);
}
static void drawCarga(TFT_eSPI& g, int x, int y, int w, int h, uint8_t load) {
  int by = y + h - 50;
  bool no = load == 255;
  uint16_t lc = no ? theme::DIM : loadColor(load);
  char lb[8]; if (no) strcpy(lb, "s/d"); else snprintf(lb, sizeof(lb), "%u%%", load);
  g.fillRect(x + w - 70, by, 56, 16, theme::CARD);            // clear valor
  g.setTextDatum(TR_DATUM); g.setTextColor(lc, theme::CARD); g.drawString(lb, x + w - 14, by, 2);
  g.setTextDatum(TL_DATUM);
  int bx = x + 14, bw = w - 28, byy = by + 22, bh = 10;
  g.fillRoundRect(bx, byy, bw, bh, 5, theme::DARK);
  if (!no) g.fillRoundRect(bx, byy, (int)load * bw / 100, bh, 5, lc);
}
// Barra de uso autocontenida (RAM/VRAM): redibuja todo su rectangulo (localizado).
static void usageBar(TFT_eSPI& g, int x, int y, int w, int h, const char* label, int pct, const char* valStr, uint16_t col) {
  g.fillRoundRect(x, y, w, h, 8, theme::CARD);
  g.drawRoundRect(x, y, w, h, 8, theme::EDGE);
  g.setTextDatum(ML_DATUM); g.setTextColor(theme::SOFT, theme::CARD); g.drawString(label, x + 12, y + h / 2, 2);
  int bx = x + 58, bw = w - 58 - 88, by = y + (h - 10) / 2, bh = 10;
  g.fillRoundRect(bx, by, bw, bh, 5, theme::DARK);
  if (pct >= 0) g.fillRoundRect(bx, by, pct * bw / 100, bh, 5, col);
  g.setTextDatum(MR_DATUM); g.setTextColor(pct < 0 ? theme::DIM : col, theme::CARD); g.drawString(valStr, x + w - 10, y + h / 2, 2);
  g.setTextDatum(TL_DATUM);
}
static void rateChrome(TFT_eSPI& g, int x, int y, int w, int h, const char* label) {
  g.fillRoundRect(x, y, w, h, 12, theme::CARD);
  g.drawRoundRect(x, y, w, h, 12, theme::EDGE);
  g.setTextDatum(TL_DATUM); g.setTextColor(theme::DIM, theme::CARD); g.drawString(label, x + 14, y + 10, 2);
}
static void rateValue(TFT_eSPI& g, int x, int y, int w, int h, uint16_t col,
                      uint32_t kbs, const uint16_t* row, int head, int count) {
  char num[16]; const char* unit; fmtRate(kbs, num, sizeof(num), &unit);
  bool no = kbs == 0xFFFFFFFF;
  g.fillRect(x + 12, y + 30, w - 24, 46, theme::CARD);        // clear numero
  g.setTextDatum(ML_DATUM); g.setTextColor(no ? theme::DIM : col, theme::CARD); g.drawString(num, x + 14, y + 52, 6);
  g.setTextColor(theme::SOFT, theme::CARD); g.drawString(unit, x + 14 + g.textWidth(num, 6) + 6, y + 58, 2);
  g.setTextDatum(TL_DATUM);
  g.fillRect(x + 12, y + h - 46, w - 24, 38, theme::CARD);    // clear spark
  drawRateSpark(g, row, head, count, x + 14, y + h - 44, w - 28, 34, col);
}

// --- layout comun de cards ---
static const int M = 8, GAP = 8;
static int cardW() { return (layout::W - 2 * M - GAP) / 2; }
static int col2()  { return M + cardW() + GAP; }

// ============================================================================
//  VISTA GENERAL
// ============================================================================
static void general(TFT_eSPI& g, const UiSnapshot& s, const char* clk, bool full) {
  static UiSnapshot p{};
  const int cw = cardW(), cy = 48, ch = 150, x2 = col2();
  if (s.live) pushSensorHist(s);
  if (full) {
    g.fillScreen(theme::BG);
    title(g, "GENERAL", theme::CYAN, clk);
    cardChrome(g, M, cy, cw, ch, "CPU");
    cardChrome(g, x2, cy, cw, ch, "GPU");
  }
  if (full || s.live != p.live) livePill(g, s.live);
  // CPU
  if (full || s.cpuFan  != p.cpuFan)  drawFan(g, M, cy, cw, s.cpuFan, true);
  if (full || s.cpuTemp != p.cpuTemp || s.live) drawTempSpark(g, M, cy, cw, 0, s.cpuTemp);
  if (full || s.cpuLoad != p.cpuLoad) drawCarga(g, M, cy, cw, ch, s.cpuLoad);
  // GPU
  if (full || s.gpuFan  != p.gpuFan)  drawFan(g, x2, cy, cw, s.gpuFan, false);
  if (full || s.gpuTemp != p.gpuTemp || s.live) drawTempSpark(g, x2, cy, cw, 1, s.gpuTemp);
  if (full || s.gpuLoad != p.gpuLoad) drawCarga(g, x2, cy, cw, ch, s.gpuLoad);
  // RAM / VRAM
  const int by = cy + ch + 8, bh = 38;
  if (full || s.ram != p.ram) {
    char rb[8]; if (s.ram == 255) strcpy(rb, "s/d"); else snprintf(rb, sizeof(rb), "%u%%", s.ram);
    usageBar(g, M, by, cw, bh, "RAM", s.ram == 255 ? -1 : s.ram, rb,
             s.ram >= 90 ? theme::RED : (s.ram >= 75 ? theme::YELLOW : theme::MAGENTA));
  }
  if (full || s.vramUsed != p.vramUsed || s.vramTotal != p.vramTotal) {
    char vb[16]; int vpct;
    if (s.vramTotal == 0 || s.vramUsed == 0xFFFF) { strcpy(vb, "s/d"); vpct = -1; }
    else {
      vpct = (int)s.vramUsed * 100 / s.vramTotal;
      unsigned u10 = (s.vramUsed * 10u) / 1024, t10 = (s.vramTotal * 10u) / 1024;
      snprintf(vb, sizeof(vb), "%u.%u/%u.%uG", u10 / 10, u10 % 10, t10 / 10, t10 % 10);
    }
    usageBar(g, x2, by, cw, bh, "VRAM", vpct, vb, vpct < 0 ? theme::DIM : pctColor(vpct));
  }
  // footer: uptime + procesos
  const int fy = by + bh + 14;
  if (full || s.uptimeSec != p.uptimeSec || s.procs != p.procs) {
    g.fillRect(0, fy - 8, layout::W, 26, theme::BG);
    char ub[28];
    if (s.uptimeSec == 0xFFFFFFFF) strcpy(ub, "uptime s/d");
    else {
      uint32_t u = s.uptimeSec, d = u / 86400, h = (u % 86400) / 3600, mn = (u % 3600) / 60;
      if (d) snprintf(ub, sizeof(ub), "uptime %lud %luh", (unsigned long)d, (unsigned long)h);
      else   snprintf(ub, sizeof(ub), "uptime %luh %lum", (unsigned long)h, (unsigned long)mn);
    }
    g.setTextDatum(ML_DATUM); g.setTextColor(theme::SOFT, theme::BG); g.drawString(ub, M + 6, fy, 2);
    char pb[24];
    if (s.procs == 0xFFFF) strcpy(pb, "procesos s/d"); else snprintf(pb, sizeof(pb), "%u procesos", s.procs);
    g.setTextDatum(MR_DATUM); g.setTextColor(theme::SOFT, theme::BG); g.drawString(pb, layout::W - M - 6, fy, 2);
    g.setTextDatum(TL_DATUM);
  }
  p = s;
}

// ============================================================================
//  VISTA RED
// ============================================================================
static void red(TFT_eSPI& g, const UiSnapshot& s, const char* clk, bool full) {
  static UiSnapshot p{};
  const int cw = cardW(), cy = 48, ch = 150, x2 = col2();
  if (s.live) pushNetHist(s);
  if (full) {
    g.fillScreen(theme::BG);
    title(g, "RED", theme::GREEN, clk);
    rateChrome(g, M, cy, cw, ch, "DESCARGA");
    rateChrome(g, x2, cy, cw, ch, "SUBIDA");
    const int iy = cy + ch + 10;
    g.fillRoundRect(M, iy, layout::W - 2 * M, 46, 10, theme::CARD);
    g.drawRoundRect(M, iy, layout::W - 2 * M, 46, 10, theme::EDGE);
    g.setTextDatum(ML_DATUM); g.setTextColor(theme::DIM, theme::CARD); g.drawString("IP local", M + 16, iy + 23, 2);
    g.setTextDatum(TL_DATUM);
  }
  if (full || s.live != p.live) livePill(g, s.live);
  if (full || s.netDown != p.netDown || s.live) rateValue(g, M, cy, cw, ch, theme::CYAN,    s.netDown, s_net[0], s_netHead, s_netCount);
  if (full || s.netUp   != p.netUp   || s.live) rateValue(g, x2, cy, cw, ch, theme::MAGENTA, s.netUp,   s_net[1], s_netHead, s_netCount);
  if (full || strcmp(s.ip, p.ip) != 0) {
    const int iy = cy + ch + 10;
    g.fillRect(layout::W / 2, iy + 12, layout::W / 2 - M - 4, 22, theme::CARD);
    g.setTextDatum(MR_DATUM); g.setTextColor(s.ip[0] ? theme::FG : theme::DIM, theme::CARD);
    g.drawString(s.ip[0] ? s.ip : "s/d", layout::W - M - 16, iy + 23, 4);
    g.setTextDatum(TL_DATUM);
  }
  p = s;
}

// ============================================================================
//  VISTA NUCLEOS - grilla con etiqueta (Cn) + % + medidor vertical
// ============================================================================
static void coresGridGeom(int n, int& cols, int& rows, int& cwid, int& chei) {
  cols = n <= 8 ? n : (n <= 16 ? (n + 1) / 2 : (n + 2) / 3);
  rows = (n + cols - 1) / cols;
  const int gx = 10, gy = 70, gw = layout::W - 2 * gx, gh = layout::H - gy - 8;
  (void)gx;
  cwid = gw / cols; chei = gh / rows;
}
static void coreCell(TFT_eSPI& g, int x, int y, int w2, int chei, int idx, uint8_t v, bool chrome) {
  uint16_t col = loadColor(v);
  if (chrome) {  // etiqueta Cn (estatica)
    g.setTextDatum(TL_DATUM); g.setTextColor(theme::DIM, theme::BG);
    char lbl[6]; snprintf(lbl, sizeof(lbl), "C%d", idx); g.drawString(lbl, x, y, 2);
  }
  g.fillRect(x + w2 - 36, y, 36, 16, theme::BG);              // clear %
  char pb[6]; snprintf(pb, sizeof(pb), "%u", v);
  g.setTextDatum(TR_DATUM); g.setTextColor(col, theme::BG); g.drawString(pb, x + w2, y, 2);
  g.setTextDatum(TL_DATUM);
  int by = y + 18, bh = chei - 10 - 18; if (bh < 8) bh = 8;
  g.fillRoundRect(x, by, w2, bh, 3, theme::DARK);
  int fh = v * bh / 100;
  if (fh > 0) g.fillRoundRect(x, by + bh - fh, w2, fh, 3, col);
}
static void cores(TFT_eSPI& g, const UiSnapshot& s, const char* clk, bool full) {
  static UiSnapshot p{};
  static int pn = -1;
  int n = s.coreCount; if (n > 24) n = 24;
  int avg = 0, cnt = 0;
  for (int i = 0; i < n; i++) if (s.cores[i] <= 100) { avg += s.cores[i]; cnt++; }
  avg = cnt ? avg / cnt : 0;
  bool layoutChanged = full || n != pn;
  if (full) { g.fillScreen(theme::BG); title(g, "NUCLEOS", theme::VIOLET, clk); }
  if (full || s.live != p.live) livePill(g, s.live);
  // subtitulo (cambia con avg/n)
  g.fillRect(0, 44, 210, 20, theme::BG);
  g.setTextDatum(TL_DATUM); g.setTextColor(theme::SOFT, theme::BG);
  char sub[36]; if (!n) strcpy(sub, "sin datos por nucleo"); else snprintf(sub, sizeof(sub), "%d nucleos    prom %d%%", n, avg);
  g.drawString(sub, 16, 46, 2);
  if (layoutChanged) g.fillRect(0, 64, layout::W, layout::H - 64, theme::BG);  // limpia grilla al cambiar n
  if (n) {
    int cols, rows, cwid, chei; coresGridGeom(n, cols, rows, cwid, chei);
    const int gx = 10, gy = 70;
    for (int i = 0; i < n; i++) {
      uint8_t v = s.cores[i] > 100 ? 0 : s.cores[i];
      uint8_t pv = p.cores[i] > 100 ? 0 : p.cores[i];
      if (!layoutChanged && v == pv) continue;
      int c = i % cols, r = i / cols;
      int x = gx + c * cwid, y = gy + r * chei, w2 = cwid - 8;
      coreCell(g, x, y, w2, chei, i, v, layoutChanged);
    }
  }
  pn = n; p = s;
}

// ============================================================================
//  VISTA DISCO
// ============================================================================
static void disk(TFT_eSPI& g, const UiSnapshot& s, const char* clk, bool full) {
  static UiSnapshot p{};
  const int cw = cardW(), x2 = col2();
  const int uy = 48, uh = 56, cy = uy + uh + 10, ch = 150;
  if (s.live) pushDiskHist(s);
  if (full) {
    g.fillScreen(theme::BG);
    title(g, "DISCO", theme::YELLOW, clk);
    g.fillRoundRect(M, uy, layout::W - 2 * M, uh, 12, theme::CARD);
    g.drawRoundRect(M, uy, layout::W - 2 * M, uh, 12, theme::EDGE);
    g.setTextDatum(ML_DATUM); g.setTextColor(theme::SOFT, theme::CARD); g.drawString("USO", M + 16, uy + uh / 2, 4);
    g.setTextDatum(TL_DATUM);
    rateChrome(g, M, cy, cw, ch, "LECTURA");
    rateChrome(g, x2, cy, cw, ch, "ESCRITURA");
  }
  if (full || s.live != p.live) livePill(g, s.live);
  if (full || s.diskPct != p.diskPct) {
    bool no = s.diskPct == 255;
    uint16_t dc = no ? theme::DIM : (s.diskPct >= 90 ? theme::RED : (s.diskPct >= 75 ? theme::YELLOW : theme::GREEN));
    int bx = M + 90, bw = layout::W - 2 * M - 90 - 90, byy = uy + (uh - 16) / 2, bh = 16;
    g.fillRoundRect(bx, byy, bw, bh, 8, theme::DARK);
    if (!no) g.fillRoundRect(bx, byy, (int)s.diskPct * bw / 100, bh, 8, dc);
    g.fillRect(layout::W - M - 70, uy + 10, 56, uh - 20, theme::CARD);
    char db[8]; if (no) strcpy(db, "s/d"); else snprintf(db, sizeof(db), "%u%%", s.diskPct);
    g.setTextDatum(MR_DATUM); g.setTextColor(no ? theme::DIM : dc, theme::CARD); g.drawString(db, layout::W - M - 16, uy + uh / 2, 4);
    g.setTextDatum(TL_DATUM);
  }
  if (full || s.diskRd != p.diskRd || s.live) rateValue(g, M, cy, cw, ch, theme::CYAN,    s.diskRd, s_disk[0], s_diskHead, s_diskCount);
  if (full || s.diskWr != p.diskWr || s.live) rateValue(g, x2, cy, cw, ch, theme::MAGENTA, s.diskWr, s_disk[1], s_diskHead, s_diskCount);
  p = s;
}

// ============================================================================
//  Pre-carga de historial desde el companion (seed solo si el buffer esta vacio).
//  Guarda la ventana ordenada (viejo->nuevo) en [0..n-1] con head=n, count=n,
//  que es justo como la lee drawRateSpark.
// ============================================================================
void seedNetHist(const uint16_t* down, const uint16_t* up, int n) {
  if (s_netCount != 0 || n <= 0) return;
  if (n > HN) n = HN;
  for (int i = 0; i < n; i++) { s_net[0][i] = down[i]; s_net[1][i] = up[i]; }
  s_netHead = n % HN; s_netCount = n;
}
void seedDiskHist(const uint16_t* rd, const uint16_t* wr, int n) {
  if (s_diskCount != 0 || n <= 0) return;
  if (n > HN) n = HN;
  for (int i = 0; i < n; i++) { s_disk[0][i] = rd[i]; s_disk[1][i] = wr[i]; }
  s_diskHead = n % HN; s_diskCount = n;
}

// ============================================================================
//  API
// ============================================================================
bool isLayer(const char* n) {
  return !strcmp(n, "General") || !strcmp(n, "Red") || !strcmp(n, "Nucleos") || !strcmp(n, "Disco");
}
View viewFor(const char* n) {
  if (!strcmp(n, "Red"))     return View::RED;
  if (!strcmp(n, "Nucleos")) return View::NUCLEOS;
  if (!strcmp(n, "Disco"))   return View::DISCO;
  return View::GENERAL;
}
void render(TFT_eSPI& tft, const UiSnapshot& s, const char* clk, View v, bool full) {
  switch (v) {
    case View::GENERAL: general(tft, s, clk, full); break;
    case View::RED:     red(tft, s, clk, full);     break;
    case View::NUCLEOS: cores(tft, s, clk, full);   break;
    case View::DISCO:   disk(tft, s, clk, full);    break;
  }
}
void drawClock(TFT_eSPI& g, const char* clk) {
  g.fillRect(386, 12, 82, 30, theme::BG);
  g.setTextDatum(TR_DATUM); g.setTextColor(theme::FG, theme::BG);
  g.drawString(clk, 464, 14, 4);
  g.setTextDatum(TL_DATUM);
}

}  // namespace monitor
