#include "Menu.h"
#include <Arduino.h>
#include <math.h>
#include "../app/Theme.h"
#include "../app/AppState.h"
#include "UiKit.h"
#include "Skin.h"

namespace menu {

static KeyMap* s_km = nullptr;
static bool    s_open = false;
static int     s_sel = 0;
static bool    s_editItem = false;
static bool    s_dirty = true;
static bool    s_needFull = true;

static TFT_eSprite* s_spr = nullptr;        // banda del carrusel (sprite, sin parpadeo)
static const int CARW = 480, CARH = 126, CARY = 82;
static const int STEP = 152;                 // separacion entre cards

static int idxBright() { return s_km ? s_km->count() : 0; }
static int idxTheme()  { return idxBright() + 1; }
static int idxAccent() { return idxBright() + 2; }
static int idxSkin()   { return idxBright() + 3; }
static int idxDim()    { return idxBright() + 4; }
static int idxClock()  { return idxBright() + 5; }
static int idxWifi()   { return idxBright() + 6; }
static int idxCal()    { return idxBright() + 7; }

static int itemCountFull() { return (s_km ? s_km->count() : 0) + 8; }

void init(KeyMap* km) { s_km = km; }

void open(uint8_t currentLayer) {
  s_open = true; s_sel = currentLayer; s_editItem = false;
  s_dirty = true; s_needFull = true;
}
void close()  { s_open = false; s_editItem = false; }
bool isOpen() { return s_open; }

static void editSelected(int delta) {
  if (s_sel == idxBright()) {
    int b = (int)appstate::brightness + delta * 5;
    appstate::brightness = (uint8_t)(b < 10 ? 10 : (b > 100 ? 100 : b));
    appstate::prefs.brightness = appstate::brightness;
  } else if (s_sel == idxTheme()) {
    appstate::prefs.themeMode = appstate::prefs.themeMode == theme::MODE_DARK ? theme::MODE_LIGHT : theme::MODE_DARK;
    theme::applyMode(appstate::prefs.themeMode);
    s_needFull = true;
  } else if (s_sel == idxAccent()) {
    int a = (int)appstate::prefs.accentIndex + delta;
    if (a < 0) a = 6;
    if (a > 6) a = 0;
    appstate::prefs.accentIndex = (uint8_t)a;
  } else if (s_sel == idxSkin()) {
    int n = skins::count();
    int v = (int)appstate::prefs.skinIndex + delta;
    if (v < 0) v = n - 1;
    if (v >= n) v = 0;
    appstate::prefs.skinIndex = (uint8_t)v;
  } else if (s_sel == idxDim()) {
    int d = (int)appstate::prefs.dimTimeout + delta;
    if (d < 0) d = 4;
    if (d > 4) d = 0;
    appstate::prefs.dimTimeout = (uint8_t)d;
  } else if (s_sel == idxClock()) {
    int m = (int)appstate::prefs.clockMinute + delta * 5;
    while (m < 0) m += 24 * 60;
    while (m >= 24 * 60) m -= 24 * 60;
    appstate::prefs.clockMinute = (uint16_t)m;
    appstate::prefs.clockSetAtMs = millis();
  }
}

void turn(int delta) {
  if (!s_open) return;
  s_dirty = true;
  if (s_editItem) {
    editSelected(delta);
    return;
  }
  int n = itemCountFull();
  s_sel += delta;
  if (s_sel < 0) s_sel = n - 1;
  if (s_sel >= n) s_sel = 0;
}

MenuResult press() {
  if (!s_open) return MenuResult::NONE;
  s_dirty = true;
  if (s_editItem) { s_editItem = false; return MenuResult::NONE; }
  if (s_sel < idxBright())  return MenuResult::SWITCH_LAYER;
  if (s_sel == idxCal())  return MenuResult::CALIBRATE;
  if (s_sel == idxWifi()) return MenuResult::WIFI_SETUP;
  s_editItem = true;
  return MenuResult::NONE;
}

void back() { close(); }
uint8_t selectedLayer() { return (uint8_t)s_sel; }

// ---------------------------------------------------------------------------
static uint16_t itemAccent(int i) {
  if (i < idxBright()) return s_km->layer(i).color;
  if (i == idxBright()) return theme::YELLOW;
  if (i == idxTheme()) return theme::accentByIndex(appstate::prefs.accentIndex);
  if (i == idxAccent()) return theme::accentByIndex(appstate::prefs.accentIndex);
  if (i == idxSkin()) return theme::VIOLET;
  if (i == idxDim()) return theme::CYAN;
  if (i == idxClock()) return theme::ORANGE;
  if (i == idxWifi()) return theme::CYAN;
  return theme::GREEN;
}

static const char* itemTitle(int i) {
  if (i < idxBright()) return s_km->layer(i).name;
  if (i == idxBright()) return "Brillo";
  if (i == idxTheme()) return "Tema";
  if (i == idxAccent()) return "Color";
  if (i == idxSkin()) return "Skin";
  if (i == idxDim()) return "Dimmer";
  if (i == idxClock()) return "Hora";
  if (i == idxWifi()) return "WiFi";
  return "Calibrar";
}

static const char* dimLabel(uint8_t dim) {
  static const char* labels[] = {"off", "15s", "30s", "60s", "120s"};
  return labels[dim < 5 ? dim : 2];
}

static void timeLabel(uint16_t minute, char* buf, size_t len) {
  snprintf(buf, len, "%02u:%02u", minute / 60, minute % 60);
}

static const char* itemMeta(int i, char* buf, size_t len) {
  if (i < idxBright()) {
    snprintf(buf, len, "capa %d/%d", i + 1, idxBright());
  } else if (i == idxBright()) {
    snprintf(buf, len, "%u%%", appstate::brightness);
  } else if (i == idxTheme()) {
    snprintf(buf, len, "%s", appstate::prefs.themeMode == theme::MODE_LIGHT ? "claro" : "oscuro");
  } else if (i == idxAccent()) {
    snprintf(buf, len, "%s", theme::accentName(appstate::prefs.accentIndex));
  } else if (i == idxSkin()) {
    snprintf(buf, len, "%s", skins::name(appstate::prefs.skinIndex));
  } else if (i == idxDim()) {
    snprintf(buf, len, "%s", dimLabel(appstate::prefs.dimTimeout));
  } else if (i == idxClock()) {
    timeLabel(appstate::prefs.clockMinute, buf, len);
  } else if (i == idxWifi()) {
    snprintf(buf, len, "setup");
  } else {
    snprintf(buf, len, "stick");
  }
  return buf;
}

// Iconos del menu: grilla comun ~±13px, centrados. Como el fondo (fill del card)
// es conocido, la "mordida" de la luna con bg es controlada (no artefactos).
static void drawMenuIcon(int cx, int cy, int i, uint16_t col, uint16_t bg, bool seld) {
  if (i < idxBright()) {                         // capa: well numerado
    int r = seld ? 16 : 13;
    s_spr->fillCircle(cx, cy, r, theme::blend(bg, col, 60));
    s_spr->drawCircle(cx, cy, r, col);
    s_spr->setTextDatum(MC_DATUM);
    s_spr->setTextColor(col, theme::blend(bg, col, 60));
    s_spr->drawNumber(i + 1, cx, cy + 1, seld ? 4 : 2);
    return;
  }
  if (i == idxBright()) {                         // brillo: sol
    s_spr->fillCircle(cx, cy, 6, col);
    for (uint8_t a = 0; a < 8; a++) {
      float t = a * 0.785398f;
      int x0 = cx + (int)(9 * cosf(t)),  y0 = cy + (int)(9 * sinf(t));
      int x1 = cx + (int)(13 * cosf(t)), y1 = cy + (int)(13 * sinf(t));
      s_spr->drawLine(x0, y0, x1, y1, col);
      s_spr->drawLine(x0, y0 + 1, x1, y1 + 1, col);
    }
    return;
  }
  if (i == idxTheme()) {                          // tema: sol / luna
    if (appstate::prefs.themeMode == theme::MODE_LIGHT) {
      s_spr->fillCircle(cx, cy, 11, col);
    } else {
      s_spr->fillCircle(cx - 3, cy, 12, col);
      s_spr->fillCircle(cx + 4, cy - 3, 12, bg);
    }
    return;
  }
  if (i == idxAccent()) {                         // color: muestras de acento
    for (uint8_t a = 0; a < 7; a++)
      s_spr->fillCircle(cx - 18 + a * 6, cy, 3, theme::accentByIndex(a));
    s_spr->drawRoundRect(cx - 24, cy - 9, 48, 18, 9, col);
    return;
  }
  if (i == idxSkin()) {                           // skin: dos paneles apilados
    s_spr->drawRoundRect(cx - 12, cy - 8, 18, 15, 3, col);
    s_spr->fillRoundRect(cx - 6, cy - 2, 18, 15, 3, theme::blend(bg, col, 90));
    s_spr->drawRoundRect(cx - 6, cy - 2, 18, 15, 3, col);
    return;
  }
  if (i == idxDim()) {                            // dimmer
    s_spr->drawRoundRect(cx - 18, cy - 10, 36, 20, 5, col);
    s_spr->fillRoundRect(cx - 14, cy - 5, 22, 10, 5, theme::blend(bg, col, 90));
    return;
  }
  if (i == idxClock()) {                          // hora
    s_spr->drawCircle(cx, cy, 13, col);
    s_spr->drawCircle(cx, cy, 12, col);
    s_spr->drawFastVLine(cx, cy - 9, 10, col);
    s_spr->drawLine(cx, cy, cx + 7, cy + 5, col);
    return;
  }
  if (i == idxWifi()) {                            // wifi: tres arcos + punto
    int by = cy + 11;
    s_spr->fillCircle(cx, by, 2, col);
    for (int r = 6; r <= 16; r += 5)
      for (int a = -140; a <= -40; a += 5) {
        float t = a * 0.0174533f;
        s_spr->drawPixel(cx + (int)(r * cosf(t)), by + (int)(r * sinf(t)), col);
      }
    return;
  }
  s_spr->drawCircle(cx, cy, 13, col);             // calibrar: target
  s_spr->drawCircle(cx, cy, 6, col);
  s_spr->drawFastHLine(cx - 16, cy, 32, col);
  s_spr->drawFastVLine(cx, cy - 16, 32, col);
}

static void drawCard(int sx, int i, bool seld) {
  uint16_t accent = itemAccent(i);
  int w = seld ? 154 : 116, h = seld ? 104 : 76;
  int x = sx - w / 2, y = CARH / 2 - h / 2;
  uint16_t fill = seld ? theme::CARD : theme::DARK;
  s_spr->fillRoundRect(x + 3, y + 5, w, h, 10, theme::BG);
  s_spr->fillRoundRect(x, y, w, h, 10, fill);
  s_spr->drawRoundRect(x, y, w, h, 10, seld ? accent : theme::EDGE);
  if (seld) {
    s_spr->drawRoundRect(x + 1, y + 1, w - 2, h - 2, 9, theme::blend(accent, theme::FG, 55));
    s_spr->fillRoundRect(x + 14, y + 9, w - 28, 4, 2, accent);
  }

  char meta[16];
  drawMenuIcon(sx, y + (seld ? 40 : 26), i, accent, fill, seld);
  uikit::fitText(*s_spr, itemTitle(i), sx, y + h - (seld ? 30 : 26), w - 16,
                 seld ? theme::FG : theme::SOFT, fill, seld ? 4 : 2);
  s_spr->setTextDatum(MC_DATUM);
  s_spr->setTextColor(seld ? accent : theme::DIM, fill);
  s_spr->drawString(itemMeta(i, meta, sizeof(meta)), sx, y + h - 11, 1);
}

static void renderCarousel() {
  s_spr->fillSprite(theme::BG);
  int n = itemCountFull();
  for (int i = 0; i < n; i++) {
    int sx = CARW / 2 + (i - s_sel) * STEP;
    if (sx < -100 || sx > CARW + 100) continue;
    drawCard(sx, i, i == s_sel);
  }
  s_spr->pushSprite(0, CARY);
}

static void drawHint(TFT_eSPI& tft) {
  tft.fillRect(0, 218, 480, 30, theme::BG);
  uint16_t bg = theme::PANEL;
  tft.fillRoundRect(78, 220, 92, 22, 11, bg);
  tft.fillRoundRect(194, 220, 92, 22, 11, bg);
  tft.fillRoundRect(310, 220, 92, 22, 11, bg);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(theme::SOFT, bg);
  tft.drawString(s_editItem ? "ajustar" : "mover", 124, 231, 1);
  tft.drawString(s_editItem ? "guardar" : "elegir", 240, 231, 1);
  tft.drawString("salir", 356, 231, 1);
}

static void drawEditor(TFT_eSPI& tft) {
  const int bx = 70, by = 260, bw = 340, bh = 22;
  tft.fillRect(0, 252, 480, 42, theme::BG);
  if (!s_editItem) return;
  uint8_t pct = 100;
  uint16_t accent = itemAccent(s_sel);
  if (s_sel == idxBright()) pct = appstate::brightness;
  else if (s_sel == idxDim()) pct = appstate::prefs.dimTimeout * 25;
  else if (s_sel == idxClock()) pct = (uint8_t)((appstate::prefs.clockMinute * 100UL) / (24UL * 60UL));
  uikit::progress(tft, {bx, by, bw, bh}, pct, accent, theme::DARK);
  tft.drawRoundRect(bx, by, bw, bh, 11, theme::EDGE);
  char b[16]; itemMeta(s_sel, b, sizeof(b));
  tft.fillRoundRect(414, by - 1, 62, bh + 2, 12, theme::PANEL);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(accent, theme::PANEL);
  tft.drawString(b, 445, by + 11, 2);
}

void render(TFT_eSPI& tft) {
  if (!s_km) return;
  if (!s_spr) {                         // crear el sprite del carrusel (lazy)
    s_spr = new TFT_eSprite(&tft);
    s_spr->setTextFont(1);                // gfxFont=NULL: el ctor de TFT_eSprite no lo inicializa (heap basura -> crash)
    s_spr->setColorDepth(8);
    s_spr->createSprite(CARW, CARH);
  }

  if (s_needFull) {
    tft.fillScreen(theme::BG);
    tft.fillRect(0, 0, 480, 70, theme::PANEL);
    tft.fillRect(0, 68, 480, 4, itemAccent(s_sel));
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(theme::SOFT, theme::PANEL);
    tft.drawString("CONTROL CENTER", 240, 20, 1);
    tft.setTextColor(theme::FG, theme::PANEL);
    tft.drawString("Elegir capa o ajuste", 240, 43, 4);
    renderCarousel();
    drawHint(tft);
    drawEditor(tft);
    s_needFull = false; s_dirty = false;
    return;
  }
  if (!s_dirty) return;
  s_dirty = false;
  tft.fillRect(0, 68, 480, 4, itemAccent(s_sel));
  renderCarousel();      // sprite -> sin parpadeo
  drawHint(tft);
  drawEditor(tft);
}

}  // namespace menu
