// ============================================================================
//  Skins.cpp - Dashboard Cards (el unico dashboard; ya no hay sistema de skins).
//  Compone IconKit/UiKit. Las vistas de Monitor viven en monitor.cpp.
//  API expuesta: namespace dash:: (ver Skin.h). renderUI() la usa via dirty-check.
// ============================================================================
#include "Skin.h"
#include "Layout.h"
#include "IconKit.h"
#include "UiKit.h"
#include "StatusPanel.h"
#include "../app/Theme.h"
#include "../app/AppState.h"
#include "../app/Config.h"
#include "../mapping/KeyMap.h"
#include <string.h>

using iconkit::Glyph;

static InputId btnId(uint8_t i) { return (InputId)((int)InputId::BTN_1 + i); }

// Acento global (setting "Color"): tiñe el chrome neutral (wordmark + reloj) por
// encima del color por View. Antes el setting no afectaba nada.
static uint16_t hdrAccent() { return theme::accentByIndex(appstate::prefs.accentIndex); }

// Texto a la izquierda con recorte por ancho (no desborda su zona).
static void clip(TFT_eSPI& g, const char* s, int x, int y, int maxw, uint8_t font,
                 uint16_t fg, uint16_t bg) {
  char buf[20];
  strncpy(buf, s ? s : "", sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = '\0';
  while (strlen(buf) > 1 && g.textWidth(buf, font) > maxw) buf[strlen(buf) - 1] = '\0';
  g.setTextDatum(TL_DATUM);
  g.setTextColor(fg, bg);
  g.drawString(buf, x, y, font);
}

// Mini-bateria en (x,y), ~22x11. Lee s.battery (255 = sin medicion: contorno
// atenuado + guion, NO un % inventado; el divisor todavia no esta cableado).
// Cuando haya dato real (BATTERY_ENABLED + divisor) se llena y colorea solo.
static void drawBattery(TFT_eSPI& g, const UiSnapshot& s, int x, int y) {
  const int bw = 20, bh = 11;
  const bool nodata = (s.battery == 255);
  uint16_t edge = nodata ? theme::DIM
                : (s.battery > 50 ? theme::GREEN : (s.battery > 20 ? theme::YELLOW : theme::RED));
  g.drawRoundRect(x, y, bw, bh, 2, edge);
  g.fillRect(x + bw, y + 3, 2, bh - 6, edge);                // pico +
  if (nodata) {
    g.drawFastHLine(x + 7, y + bh / 2, 6, theme::DIM);       // guion "sin medicion"
  } else {
    int fw = (bw - 4) * s.battery / 100;
    if (fw > 0) g.fillRect(x + 2, y + 2, fw, bh - 4, edge);
  }
}

// Mini-microfono (~12px) para la fila de estado del header (el glyph MIC es muy alto).
static void drawMicMini(TFT_eSPI& g, int cx, int cy, uint16_t col) {
  g.fillRoundRect(cx - 3, cy - 7, 6, 9, 3, col);             // capsula
  g.drawFastVLine(cx, cy + 2, 3, col);                       // tallo
  g.drawFastHLine(cx - 3, cy + 5, 7, col);                   // base
}

// Cluster de estado del header (reemplaza al dock eliminado): bateria + wifi (barritas)
// + mic, en una fila arriba del reloj. Se refresca en el header (full) y en status.
static void drawStatusCluster(TFT_eSPI& g, const UiSnapshot& s) {
  bool wifi = s.transports & tport::WIFI;
  bool ble  = s.transports & tport::BLE;
  bool usb  = s.transports & tport::USB;
  uint16_t tcol = wifi ? theme::CYAN : (ble ? theme::VIOLET : (usb ? theme::GREEN : theme::DIM));
  g.fillRect(346, 2, 124, 17, theme::PANEL);                 // limpia la fila (no pisa WiZ <=346)
  drawBattery(g, s, 350, 4);
  iconkit::icon(g, wifi ? Glyph::WIFI : Glyph::LINK, 388, 10, tcol);   // barritas en WiFi
  if (s.wifiOff) iconkit::ln(g, 388 - 9, 2, 388 + 9, 18, theme::ORANGE);  // WiFi off (aviso)
  uint16_t micC = s.micMuted ? theme::RED : theme::GREEN;
  drawMicMini(g, 414, 10, micC);
  if (s.micMuted) iconkit::ln(g, 414 - 8, 3, 414 + 8, 17, theme::RED);    // mute (cruz)
}

// ============================================================================
//  CARDS (denso, una tarjeta por tecla)
// ============================================================================
// Linea de estado WiZ en el centro del header (solo capa WiZ con companion vivo).
static void drawWizHeader(TFT_eSPI& g, KeyMap& km, const UiSnapshot& s) {
  g.fillRect(150, 4, 196, layout::HEADER_H - 6, theme::PANEL);   // limpia la zona central
  if (!(s.live && strcmp(km.layer(s.activeLayer).name, "WiZ") == 0)) return;
  char w[40];
  snprintf(w, sizeof(w), "%s  %s  %s %u%%", s.wizRoom, s.wizTarget, s.wizOn ? "ON" : "OFF", s.wizBright);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(s.wizOn ? theme::YELLOW : theme::DIM, theme::PANEL);
  g.drawString(w, 248, 28, 2);
  g.setTextDatum(TL_DATUM);
}

static void cardsHeader(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  g.fillRect(0, 0, layout::W, layout::HEADER_H, theme::PANEL);
  g.fillRect(0, layout::HEADER_H, layout::W, layout::HEADER_ACC, L.color);
  const uint16_t acc = hdrAccent();
  g.setTextDatum(TL_DATUM);
  g.setTextColor(acc, theme::PANEL);
  g.drawString("HIOS PAD", 12, 3, 2);                        // wordmark mas grande + acento
  clip(g, L.name, 12, 24, 160, 4, theme::FG, theme::PANEL);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(acc, theme::PANEL);
  g.drawString(ctx.clock, 468, 24, 4);                       // reloj con acento
  g.setTextDatum(TL_DATUM);
  drawStatusCluster(g, s);
  drawWizHeader(g, km, s);
  // Badge ALT momentaneo (held+linger): en la franja libre entre wordmark y la
  // zona WiZ (x150). No lo pisan los redibujos parciales (status/wiz limpian x150+).
  if (s.altActive) {
    char ab[6]; snprintf(ab, sizeof(ab), "ALT%u", s.altActive);
    uikit::badge(g, {110, 2, 38, 15}, ab, L.color, theme::BG, 4, 1);
  }
}

void dash::keycap(const SkinContext& ctx, const UiSnapshot& s, uint8_t i, bool on) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  const char* label = km.label(s.activeLayer, btnId(i));
  const int x = layout::kcX(i), y = layout::kcY(i), w = layout::KC_W, h = layout::KC_H;
  const bool flash = s.longFlash & (1 << i);            // flash de confirmacion del long-press
  uint16_t fill   = flash ? theme::FG : (on ? L.color : theme::CARD);
  uint16_t border = flash ? theme::FG : (on ? theme::FG : theme::blend(L.color, theme::EDGE, 165));
  uint16_t ic     = flash ? theme::BG : (on ? theme::BG : L.color);
  uint16_t tc     = flash ? theme::BG : (on ? theme::BG : theme::FG);
  g.fillRoundRect(x + 3, y + 5, w, h, 10, theme::BG);
  g.fillRoundRect(x, y, w, h, 10, fill);
  g.drawRoundRect(x, y, w, h, 10, border);
  char num[3]; snprintf(num, sizeof(num), "%d", i + 1);    // 1..10
  uint16_t bf = on ? theme::blend(L.color, theme::FG, 70) : theme::DARK;
  uikit::badge(g, {x + 7, y + layout::KC_BADGE_DY, 22, 15}, num, bf, on ? theme::BG : theme::SOFT, 5, 2);
  const int cx = x + w / 2, cyW = y + layout::KC_ICON_DY;
  uint16_t well = on ? theme::blend(L.color, theme::FG, 50) : theme::blend(theme::CARD, L.color, 42);
  uikit::iconWell(g, cx, cyW, layout::ICON_WELL_R, well);
  iconkit::icon(g, iconkit::glyphFor(label), cx, cyW, ic);
  uikit::fitText(g, label, cx, y + layout::KC_LABEL_DY, w - 14, tc, fill, 2);
  if (on) g.fillRoundRect(x + 18, y + h - 12, w - 36, 4, 2, theme::BG);
}

void dash::stick(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  using namespace layout;
  const uint16_t f3 = theme::blend(theme::BG, theme::GREEN, 40);
  const uint16_t mc = theme::GREEN;
  // (1) MIRA: box con cruz + punto que sigue la posicion del stick.
  const int bs = 26, bx = ENC_S3_X + 6, by = ENC_Y + (ENC_H - bs) / 2;
  const uint16_t cross = theme::blend(theme::DARK, theme::GREEN, 60);
  g.fillRoundRect(bx + 1, by + 1, bs - 2, bs - 2, 4, theme::DARK);
  g.drawRoundRect(bx, by, bs, bs, 5, mc);
  g.drawFastHLine(bx + 4, by + bs / 2, bs - 8, cross);
  g.drawFastVLine(bx + bs / 2, by + 4, bs - 8, cross);
  const int pad = 4, span = bs - 2 * pad, half = span / 2;
  // Mismo mapeo que el mouse (KeyMap.cpp): swap/invert sobre la desviacion cruda
  // respecto del centro (~2048), para que el punto siga al cursor (no al reves).
  int devx = (int)s.stickX - 2048, devy = (int)s.stickY - 2048;
  if (cfg::MOUSE_SWAP_XY) { int t = devx; devx = devy; devy = t; }
  int gx = cfg::MOUSE_INVERT_X ? -devx : devx;
  int gy = cfg::MOUSE_INVERT_Y ? -devy : devy;
  int dx = bx + pad + half + gx * half / 2048;
  int dy = by + pad + half + gy * half / 2048;
  if (dx < bx + pad) dx = bx + pad; else if (dx > bx + bs - pad) dx = bx + bs - pad;
  if (dy < by + pad) dy = by + pad; else if (dy > by + bs - pad) dy = by + bs - pad;
  g.fillCircle(dx, dy, 3, mc);
  // (2) Glyph de mouse con flash del boton clickeado.
  const int mcx = ENC_S3_X + 52, mcy = ENC_Y + ENC_H / 2;
  g.fillRect(mcx - 11, ENC_Y + 3, 22, ENC_H - 6, f3);
  g.drawRoundRect(mcx - 8, mcy - 12, 16, 24, 7, mc);
  g.drawFastVLine(mcx, mcy - 12, 9, mc);
  g.drawFastHLine(mcx - 8, mcy - 3, 16, mc);
  g.drawFastVLine(mcx, mcy + 1, 4, mc);
  if (s.clickFlash == 1) g.fillRect(mcx - 7, mcy - 11, 6, 8, mc);
  if (s.clickFlash == 2) g.fillRect(mcx + 2, mcy - 11, 6, 8, mc);
  // Crudos del ADC del stick.
  const int rx = ENC_S3_X + ENC_S3_W - 12;
  g.setTextDatum(TR_DATUM);
  char b[12];
  snprintf(b, sizeof(b), "X:%4u", s.stickX);
  g.setTextColor(theme::SOFT, f3); g.drawString(b, rx, ENC_Y + 13, 1);
  snprintf(b, sizeof(b), "Y:%4u", s.stickY);
  g.setTextColor(theme::SOFT, f3); g.drawString(b, rx, ENC_Y + 23, 1);
  g.setTextDatum(TL_DATUM);
}

// Dibuja SOLO el dial del encoder (aguja que gira con encPos + relleno al presionar).
static void drawEncDial(TFT_eSPI& g, const UiSnapshot& s, uint16_t encC) {
  using namespace layout;
  static const int8_t DIAL_DX[12] = { 7, 6, 4, 0, -4, -6, -7, -6, -4, 0, 4, 6 };
  static const int8_t DIAL_DY[12] = { 0, 4, 6, 7, 6, 4, 0, -4, -6, -7, -6, -4 };
  const int dcx = ENC_S1_X + 18, dcy = ENC_Y + ENC_H / 2, dr = 9;
  const bool encDown = (s.buttons >> (int)InputId::ENC_SW) & 1;
  const int di = (int)(((s.encPos % 12) + 12) % 12);
  if (encDown) g.fillCircle(dcx, dcy, dr, encC);
  else         g.drawCircle(dcx, dcy, dr, encC);
  const uint16_t mark = encDown ? theme::BG : encC;
  g.drawLine(dcx, dcy, dcx + DIAL_DX[di], dcy + DIAL_DY[di], mark);
  g.fillCircle(dcx + DIAL_DX[di], dcy + DIAL_DY[di], 2, mark);
}

void dash::encDial(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  using namespace layout;
  const Layer& L = km.layer(s.activeLayer);
  const bool ovr = (s.encMode != 0 && s.encMode < 5);
  const uint16_t encC = ovr ? theme::CYAN : L.color;
  const int dcx = ENC_S1_X + 18, dcy = ENC_Y + ENC_H / 2, dr = 9;
  g.fillRect(dcx - dr - 1, dcy - dr - 1, 2 * dr + 3, 2 * dr + 3, theme::PANEL);
  drawEncDial(g, s, encC);
}

// Volumen en su PROPIO box (segmento S4), SIEMPRE visible y separado del mouse box.
static void drawVolume(TFT_eSPI& g, const UiSnapshot& s) {
  using namespace layout;
  const uint16_t bg = theme::PANEL;
  g.fillRoundRect(ENC_S4_X, ENC_Y, ENC_S4_W, ENC_H, 8, bg);
  g.drawRoundRect(ENC_S4_X, ENC_Y, ENC_S4_W, ENC_H, 8, theme::EDGE);
  const int x = ENC_S4_X + 8, w = ENC_S4_W - 16;
  g.setTextDatum(TL_DATUM); g.setTextColor(theme::DIM, bg);
  g.drawString("VOL", x, ENC_Y + 5, 1);
  char vb[6]; snprintf(vb, sizeof(vb), "%u%%", s.volume);
  g.setTextDatum(TR_DATUM); g.setTextColor(theme::FG, bg);
  g.drawString(vb, ENC_S4_X + ENC_S4_W - 8, ENC_Y + 4, 2);
  const int by = ENC_Y + ENC_H - 10, bh = 5;
  g.fillRoundRect(x, by, w, bh, 2, theme::DARK);
  g.fillRoundRect(x, by, (int)s.volume * w / 100, bh, 2, theme::CYAN);
  g.setTextDatum(TL_DATUM);
}

void dash::encStrip(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  using namespace layout;
  const Layer& L = km.layer(s.activeLayer);
  g.fillRect(0, ENC_Y - 2, W, ENC_H + 4, theme::BG);
  g.fillRoundRect(ENC_S1_X, ENC_Y, ENC_S1_W, ENC_H, 8, theme::PANEL);
  g.drawRoundRect(ENC_S1_X, ENC_Y, ENC_S1_W, ENC_H, 8, theme::EDGE);
  static const char* ENC_MODE[] = {"", "Volumen", "Scroll", "Zoom", "Pestanas"};
  const bool ovr = (s.encMode != 0 && s.encMode < 5);
  const char* encLab  = ovr ? ENC_MODE[s.encMode] : km.label(s.activeLayer, InputId::ENC_ROT);
  const uint16_t encC = ovr ? theme::CYAN : L.color;
  drawEncDial(g, s, encC);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::PANEL);
  g.drawString(ovr ? "ENCODER 2x" : "ENCODER", ENC_S1_X + 36, ENC_Y + 6, 1);
  clip(g, encLab, ENC_S1_X + 36, ENC_Y + 16, ENC_S1_W - 44, 2, encC, theme::PANEL);

  // S2: companion (compacto)
  uint16_t f2 = theme::blend(theme::BG, L.color, 42);
  g.fillRoundRect(ENC_S2_X, ENC_Y, ENC_S2_W, ENC_H, 8, f2);
  const uint16_t cdot = s.live ? theme::GREEN : theme::DIM;
  g.fillCircle(ENC_S2_X + 13, ENC_Y + ENC_H / 2, 4, cdot);
  g.setTextDatum(ML_DATUM);
  g.setTextColor(theme::SOFT, f2);
  g.drawString("companion", ENC_S2_X + 24, ENC_Y + 11, 1);
  g.setTextColor(s.live ? theme::GREEN : theme::DIM, f2);
  g.drawString(s.live ? "live" : "sin PC", ENC_S2_X + 24, ENC_Y + 22, 1);

  // S3: mouse / stick box (SIEMPRE presente, nunca lo reemplaza el volumen)
  bool mo = s.mouseOn;
  uint16_t f3 = mo ? theme::blend(theme::BG, theme::GREEN, 40) : theme::PANEL;
  uint16_t st3 = mo ? theme::GREEN : theme::EDGE;
  g.fillRoundRect(ENC_S3_X, ENC_Y, ENC_S3_W, ENC_H, 8, f3);
  g.drawRoundRect(ENC_S3_X, ENC_Y, ENC_S3_W, ENC_H, 8, st3);
  if (mo) {
    g.setTextDatum(TR_DATUM);
    g.setTextColor(theme::GREEN, f3);
    g.drawString("MOUSE", ENC_S3_X + ENC_S3_W - 10, ENC_Y + 4, 1);
    dash::stick(ctx, s);
  } else {
    iconkit::icon(g, Glyph::POINTER, ENC_S3_X + 16, ENC_Y + ENC_H / 2, theme::DIM);
    g.setTextDatum(TL_DATUM);
    g.setTextColor(theme::DIM, f3);  g.drawString("STICK", ENC_S3_X + 32, ENC_Y + 6, 1);
    g.setTextColor(theme::SOFT, f3); g.drawString("hold=mouse", ENC_S3_X + 32, ENC_Y + 16, 1);
  }

  // S4: VOLUMEN (box propio, SIEMPRE visible)
  drawVolume(g, s);
  g.setTextDatum(TL_DATUM);
}

void dash::status(const SkinContext& ctx, const UiSnapshot& s) {
  // El dock se eliminó: el estado (mic/wifi/batería) vive en el cluster del header.
  drawWizHeader(*ctx.tft, *ctx.km, s);
  drawStatusCluster(*ctx.tft, s);   // bateria + wifi + mic (refresca si cambio)
}

void dash::full(const SkinContext& ctx, const UiSnapshot& s) {
  cardsHeader(ctx, s);
  for (uint8_t i = 0; i < layout::KC_COUNT; i++) dash::keycap(ctx, s, i, s.buttons & (1 << i));
  dash::encStrip(ctx, s);
}

void dash::clock(const SkinContext& ctx) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(388, 22, 84, 28, theme::PANEL);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(hdrAccent(), theme::PANEL);
  g.drawString(ctx.clock, 468, 24, 4);
  g.setTextDatum(TL_DATUM);
}
