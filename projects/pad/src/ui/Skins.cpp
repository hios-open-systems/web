// ============================================================================
//  Skins.cpp - Los skins precargados del dashboard. Cada skin compone los
//  mismos IconKit/UiKit de otra forma. Registro al final (array SKINS).
//
//  Agregar un skin: escribir <nombre>Full/Keycap/Status (+Stick opcional) y
//  sumar una entrada al array SKINS. El menu y el render lo toman solos.
// ============================================================================
#include "Skin.h"
#include "Layout.h"
#include "IconKit.h"
#include "UiKit.h"
#include "StatusPanel.h"
#include "../app/Theme.h"
#include "../mapping/KeyMap.h"
#include <string.h>

using iconkit::Glyph;

static InputId btnId(uint8_t i) { return (InputId)((int)InputId::BTN_1 + i); }

// encoder() no-op: skins que no muestran estado de mouse no redibujan nada al
// togglear el mouse (en vez de un full() que parpadea).
static void noEncoder(const SkinContext&, const UiSnapshot&) {}

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

static void pips(TFT_eSPI& g, KeyMap& km, uint8_t layer, int y, uint16_t bg) {
  int n = km.count();
  const int slot = 13, cxc = layout::W / 2;
  int x0 = cxc - (n * slot) / 2 + slot / 2;
  for (int i = 0; i < n; i++) {
    bool cur = (i == layer);
    int w = cur ? 12 : 5;
    uint16_t col = cur ? km.layer(i).color : theme::blend(theme::DIM, bg, 120);
    g.fillRoundRect(x0 + i * slot - w / 2, y, w, 5, 2, col);
  }
}

// Fila de estado compartida (Minimal/Watch): mic | cam | media | vol | enlace.
static void statusStrip(TFT_eSPI& g, const UiSnapshot& s, int cy) {
  for (int i = 0; i < 5; i++) {
    int cx = 88 + i * 76;
    if (i == 3) {  // volumen
      char vb[8]; snprintf(vb, sizeof(vb), "%u%%", s.volume);
      g.setTextDatum(MC_DATUM);
      g.setTextColor(theme::FG, theme::BG);
      g.drawString(vb, cx, cy, 2);
      g.setTextColor(theme::DIM, theme::BG);
      g.drawString("vol", cx, cy + 20, 1);
      continue;
    }
    Glyph gl; uint16_t col; const char* lab;
    if (i == 0)      { gl = Glyph::MIC;    col = s.micMuted ? theme::RED : theme::GREEN; lab = s.micMuted ? "mute" : "abierto"; }
    else if (i == 1) { gl = Glyph::CAMERA; col = s.camOff   ? theme::RED : theme::GREEN; lab = s.camOff   ? "off" : "on"; }
    else if (i == 2) { gl = s.mediaPlay ? Glyph::PLAY : Glyph::PAUSE; col = s.mediaPlay ? theme::GREEN : theme::YELLOW; lab = s.mediaPlay ? "play" : "pausa"; }
    else             { bool wifi = s.transports & tport::WIFI; bool usb = s.transports & tport::USB; gl = Glyph::LINK;
                        col = wifi ? theme::CYAN : (usb ? theme::GREEN : theme::DIM); lab = wifi ? "WiFi" : (usb ? "USB" : "off"); }
    iconkit::icon(g, gl, cx, cy, col);
    if (i == 0 && s.micMuted) iconkit::ln(g, cx - 11, cy - 10, cx + 11, cy + 10, theme::RED);
    if (i == 1 && s.camOff)   iconkit::ln(g, cx - 11, cy - 9, cx + 11, cy + 9, theme::RED);
    g.setTextDatum(MC_DATUM);
    g.setTextColor(col, theme::BG);
    g.drawString(lab, cx, cy + 20, 1);
  }
}

// ============================================================================
//  SKIN 0 - CARDS (denso, una tarjeta por tecla)
// ============================================================================
static void cardsHeader(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  g.fillRect(0, 0, layout::W, layout::HEADER_H, theme::PANEL);
  g.fillRect(0, layout::HEADER_H, layout::W, layout::HEADER_ACC, L.color);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::PANEL);
  g.drawString("HIOS PAD", 12, 6, 1);
  clip(g, L.name, 12, 15, 168, 4, theme::FG, theme::PANEL);
  pips(g, km, s.activeLayer, 21, theme::PANEL);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::SOFT, theme::PANEL);
  g.drawString("USB / listo", 468, 6, 1);
  g.setTextColor(theme::FG, theme::PANEL);
  g.drawString(ctx.clock, 468, 15, 4);
  g.setTextDatum(TL_DATUM);
}

static void cardsKeycap(const SkinContext& ctx, const UiSnapshot& s, uint8_t i, bool on) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  const char* label = km.label(s.activeLayer, btnId(i));
  const int x = layout::kcX(i), y = layout::KC_Y, w = layout::KC_W, h = layout::KC_H;
  const bool flash = s.longFlash & (1 << i);            // flash de confirmacion del long-press
  uint16_t fill   = flash ? theme::FG : (on ? L.color : theme::CARD);
  uint16_t border = flash ? theme::FG : (on ? theme::FG : theme::blend(L.color, theme::EDGE, 165));
  uint16_t ic     = flash ? theme::BG : (on ? theme::BG : L.color);
  uint16_t tc     = flash ? theme::BG : (on ? theme::BG : theme::FG);
  g.fillRoundRect(x + 3, y + 5, w, h, 10, theme::BG);
  g.fillRoundRect(x, y, w, h, 10, fill);
  g.drawRoundRect(x, y, w, h, 10, border);
  char num[2] = { (char)('1' + i), '\0' };
  uint16_t bf = on ? theme::blend(L.color, theme::FG, 70) : theme::DARK;
  uikit::badge(g, {x + 8, y + layout::KC_BADGE_DY, 20, 16}, num, bf, on ? theme::BG : theme::SOFT, 5, 2);
  const int cx = x + w / 2, cyW = y + layout::KC_ICON_DY;
  uint16_t well = on ? theme::blend(L.color, theme::FG, 50) : theme::blend(theme::CARD, L.color, 42);
  uikit::iconWell(g, cx, cyW, layout::ICON_WELL_R, well);
  iconkit::icon(g, iconkit::glyphFor(label), cx, cyW, ic);
  uikit::fitText(g, label, cx, y + layout::KC_LABEL_DY, w - 14, tc, fill, 2);
  if (on) g.fillRoundRect(x + 18, y + h - 12, w - 36, 4, 2, theme::BG);
}

static void cardsStick(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  using namespace layout;
  const uint16_t f3 = theme::blend(theme::BG, theme::GREEN, 40);
  const uint16_t mc = theme::GREEN;

  // (1) MIRA: box con cruz + punto que sigue la posicion del stick (diagnostico de
  // apuntado). Va a la izquierda; el glyph del click va al lado.
  const int bs = 26, bx = ENC_S3_X + 6, by = ENC_Y + (ENC_H - bs) / 2;
  const uint16_t cross = theme::blend(theme::DARK, theme::GREEN, 60);
  g.fillRoundRect(bx + 1, by + 1, bs - 2, bs - 2, 4, theme::DARK);   // interior (borra punto previo)
  g.drawRoundRect(bx, by, bs, bs, 5, mc);
  g.drawFastHLine(bx + 4, by + bs / 2, bs - 8, cross);
  g.drawFastVLine(bx + bs / 2, by + 4, bs - 8, cross);
  const int pad = 4, span = bs - 2 * pad;
  // Mismo transform que el mouse (SWAP_XY + INVERT_X): el horizontal del stick es
  // stickY (invertido -> X de pantalla); el vertical es stickX (-> Y de pantalla).
  const int dx = bx + pad + (int)((long)(4095 - s.stickY) * span / 4095);
  const int dy = by + pad + (int)((long)s.stickX * span / 4095);
  g.fillCircle(dx, dy, 3, mc);

  // (2) Glyph de mouse con flash del boton clickeado (izq/der), al lado de la mira.
  const int mcx = ENC_S3_X + 52, mcy = ENC_Y + ENC_H / 2;
  g.fillRect(mcx - 11, ENC_Y + 3, 22, ENC_H - 6, f3);    // limpia la zona (borra el flash previo)
  g.drawRoundRect(mcx - 8, mcy - 12, 16, 24, 7, mc);     // cuerpo
  g.drawFastVLine(mcx, mcy - 12, 9, mc);                 // division L | R
  g.drawFastHLine(mcx - 8, mcy - 3, 16, mc);             // linea bajo los botones
  g.drawFastVLine(mcx, mcy + 1, 4, mc);                  // ruedita
  if (s.clickFlash == 1) g.fillRect(mcx - 7, mcy - 11, 6, 8, mc);   // click izquierdo
  if (s.clickFlash == 2) g.fillRect(mcx + 2, mcy - 11, 6, 8, mc);   // click derecho

  // Crudos del ADC del stick (diagnostico en vivo), a la derecha del box.
  const int rx = ENC_S3_X + ENC_S3_W - 12;
  g.setTextDatum(TR_DATUM);
  char b[12];
  snprintf(b, sizeof(b), "X:%4u", s.stickX);
  g.setTextColor(theme::SOFT, f3); g.drawString(b, rx, ENC_Y + 13, 1);
  snprintf(b, sizeof(b), "Y:%4u", s.stickY);
  g.setTextColor(theme::SOFT, f3); g.drawString(b, rx, ENC_Y + 23, 1);
  g.setTextDatum(TL_DATUM);
}

static void cardsEncStrip(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  using namespace layout;
  const Layer& L = km.layer(s.activeLayer);
  g.fillRect(0, ENC_Y - 2, W, ENC_H + 4, theme::BG);
  g.fillRoundRect(ENC_S1_X, ENC_Y, ENC_S1_W, ENC_H, 8, theme::PANEL);
  g.drawRoundRect(ENC_S1_X, ENC_Y, ENC_S1_W, ENC_H, 8, theme::EDGE);
  static const char* ENC_MODE[] = {"", "Volumen", "Scroll", "Zoom", "Pestanas"};   // override (doble-tap)
  const bool ovr = (s.encMode != 0 && s.encMode < 5);
  const char* encLab  = ovr ? ENC_MODE[s.encMode] : km.label(s.activeLayer, InputId::ENC_ROT);
  const uint16_t encC = ovr ? theme::CYAN : L.color;
  iconkit::icon(g, Glyph::DIAL, ENC_S1_X + 18, ENC_Y + ENC_H / 2, encC);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::PANEL);
  g.drawString(ovr ? "ENCODER 2x" : "ENCODER", ENC_S1_X + 36, ENC_Y + 6, 1);
  clip(g, encLab, ENC_S1_X + 36, ENC_Y + 16, ENC_S1_W - 44, 2, encC, theme::PANEL);

  uint16_t f2 = theme::blend(theme::BG, L.color, 42);
  g.fillRoundRect(ENC_S2_X, ENC_Y, ENC_S2_W, ENC_H, 8, f2);
  iconkit::icon(g, Glyph::COMMAND, ENC_S2_X + 20, ENC_Y + ENC_H / 2, theme::SOFT);
  g.setTextDatum(ML_DATUM);
  g.setTextColor(theme::SOFT, f2);
  g.drawString("menu", ENC_S2_X + 38, ENC_Y + ENC_H / 2 + 1, 2);

  bool mo = s.mouseOn;
  uint16_t f3 = mo ? theme::blend(theme::BG, theme::GREEN, 40) : theme::PANEL;
  uint16_t st3 = mo ? theme::GREEN : theme::EDGE;
  g.fillRoundRect(ENC_S3_X, ENC_Y, ENC_S3_W, ENC_H, 8, f3);
  g.drawRoundRect(ENC_S3_X, ENC_Y, ENC_S3_W, ENC_H, 8, st3);
  const int rx = ENC_S3_X + ENC_S3_W - 12;
  g.setTextDatum(TR_DATUM);
  if (mo) {
    g.setTextColor(theme::GREEN, f3); g.drawString("MOUSE ON", rx, ENC_Y + 4, 1);
    cardsStick(ctx, s);   // cursor + valores crudos X/Y en vivo (debajo de MOUSE ON)
  } else {
    iconkit::icon(g, Glyph::POINTER, ENC_S3_X + 18, ENC_Y + ENC_H / 2, theme::DIM);
    g.setTextColor(theme::DIM, f3);  g.drawString("STICK", rx, ENC_Y + 6, 1);
    g.setTextColor(theme::SOFT, f3); g.drawString("hold = mouse", rx, ENC_Y + 16, 2);
  }
  g.setTextDatum(TL_DATUM);
}

static void cardsStatus(const SkinContext& ctx, const UiSnapshot& s) {
  statuspanel::render(*ctx.tft, s, ctx.km->count());
}

static void cardsFull(const SkinContext& ctx, const UiSnapshot& s) {
  cardsHeader(ctx, s);
  for (uint8_t i = 0; i < layout::KC_COUNT; i++) cardsKeycap(ctx, s, i, s.buttons & (1 << i));
  cardsEncStrip(ctx, s);
  statuspanel::forceRedraw();
  statuspanel::render(*ctx.tft, s, ctx.km->count());
}

// ============================================================================
//  SKIN 1 - MINIMAL (anillos espaciados, mucho aire)
// ============================================================================
static void minKeycap(const SkinContext& ctx, const UiSnapshot& s, uint8_t i, bool on) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  const char* label = km.label(s.activeLayer, btnId(i));
  const int cx = 48 + i * 96, cy = 118;
  g.fillRect(cx - 30, cy - 30, 60, 60, theme::BG);   // limpia el anillo+badge
  const bool flash = s.longFlash & (1 << i);
  uint16_t ring = flash ? theme::FG : (on ? L.color : theme::blend(theme::CARD, L.color, 36));
  uint16_t ic   = flash ? theme::BG : (on ? theme::BG : L.color);
  g.fillCircle(cx, cy, 26, ring);
  if (!on) g.drawCircle(cx, cy, 26, L.color);
  iconkit::icon(g, iconkit::glyphFor(label), cx, cy, ic);
  uint16_t nb = on ? theme::FG : L.color;
  g.fillCircle(cx + 19, cy - 19, 8, nb);
  char num[2] = { (char)('1' + i), '\0' };
  g.setTextDatum(MC_DATUM);
  g.setTextColor(theme::BG, nb);
  g.drawString(num, cx + 19, cy - 19, 1);
  uikit::fitText(g, label, cx, cy + 42, 92, on ? L.color : theme::FG, theme::BG, 2);
}

static void minStatus(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(0, 240, layout::W, layout::H - 240, theme::BG);
  statusStrip(g, s, 262);
}

static void minFull(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::BG);
  g.drawString("HIOS PAD", 16, 8, 1);
  clip(g, L.name, 16, 18, 300, 4, L.color, theme::BG);
  char cap[16]; snprintf(cap, sizeof(cap), "capa %u / %u", s.activeLayer + 1, km.count());
  g.setTextColor(theme::SOFT, theme::BG);
  g.drawString(cap, 16, 44, 1);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::SOFT, theme::BG);
  g.drawString("USB / listo", 464, 8, 1);
  g.setTextColor(theme::FG, theme::BG);
  g.drawString(ctx.clock, 464, 18, 4);
  g.setTextDatum(TL_DATUM);
  g.drawFastHLine(16, 58, 448, theme::EDGE);

  for (uint8_t i = 0; i < layout::KC_COUNT; i++) minKeycap(ctx, s, i, s.buttons & (1 << i));

  g.fillRoundRect(40, 188, 400, 30, 15, theme::PANEL);
  g.drawRoundRect(40, 188, 400, 30, 15, theme::EDGE);
  iconkit::icon(g, Glyph::DIAL, 62, 203, L.color);
  g.setTextDatum(ML_DATUM);
  g.setTextColor(L.color, theme::PANEL);
  g.drawString(km.label(s.activeLayer, InputId::ENC_ROT), 80, 204, 2);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(theme::SOFT, theme::PANEL);
  g.drawString("press = menu", 240, 204, 2);
  iconkit::icon(g, Glyph::POINTER, 356, 203, s.mouseOn ? theme::GREEN : theme::DIM);
  g.setTextDatum(MR_DATUM);
  g.setTextColor(s.mouseOn ? theme::GREEN : theme::SOFT, theme::PANEL);
  g.drawString(s.mouseOn ? "mouse" : "stick idle", 428, 204, 1);
  g.setTextDatum(TL_DATUM);

  g.drawFastHLine(16, 236, 448, theme::EDGE);
  statusStrip(g, s, 262);
}

// ============================================================================
//  SKIN 2 - WATCH (reloj central glanceable + tira de teclas)
// ============================================================================
static void watchKeycap(const SkinContext& ctx, const UiSnapshot& s, uint8_t i, bool on) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  const char* label = km.label(s.activeLayer, btnId(i));
  const int x = 14 + i * 94, y = 212, w = 86, h = 96;
  const bool flash = s.longFlash & (1 << i);
  uint16_t fill = flash ? theme::FG : (on ? L.color : theme::CARD);
  uint16_t ic = flash ? theme::BG : (on ? theme::BG : L.color);
  uint16_t tc = flash ? theme::BG : (on ? theme::BG : theme::SOFT);
  g.fillRoundRect(x, y, w, h, 10, fill);
  g.drawRoundRect(x, y, w, h, 10, on ? theme::FG : theme::blend(L.color, theme::EDGE, 155));
  g.setTextDatum(TL_DATUM);
  g.setTextColor(on ? theme::BG : theme::DIM, fill);
  char num[2] = { (char)('1' + i), '\0' };
  g.drawString(num, x + 10, y + 9, 1);
  uint16_t well = on ? theme::blend(L.color, theme::FG, 50) : theme::blend(theme::CARD, L.color, 42);
  g.fillCircle(x + w / 2, y + 32, 19, well);
  iconkit::icon(g, iconkit::glyphFor(label), x + w / 2, y + 32, ic);
  uikit::fitText(g, label, x + w / 2, y + 66, w - 12, tc, fill, 1);
}

static void watchStatus(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(0, 160, layout::W, 44, theme::BG);
  statusStrip(g, s, 178);
}

static void watchFull(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(theme::FG, theme::BG);
  g.drawString(ctx.clock, 240, 78, 6);                 // reloj grande (font6)
  g.setTextColor(L.color, theme::BG);
  g.drawString(L.name, 240, 124, 2);
  pips(g, km, s.activeLayer, 140, theme::BG);
  statusStrip(g, s, 178);
  for (uint8_t i = 0; i < layout::KC_COUNT; i++) watchKeycap(ctx, s, i, s.buttons & (1 << i));
}

// ============================================================================
//  SKIN 3 - SENSORES (telemetria real del companion: temps + carga CPU/GPU)
//  Con companion conectado muestra valores reales; sin el, "s/d" + pill "sin PC".
// ============================================================================
static void sensorTile(TFT_eSPI& g, int x, int y, int w, int h,
                       const char* label, bool isTemp, int16_t tempC, uint8_t load) {
  g.fillRoundRect(x, y, w, h, 10, theme::CARD);
  g.drawRoundRect(x, y, w, h, 10, theme::EDGE);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::CARD);
  g.drawString(label, x + 14, y + 8, 2);

  bool noData = isTemp ? (tempC <= -1000) : (load == 255);
  char buf[8];
  uint16_t col = theme::DIM;
  if (!noData && isTemp) {
    snprintf(buf, sizeof(buf), "%d", tempC);
    col = tempC >= 80 ? theme::RED : (tempC >= 65 ? theme::YELLOW : theme::GREEN);
  } else if (!noData) {
    snprintf(buf, sizeof(buf), "%u", load);
    col = load >= 90 ? theme::RED : (load >= 70 ? theme::YELLOW : theme::CYAN);
  }
  g.setTextDatum(ML_DATUM);
  if (noData) {
    g.setTextColor(theme::DIM, theme::CARD);
    g.drawString("s/d", x + 14, y + 50, 4);
  } else {
    g.setTextColor(col, theme::CARD);
    g.drawString(buf, x + 14, y + 48, 6);                 // numero grande (font6)
    g.setTextColor(theme::SOFT, theme::CARD);
    g.drawString(isTemp ? "C" : "%", x + 14 + g.textWidth(buf, 6) + 6, y + 50, 4);
  }
  if (!isTemp && !noData) {                                // barra de carga
    int bx = x + 14, bw = w - 28, by = y + h - 13, bh = 6;
    g.fillRoundRect(bx, by, bw, bh, 3, theme::DARK);
    g.fillRoundRect(bx, by, (int)load * bw / 100, bh, 3, col);
  }
}

static void sensorPanel(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  const int m = 8, gap = 12, cw = (layout::W - 2 * m - gap) / 2, ch = 88;
  const int x2 = m + cw + gap, y1 = 52, y2 = y1 + ch + gap;
  sensorTile(g, m,  y1, cw, ch, "CPU  temp",  true,  s.cpuTemp, 0);
  sensorTile(g, x2, y1, cw, ch, "GPU  temp",  true,  s.gpuTemp, 0);
  sensorTile(g, m,  y2, cw, ch, "CPU  carga", false, 0, s.cpuLoad);
  sensorTile(g, x2, y2, cw, ch, "GPU  carga", false, 0, s.gpuLoad);
  uint16_t pc = s.live ? theme::GREEN : theme::DIM;        // pill LIVE / sin PC
  g.fillRoundRect(196, 14, 88, 22, 11, theme::blend(theme::BG, pc, 50));
  g.drawRoundRect(196, 14, 88, 22, 11, pc);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(pc, theme::blend(theme::BG, pc, 50));
  g.drawString(s.live ? "LIVE" : "sin PC", 240, 25, 2);
}

static void sensorStrip(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(0, 248, layout::W, layout::H - 248, theme::BG);
  statusStrip(g, s, 272);
}

static void sensoresKeycap(const SkinContext&, const UiSnapshot&, uint8_t, bool) {}  // vista sin teclas

static void sensoresStatus(const SkinContext& ctx, const UiSnapshot& s) {
  sensorPanel(ctx, s);
  sensorStrip(ctx, s);
}

static void sensoresFull(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft;
  g.fillScreen(theme::BG);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::CYAN, theme::BG);
  g.drawString("SENSORES", 16, 14, 4);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::FG, theme::BG);
  g.drawString(ctx.clock, 464, 14, 4);
  g.setTextDatum(TL_DATUM);
  sensorPanel(ctx, s);
  sensorStrip(ctx, s);
}

// ============================================================================
//  clock() por skin: redibuja SOLO el area del reloj (opaco) -> sin el flash
//  del redibujo completo cada minuto.
// ============================================================================
static void cardsClock(const SkinContext& ctx) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(390, 14, 82, 29, theme::PANEL);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::FG, theme::PANEL);
  g.drawString(ctx.clock, 468, 15, 4);
  g.setTextDatum(TL_DATUM);
}
static void minClock(const SkinContext& ctx) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(386, 16, 82, 30, theme::BG);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::FG, theme::BG);
  g.drawString(ctx.clock, 464, 18, 4);
  g.setTextDatum(TL_DATUM);
}
static void watchClock(const SkinContext& ctx) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(148, 52, 184, 56, theme::BG);          // reloj central grande (font6)
  g.setTextDatum(MC_DATUM);
  g.setTextColor(theme::FG, theme::BG);
  g.drawString(ctx.clock, 240, 78, 6);
}
static void sensoresClock(const SkinContext& ctx) {
  TFT_eSPI& g = *ctx.tft;
  g.fillRect(386, 12, 82, 30, theme::BG);
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::FG, theme::BG);
  g.drawString(ctx.clock, 464, 14, 4);
  g.setTextDatum(TL_DATUM);
}

// ============================================================================
//  Registro
// ============================================================================
static const Skin SKINS[] = {
  { "Cards",    cardsFull,    cardsKeycap,    cardsStatus,    cardsStick, cardsClock,    cardsEncStrip },
  { "Minimal",  minFull,      minKeycap,      minStatus,      nullptr,    minClock,      noEncoder },
  { "Watch",    watchFull,    watchKeycap,    watchStatus,    nullptr,    watchClock,    noEncoder },
  { "Sensores", sensoresFull, sensoresKeycap, sensoresStatus, nullptr,    sensoresClock, noEncoder },
};

namespace skins {
uint8_t count() { return sizeof(SKINS) / sizeof(SKINS[0]); }
const Skin& get(uint8_t i) { return SKINS[i < count() ? i : 0]; }
const char* name(uint8_t i) { return get(i).name; }
}  // namespace skins
