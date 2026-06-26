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
// Linea de estado WiZ en el centro del header (solo en la capa WiZ y con companion vivo).
// La dibujan cardsHeader (full) y cardsStatus (en vivo, al llegar feedback del companion).
static void drawWizHeader(TFT_eSPI& g, KeyMap& km, const UiSnapshot& s) {
  g.fillRect(186, 4, 200, layout::HEADER_H - 6, theme::PANEL);   // limpia la zona central
  if (!(s.live && strcmp(km.layer(s.activeLayer).name, "WiZ") == 0)) return;
  char w[40];
  snprintf(w, sizeof(w), "%s  %s  %s %u%%", s.wizRoom, s.wizTarget, s.wizOn ? "ON" : "OFF", s.wizBright);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(s.wizOn ? theme::YELLOW : theme::DIM, theme::PANEL);
  g.drawString(w, 286, 16, 2);
  g.setTextDatum(TL_DATUM);
}

static void cardsHeader(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  const Layer& L = km.layer(s.activeLayer);
  g.fillRect(0, 0, layout::W, layout::HEADER_H, theme::PANEL);
  g.fillRect(0, layout::HEADER_H, layout::W, layout::HEADER_ACC, L.color);
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::PANEL);
  g.drawString("HIOS PAD", 12, 6, 1);
  clip(g, L.name, 12, 15, 168, 4, theme::FG, theme::PANEL);
  if (strcmp(L.name, "WiZ") != 0) pips(g, km, s.activeLayer, 21, theme::PANEL);   // en WiZ, el centro es para el estado
  g.setTextDatum(TR_DATUM);
  g.setTextColor(theme::SOFT, theme::PANEL);
  g.drawString("USB / listo", 468, 6, 1);
  g.setTextColor(theme::FG, theme::PANEL);
  g.drawString(ctx.clock, 468, 15, 4);
  g.setTextDatum(TL_DATUM);
  drawWizHeader(g, km, s);
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

// Dibuja SOLO el dial del encoder (aguja que gira con encPos + relleno al presionar el SW).
// Reutilizado por la franja completa y por el redibujo parcial. 12 posiciones (sin floats).
static void drawEncDial(TFT_eSPI& g, const UiSnapshot& s, uint16_t encC) {
  using namespace layout;
  static const int8_t DIAL_DX[12] = { 7, 6, 4, 0, -4, -6, -7, -6, -4, 0, 4, 6 };
  static const int8_t DIAL_DY[12] = { 0, 4, 6, 7, 6, 4, 0, -4, -6, -7, -6, -4 };
  const int dcx = ENC_S1_X + 18, dcy = ENC_Y + ENC_H / 2, dr = 9;
  const bool encDown = (s.buttons >> 5) & 1;
  const int di = (int)(((s.encPos % 12) + 12) % 12);
  if (encDown) g.fillCircle(dcx, dcy, dr, encC);
  else         g.drawCircle(dcx, dcy, dr, encC);
  const uint16_t mark = encDown ? theme::BG : encC;
  g.drawLine(dcx, dcy, dcx + DIAL_DX[di], dcy + DIAL_DY[di], mark);
  g.fillCircle(dcx + DIAL_DX[di], dcy + DIAL_DY[di], 2, mark);
}

// Redibujo PARCIAL: limpia solo el area del dial y lo repinta. Girar/apretar el encoder
// no debe flashear los boxes de companion/mouse -> esto toca solo el dial.
static void cardsEncDial(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSPI& g = *ctx.tft; KeyMap& km = *ctx.km;
  using namespace layout;
  const Layer& L = km.layer(s.activeLayer);
  const bool ovr = (s.encMode != 0 && s.encMode < 5);
  const uint16_t encC = ovr ? theme::CYAN : L.color;
  const int dcx = ENC_S1_X + 18, dcy = ENC_Y + ENC_H / 2, dr = 9;
  g.fillRect(dcx - dr - 1, dcy - dr - 1, 2 * dr + 3, 2 * dr + 3, theme::PANEL);   // limpia solo el dial
  drawEncDial(g, s, encC);
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
  drawEncDial(g, s, encC);   // dial: aguja gira con encPos + pinta al presionar el SW
  g.setTextDatum(TL_DATUM);
  g.setTextColor(theme::DIM, theme::PANEL);
  g.drawString(ovr ? "ENCODER 2x" : "ENCODER", ENC_S1_X + 36, ENC_Y + 6, 1);
  clip(g, encLab, ENC_S1_X + 36, ENC_Y + 16, ENC_S1_W - 44, 2, encC, theme::PANEL);

  uint16_t f2 = theme::blend(theme::BG, L.color, 42);
  g.fillRoundRect(ENC_S2_X, ENC_Y, ENC_S2_W, ENC_H, 8, f2);
  // Estado del companion (¿esta reportando?) en vez del indicador estatico de 'menu'
  // (el press=menu se ve en otras pantallas). Punto lleno verde = enlace vivo.
  const uint16_t cdot = s.live ? theme::GREEN : theme::DIM;
  g.fillCircle(ENC_S2_X + 16, ENC_Y + ENC_H / 2, 4, cdot);
  g.setTextDatum(ML_DATUM);
  g.setTextColor(theme::SOFT, f2);
  g.drawString("companion", ENC_S2_X + 28, ENC_Y + 11, 1);
  g.setTextColor(s.live ? theme::GREEN : theme::DIM, f2);
  g.drawString(s.live ? "reportando" : "sin enlace", ENC_S2_X + 28, ENC_Y + 22, 1);

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
  drawWizHeader(*ctx.tft, *ctx.km, s);   // refresca el estado WiZ en vivo (al llegar feedback)
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
//  SECCION MONITOR - 3 vistas de telemetria real del companion, cada una es la
//  capa homonima: General (temps+coolers+RAM), Red (throughput+IP), Nucleos
//  (carga por core). Sin companion: "s/d" + pill "sin PC". Datos universales
//  (carga/nucleos/RAM/red/IP) por modulo os de Node; temps/fans best-effort.
// ============================================================================
// Historial para los sparklines (~1 muestra por update del companion).
static const int HN = 56;
static uint8_t  s_hist[4][HN];  // 0=cpuT 1=gpuT 2=cpuL 3=gpuL (0..100, 255=s/d)
static int      s_histHead = 0, s_histCount = 0;
static uint16_t s_net[2][HN];   // 0=down 1=up (KB/s, cap 65535 para el spark)
static int      s_netHead = 0, s_netCount = 0;
static uint16_t s_disk[2][HN];  // 0=lectura 1=escritura (KB/s, cap 65535)
static int      s_diskHead = 0, s_diskCount = 0;

static uint8_t normTempPct(int16_t t) {            // 30..95C -> 0..100 (clamp); 255 = s/d
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
static void drawSpark(TFT_eSprite& g, int metric, int spx, int spy, int spw, int sph, uint16_t col) {
  int n = s_histCount;
  if (n < 2) return;
  g.drawFastHLine(spx, spy + sph, spw, theme::EDGE);       // base
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
// Sparkline de throughput (red/disco): auto-escala al maximo de la ventana (KB/s
// sin tope fijo). Generico sobre el buffer/head/count que se le pase.
static void drawRateSpark(TFT_eSprite& g, const uint16_t* row, int head, int count,
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

// --- helpers de color por umbral ---
static uint16_t loadColor(uint8_t v) { return v >= 90 ? theme::RED : (v >= 70 ? theme::YELLOW : theme::GREEN); }
static uint16_t tempColor(int16_t t) { return t >= 80 ? theme::RED : (t >= 65 ? theme::YELLOW : theme::GREEN); }
static uint16_t pctColor(int p)      { return p >= 90 ? theme::RED : (p >= 75 ? theme::YELLOW : theme::CYAN); }
// KB/s -> numero + unidad. 0xFFFFFFFF => "s/d".
static void fmtRate(uint32_t kbs, char* num, size_t n, const char** unit) {
  if (kbs == 0xFFFFFFFF) { strncpy(num, "s/d", n); num[n - 1] = 0; *unit = ""; return; }
  if (kbs >= 1024) { unsigned long t = (kbs * 10UL) / 1024; snprintf(num, n, "%lu.%lu", t / 10, t % 10); *unit = "MB/s"; }
  else { snprintf(num, n, "%lu", (unsigned long)kbs); *unit = "KB/s"; }
}

// --- cabecera comun de las vistas de monitor ---
static void monitorTitle(TFT_eSprite& g, const SkinContext& ctx, const char* title, uint16_t col) {
  g.setTextDatum(TL_DATUM); g.setTextColor(col, theme::BG);       g.drawString(title, 16, 14, 4);
  g.setTextDatum(TR_DATUM); g.setTextColor(theme::FG, theme::BG); g.drawString(ctx.clock, 464, 14, 4);
  g.setTextDatum(TL_DATUM);
}
static void livePill(TFT_eSprite& g, const UiSnapshot& s) {       // LIVE / sin PC
  uint16_t pc = s.live ? theme::GREEN : theme::DIM;
  const int px = 232, pw = 84;
  g.fillRoundRect(px, 16, pw, 22, 11, theme::blend(theme::BG, pc, 50));
  g.drawRoundRect(px, 16, pw, 22, 11, pc);
  g.setTextDatum(MC_DATUM); g.setTextColor(pc, theme::blend(theme::BG, pc, 50));
  g.drawString(s.live ? "LIVE" : "sin PC", px + pw / 2, 27, 2);
  g.setTextDatum(TL_DATUM);
}

// Sprite full-screen en PSRAM: dibujamos cada vista offscreen y la empujamos de
// una -> sin flicker, sin redibujo parcial. Lazy + compartido por las 4 vistas
// (nunca se muestran a la vez). setTextFont(1) tras crear = init de gfxFont
// (sin eso, drawString con fuente GFX dispara boot loop).
static TFT_eSprite* monSprite(TFT_eSPI* tft) {
  static TFT_eSprite* spr = nullptr;
  static bool tried = false;
  if (!spr && !tried) {
    tried = true;
    spr = new TFT_eSprite(tft);
    spr->setColorDepth(16);
    if (!spr->createSprite(layout::W, layout::H)) { delete spr; spr = nullptr; }  // sin PSRAM/OOM
    else spr->setTextFont(1);
  }
  return spr;
}
// Marco + titulo de una tarjeta.
static void monCard(TFT_eSprite& g, int x, int y, int w, int h, const char* title, int titleFont, uint16_t titleCol) {
  g.fillRoundRect(x, y, w, h, 12, theme::CARD);
  g.drawRoundRect(x, y, w, h, 12, theme::EDGE);
  g.setTextDatum(TL_DATUM); g.setTextColor(titleCol, theme::CARD);
  g.drawString(title, x + 14, y + 10, titleFont);
}
// (sin barra mic/cam en el monitor: es telemetria, no estado de la PC -> se gano
//  el espacio inferior para RAM/VRAM/uptime/IO)

// --- VISTA GENERAL: tarjeta por dispositivo (temp+carga+cooler) + barra RAM ---
static void deviceCard(TFT_eSprite& g, int x, int y, int w, int h, const char* name, int sparkMetric,
                       int16_t tempC, uint8_t load, int fan, bool fanRpm) {
  monCard(g, x, y, w, h, name, 4, theme::SOFT);                 // CPU / GPU
  bool noT = tempC <= -1000;
  uint16_t tc = noT ? theme::DIM : tempColor(tempC);
  // cooler en el header (derecha)
  bool noF = fanRpm ? (fan < 0) : (fan == 255);
  char fb[16];
  if (noF) strcpy(fb, "fan s/d");
  else if (fanRpm) snprintf(fb, sizeof(fb), "%d rpm", fan);
  else snprintf(fb, sizeof(fb), "fan %d%%", fan);
  g.setTextDatum(TR_DATUM); g.setTextColor(noF ? theme::DIM : theme::SOFT, theme::CARD);
  g.drawString(fb, x + w - 14, y + 14, 2); g.setTextDatum(TL_DATUM);
  // temperatura grande + spark
  g.setTextDatum(ML_DATUM);
  if (noT) { g.setTextColor(theme::DIM, theme::CARD); g.drawString("s/d", x + 14, y + 66, 4); }
  else {
    char b[8]; snprintf(b, sizeof(b), "%d", tempC);
    g.setTextColor(tc, theme::CARD); g.drawString(b, x + 14, y + 66, 6);
    g.setTextColor(theme::SOFT, theme::CARD); g.drawString("C", x + 14 + g.textWidth(b, 6) + 4, y + 66, 4);
  }
  g.setTextDatum(TL_DATUM);
  drawSpark(g, sparkMetric, x + w - 98, y + 38, 84, 44, noT ? theme::DIM : tc);
  // carga: etiqueta + % + barra
  int by = y + h - 50;
  bool noL = load == 255;
  uint16_t lc = noL ? theme::DIM : loadColor(load);
  char lb[8]; if (noL) strcpy(lb, "s/d"); else snprintf(lb, sizeof(lb), "%u%%", load);
  g.setTextDatum(TL_DATUM); g.setTextColor(theme::DIM, theme::CARD); g.drawString("carga", x + 14, by, 2);
  g.setTextDatum(TR_DATUM); g.setTextColor(lc, theme::CARD);         g.drawString(lb, x + w - 14, by, 2);
  g.setTextDatum(TL_DATUM);
  int bx = x + 14, bw = w - 28, byy = by + 22, bh = 10;
  g.fillRoundRect(bx, byy, bw, bh, 5, theme::DARK);
  if (!noL) g.fillRoundRect(bx, byy, (int)load * bw / 100, bh, 5, lc);
}
// Barra de uso 0..100 con etiqueta y valor (RAM/VRAM/disco). pct<0 = s/d.
static void usageBar(TFT_eSprite& g, int x, int y, int w, int h, const char* label, int pct, const char* valStr, uint16_t col) {
  g.fillRoundRect(x, y, w, h, 8, theme::CARD);
  g.drawRoundRect(x, y, w, h, 8, theme::EDGE);
  g.setTextDatum(ML_DATUM); g.setTextColor(theme::SOFT, theme::CARD); g.drawString(label, x + 12, y + h / 2, 2);
  int bx = x + 58, bw = w - 58 - 88, by = y + (h - 10) / 2, bh = 10;
  g.fillRoundRect(bx, by, bw, bh, 5, theme::DARK);
  if (pct >= 0) g.fillRoundRect(bx, by, pct * bw / 100, bh, 5, col);
  g.setTextDatum(MR_DATUM); g.setTextColor(pct < 0 ? theme::DIM : col, theme::CARD); g.drawString(valStr, x + w - 10, y + h / 2, 2);
  g.setTextDatum(TL_DATUM);
}
// Tarjeta de throughput (descarga/subida/lectura/escritura): numero grande + spark.
static void rateCard(TFT_eSprite& g, int x, int y, int w, int h, const char* label, uint16_t col,
                     uint32_t kbs, const uint16_t* row, int head, int count) {
  monCard(g, x, y, w, h, label, 2, theme::DIM);
  char num[16]; const char* unit; fmtRate(kbs, num, sizeof(num), &unit);
  bool no = kbs == 0xFFFFFFFF;
  g.setTextDatum(ML_DATUM); g.setTextColor(no ? theme::DIM : col, theme::CARD); g.drawString(num, x + 14, y + 52, 6);
  g.setTextColor(theme::SOFT, theme::CARD); g.drawString(unit, x + 14 + g.textWidth(num, 6) + 6, y + 58, 2);
  g.setTextDatum(TL_DATUM);
  drawRateSpark(g, row, head, count, x + 14, y + h - 44, w - 28, 34, col);
}

// --- VISTA GENERAL: CPU/GPU (temp+spark+carga+cooler) + RAM/VRAM + uptime/procesos ---
static void monGeneral(const SkinContext& ctx, const UiSnapshot& s) {
  if (s.live) pushSensorHist(s);
  TFT_eSprite* spr = monSprite(ctx.tft);
  if (!spr) { ctx.tft->setTextColor(theme::RED, theme::BG); ctx.tft->drawString("PSRAM?", 16, 16, 4); return; }
  TFT_eSprite& g = *spr;
  g.fillSprite(theme::BG);
  monitorTitle(g, ctx, "GENERAL", theme::CYAN);
  livePill(g, s);
  const int m = 8, gap = 8, cw = (layout::W - 2 * m - gap) / 2, cy = 48, ch = 150, x2 = m + cw + gap;
  deviceCard(g, m,  cy, cw, ch, "CPU", 0, s.cpuTemp, s.cpuLoad, s.cpuFan, true);
  deviceCard(g, x2, cy, cw, ch, "GPU", 1, s.gpuTemp, s.gpuLoad, s.gpuFan, false);
  // RAM / VRAM
  const int by = cy + ch + 8, bh = 38;
  char rb[8]; if (s.ram == 255) strcpy(rb, "s/d"); else snprintf(rb, sizeof(rb), "%u%%", s.ram);
  usageBar(g, m, by, cw, bh, "RAM", s.ram == 255 ? -1 : s.ram, rb,
           s.ram >= 90 ? theme::RED : (s.ram >= 75 ? theme::YELLOW : theme::MAGENTA));
  char vb[16]; int vpct;
  if (s.vramTotal == 0 || s.vramUsed == 0xFFFF) { strcpy(vb, "s/d"); vpct = -1; }
  else {
    vpct = (int)s.vramUsed * 100 / s.vramTotal;
    unsigned u10 = (s.vramUsed * 10u) / 1024, t10 = (s.vramTotal * 10u) / 1024;
    snprintf(vb, sizeof(vb), "%u.%u/%u.%uG", u10 / 10, u10 % 10, t10 / 10, t10 % 10);
  }
  usageBar(g, x2, by, cw, bh, "VRAM", vpct, vb, vpct < 0 ? theme::DIM : pctColor(vpct));
  // footer: uptime + procesos
  const int fy = by + bh + 14;
  char ub[28];
  if (s.uptimeSec == 0xFFFFFFFF) strcpy(ub, "uptime s/d");
  else {
    uint32_t u = s.uptimeSec, d = u / 86400, h = (u % 86400) / 3600, mn = (u % 3600) / 60;
    if (d) snprintf(ub, sizeof(ub), "uptime %lud %luh", (unsigned long)d, (unsigned long)h);
    else   snprintf(ub, sizeof(ub), "uptime %luh %lum", (unsigned long)h, (unsigned long)mn);
  }
  g.setTextDatum(ML_DATUM); g.setTextColor(theme::SOFT, theme::BG); g.drawString(ub, m + 6, fy, 2);
  char pb[24];
  if (s.procs == 0xFFFF) strcpy(pb, "procesos s/d"); else snprintf(pb, sizeof(pb), "%u procesos", s.procs);
  g.setTextDatum(MR_DATUM); g.setTextColor(theme::SOFT, theme::BG); g.drawString(pb, layout::W - m - 6, fy, 2);
  g.setTextDatum(TL_DATUM);
  g.pushSprite(0, 0);
}

// --- VISTA RED: descarga/subida (auto-escala) + IP local ---
static void monRed(const SkinContext& ctx, const UiSnapshot& s) {
  if (s.live) pushNetHist(s);
  TFT_eSprite* spr = monSprite(ctx.tft);
  if (!spr) { ctx.tft->setTextColor(theme::RED, theme::BG); ctx.tft->drawString("PSRAM?", 16, 16, 4); return; }
  TFT_eSprite& g = *spr;
  g.fillSprite(theme::BG);
  monitorTitle(g, ctx, "RED", theme::GREEN);
  livePill(g, s);
  const int m = 8, gap = 8, cw = (layout::W - 2 * m - gap) / 2, cy = 48, ch = 150, x2 = m + cw + gap;
  rateCard(g, m,  cy, cw, ch, "DESCARGA", theme::CYAN,    s.netDown, s_net[0], s_netHead, s_netCount);
  rateCard(g, x2, cy, cw, ch, "SUBIDA",   theme::MAGENTA, s.netUp,   s_net[1], s_netHead, s_netCount);
  const int iy = cy + ch + 10;
  g.fillRoundRect(m, iy, layout::W - 2 * m, 46, 10, theme::CARD);
  g.drawRoundRect(m, iy, layout::W - 2 * m, 46, 10, theme::EDGE);
  g.setTextDatum(ML_DATUM); g.setTextColor(theme::DIM, theme::CARD); g.drawString("IP local", m + 16, iy + 23, 2);
  g.setTextDatum(MR_DATUM); g.setTextColor(s.ip[0] ? theme::FG : theme::DIM, theme::CARD);
  g.drawString(s.ip[0] ? s.ip : "s/d", layout::W - m - 16, iy + 23, 4);
  g.setTextDatum(TL_DATUM);
  g.pushSprite(0, 0);
}

// --- VISTA NUCLEOS: grilla con etiqueta (Cn) + % + medidor vertical por core ---
static void monCores(const SkinContext& ctx, const UiSnapshot& s) {
  TFT_eSprite* spr = monSprite(ctx.tft);
  if (!spr) { ctx.tft->setTextColor(theme::RED, theme::BG); ctx.tft->drawString("PSRAM?", 16, 16, 4); return; }
  TFT_eSprite& g = *spr;
  g.fillSprite(theme::BG);
  monitorTitle(g, ctx, "NUCLEOS", theme::VIOLET);
  livePill(g, s);
  int n = s.coreCount; if (n > 24) n = 24;
  int avg = 0, cnt = 0;
  for (int i = 0; i < n; i++) if (s.cores[i] <= 100) { avg += s.cores[i]; cnt++; }
  avg = cnt ? avg / cnt : 0;
  g.setTextDatum(TL_DATUM); g.setTextColor(theme::SOFT, theme::BG);
  char sub[36]; if (!n) strcpy(sub, "sin datos por nucleo"); else snprintf(sub, sizeof(sub), "%d nucleos    prom %d%%", n, avg);
  g.drawString(sub, 16, 46, 2);
  if (n) {
    int cols = n <= 8 ? n : (n <= 16 ? (n + 1) / 2 : (n + 2) / 3);
    int rows = (n + cols - 1) / cols;
    const int gx = 10, gy = 70, gw = layout::W - 2 * gx, gh = layout::H - gy - 8;
    int cwid = gw / cols, chei = gh / rows;
    for (int i = 0; i < n; i++) {
      int c = i % cols, r = i / cols;
      int x = gx + c * cwid, y = gy + r * chei, w2 = cwid - 8;
      uint8_t v = s.cores[i] > 100 ? 0 : s.cores[i];
      uint16_t col = loadColor(v);
      char lbl[6]; snprintf(lbl, sizeof(lbl), "C%d", i);
      g.setTextDatum(TL_DATUM); g.setTextColor(theme::DIM, theme::BG); g.drawString(lbl, x, y, 2);
      char pb[6]; snprintf(pb, sizeof(pb), "%u", v);
      g.setTextDatum(TR_DATUM); g.setTextColor(col, theme::BG); g.drawString(pb, x + w2, y, 2);
      g.setTextDatum(TL_DATUM);
      int by = y + 18, bh = chei - 10 - 18; if (bh < 8) bh = 8;
      g.fillRoundRect(x, by, w2, bh, 3, theme::DARK);
      int fh = v * bh / 100;
      if (fh > 0) g.fillRoundRect(x, by + bh - fh, w2, fh, 3, col);
    }
  }
  g.pushSprite(0, 0);
}

// --- VISTA DISCO: uso del volumen + lectura/escritura (auto-escala) ---
static void monDisk(const SkinContext& ctx, const UiSnapshot& s) {
  if (s.live) pushDiskHist(s);
  TFT_eSprite* spr = monSprite(ctx.tft);
  if (!spr) { ctx.tft->setTextColor(theme::RED, theme::BG); ctx.tft->drawString("PSRAM?", 16, 16, 4); return; }
  TFT_eSprite& g = *spr;
  g.fillSprite(theme::BG);
  monitorTitle(g, ctx, "DISCO", theme::YELLOW);
  livePill(g, s);
  const int m = 8, gap = 8, cw = (layout::W - 2 * m - gap) / 2, x2 = m + cw + gap;
  // USO: barra grande
  const int uy = 48, uh = 56;
  g.fillRoundRect(m, uy, layout::W - 2 * m, uh, 12, theme::CARD);
  g.drawRoundRect(m, uy, layout::W - 2 * m, uh, 12, theme::EDGE);
  g.setTextDatum(ML_DATUM); g.setTextColor(theme::SOFT, theme::CARD); g.drawString("USO", m + 16, uy + uh / 2, 4);
  bool noU = s.diskPct == 255;
  uint16_t dc = noU ? theme::DIM : (s.diskPct >= 90 ? theme::RED : (s.diskPct >= 75 ? theme::YELLOW : theme::GREEN));
  int bx = m + 90, bw = layout::W - 2 * m - 90 - 90, byy = uy + (uh - 16) / 2, bh = 16;
  g.fillRoundRect(bx, byy, bw, bh, 8, theme::DARK);
  if (!noU) g.fillRoundRect(bx, byy, (int)s.diskPct * bw / 100, bh, 8, dc);
  char db[8]; if (noU) strcpy(db, "s/d"); else snprintf(db, sizeof(db), "%u%%", s.diskPct);
  g.setTextDatum(MR_DATUM); g.setTextColor(noU ? theme::DIM : dc, theme::CARD); g.drawString(db, layout::W - m - 16, uy + uh / 2, 4);
  g.setTextDatum(TL_DATUM);
  // LECTURA / ESCRITURA
  const int cy = uy + uh + 10, ch = 150;
  rateCard(g, m,  cy, cw, ch, "LECTURA",   theme::CYAN,    s.diskRd, s_disk[0], s_diskHead, s_diskCount);
  rateCard(g, x2, cy, cw, ch, "ESCRITURA", theme::MAGENTA, s.diskWr, s_disk[1], s_diskHead, s_diskCount);
  g.pushSprite(0, 0);
}

static void monKeycap(const SkinContext&, const UiSnapshot&, uint8_t, bool) {}  // vistas sin teclas
// full() y status() de cada vista de monitor son la MISMA funcion: redibuja todo
// al sprite y lo empuja (offscreen -> sin flicker, no hace falta redibujo parcial).

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
static void monClock(const SkinContext& ctx) {
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
  // --- dashboards (elegibles en Apariencia) ---
  { "Cards",    cardsFull,    cardsKeycap,    cardsStatus,    cardsStick, cardsClock,    cardsEncStrip, cardsEncDial },
  { "Minimal",  minFull,      minKeycap,      minStatus,      nullptr,    minClock,      noEncoder },
  { "Watch",    watchFull,    watchKeycap,    watchStatus,    nullptr,    watchClock,    noEncoder },
  // --- vistas de Monitor (forzadas por la capa homonima, NO en el ciclo de Apariencia).
  //     full()==status(): cada una redibuja todo a un sprite y lo empuja (sin flicker). ---
  { "General",  monGeneral, monKeycap, monGeneral, nullptr, monClock, noEncoder },
  { "Red",      monRed,     monKeycap, monRed,     nullptr, monClock, noEncoder },
  { "Nucleos",  monCores,   monKeycap, monCores,   nullptr, monClock, noEncoder },
  { "Disco",    monDisk,    monKeycap, monDisk,    nullptr, monClock, noEncoder },
};
static const uint8_t MONITOR_SKINS = 4;   // las 4 ultimas son vistas de monitor

namespace skins {
uint8_t count() { return sizeof(SKINS) / sizeof(SKINS[0]); }
uint8_t dashboardCount() { return count() - MONITOR_SKINS; }
const Skin& get(uint8_t i) { return SKINS[i < count() ? i : 0]; }
const char* name(uint8_t i) { return get(i).name; }
int monitorIndex(const char* layerName) {                  // capa de monitor -> su skin homonimo
  for (uint8_t i = dashboardCount(); i < count(); i++)
    if (strcmp(SKINS[i].name, layerName) == 0) return (int)i;
  return -1;
}
}  // namespace skins
