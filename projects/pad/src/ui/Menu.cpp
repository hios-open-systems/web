#include "Menu.h"
#include <Arduino.h>
#include <math.h>
#include <esp_heap_caps.h>
#include "../app/Theme.h"
#include "../app/AppState.h"
#include "UiKit.h"
#include "Skin.h"

namespace menu {

// ---------------------------------------------------------------------------
//  Menu de UN nivel: cada pagina (grupos de capas + Apariencia + Sistema) muestra
//  hasta 5 cards sobre los 5 botones fisicos. Los botones ELIGEN (capa -> salta;
//  setting editable -> el encoder ajusta el valor en vivo; WiFi/Calibrar -> accion).
//  El encoder gira = cambiar de pagina; long-press = cerrar. Sin carrusel ni caratula.
//
//  Grupos (nivel "pagina"): cada capa declara su LayerGroup en DefaultConfig;
//  aca solo decidimos nombre/color/orden.
// ---------------------------------------------------------------------------
struct GroupDef { const char* name; LayerGroup tag; uint16_t color; };
static const GroupDef GROUPS[] = {
  {"Trabajo",    LayerGroup::TRABAJO,    theme::CYAN},
  {"Multimedia", LayerGroup::MULTIMEDIA, theme::MAGENTA},
  {"Web",        LayerGroup::WEB,        theme::BLUE},
  {"Llamadas",   LayerGroup::LLAMADAS,   theme::ROSE},
  {"Luces",      LayerGroup::SISTEMA,    theme::VIOLET},   // RGB (iluminacion); el nombre "Sistema"
};                                                          // choca con la pagina de settings Sistema
static const int G_COUNT = sizeof(GROUPS) / sizeof(GROUPS[0]);

static KeyMap* s_km = nullptr;
static bool    s_open     = false;
static int     s_groupSel = 0;     // grupo/pagina actual (0..pageCount()-1)
static int     s_sel      = 0;     // indice REAL: capa elegida o item de ajuste
static bool    s_editItem = false; // ajustando un setting (el encoder cambia el valor)
static bool    s_dirty    = true;
static bool    s_needFull = true;

// --- indices de los items de ajuste (despues de las capas) ---
static int idxBright() { return s_km ? s_km->count() : 0; }
static int idxTheme()  { return idxBright() + 1; }
static int idxAccent() { return idxBright() + 2; }
static int idxSkin()   { return idxBright() + 3; }
static int idxDim()    { return idxBright() + 4; }
static int idxClock()  { return idxBright() + 5; }
static int idxWifi()   { return idxBright() + 6; }
static int idxCal()    { return idxBright() + 7; }
static int idxPrec()   { return idxBright() + 8; }
static const int N_SETTINGS = 9;

// Capas que pertenecen a un grupo, en orden de capa. Devuelve cuantas (<=max).
static int groupLayers(LayerGroup tag, uint8_t* out, int maxOut) {
  int k = 0;
  if (!s_km) return 0;
  for (uint8_t i = 0; i < s_km->count() && k < maxOut; i++)
    if (s_km->layer(i).group == tag) out[k++] = i;
  return k;
}
static int groupIndexOf(LayerGroup g) {
  for (int i = 0; i < G_COUNT; i++) if (GROUPS[i].tag == g) return i;
  return 0;
}

// Paginas del picker = grupos de capas + paginas de settings al final. Los settings
// se parten en Apariencia (personalizacion) y Sistema (config). s_groupSel >= G_COUNT
// => pagina de settings (indice = settingsPageIdx()). start/count en indices relativos
// a idxBright() (los 8 items ya estan ordenados: 0-4 apariencia, 5-7 sistema).
struct SettingsPage { const char* name; uint16_t color; int start; int count; const char* items; };
static const SettingsPage SET_PAGES[] = {
  { "Apariencia", theme::MAGENTA, 0, 5, "Brillo  Tema  Color  Skin  Dimmer" },
  { "Sistema",    theme::GREEN,   5, 4, "Hora  WiFi  Calibrar  Precision" },
};
static const int SET_PAGE_COUNT = sizeof(SET_PAGES) / sizeof(SET_PAGES[0]);

static int  pageCount()       { return G_COUNT + SET_PAGE_COUNT; }
static bool settingsPage()    { return s_groupSel >= G_COUNT; }
static int  settingsPageIdx() { return s_groupSel - G_COUNT; }      // valido solo si settingsPage()
static const char* pageName()  { return settingsPage() ? SET_PAGES[settingsPageIdx()].name  : GROUPS[s_groupSel].name; }
static uint16_t    pageColor() { return settingsPage() ? SET_PAGES[settingsPageIdx()].color : GROUPS[s_groupSel].color; }

void init(KeyMap* km) { s_km = km; }

void open(uint8_t currentLayer) {
  s_open = true; s_editItem = false;
  s_sel = currentLayer;
  s_groupSel = (s_km && currentLayer < s_km->count())
             ? groupIndexOf(s_km->layer(currentLayer).group) : 0;
  s_dirty = true; s_needFull = true;
}
void close() {
  s_open = false; s_editItem = false;
}
bool isOpen() { return s_open; }

// Hay botones-card en TODAS las paginas (capas y settings): los botones eligen.
bool inLayerPicker() { return s_open; }

// Boton i (0..4): en pagina de capas salta a la capa; en pagina de settings elige el
// item (los editables entran en modo ajuste -> el encoder cambia el valor; WiFi/Calibrar
// son acciones directas). Asi todo se elige con botones, sin carrusel ni caratula.
MenuResult pickButton(uint8_t i) {
  if (!s_open) return MenuResult::NONE;
  if (settingsPage()) {
    const SettingsPage& sp = SET_PAGES[settingsPageIdx()];
    if ((int)i >= sp.count) return MenuResult::NONE;
    int item = idxBright() + sp.start + i;
    if (item == idxCal())  { s_editItem = false; return MenuResult::CALIBRATE; }
    if (item == idxWifi()) { s_editItem = false; return MenuResult::WIFI_SETUP; }
    if (s_editItem && s_sel == item) s_editItem = false;   // 2do toque del mismo item: listo
    else { s_sel = item; s_editItem = true; }              // entra en ajuste
    s_dirty = true;
    return MenuResult::NONE;
  }
  uint8_t lys[5]; int k = groupLayers(GROUPS[s_groupSel].tag, lys, 5);
  if ((int)i >= k) return MenuResult::NONE;
  s_sel = lys[i];
  return MenuResult::SWITCH_LAYER;
}

// ---------------------------------------------------------------------------
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
    int m = (int)appstate::prefs.clockMinute + delta;   // ajuste fino (±1 min)
    while (m < 0) m += 24 * 60;
    while (m >= 24 * 60) m -= 24 * 60;
    appstate::prefs.clockMinute = (uint16_t)m;
    appstate::prefs.clockSetAtMs = millis();
  } else if (s_sel == idxPrec()) {
    int p = (int)appstate::prefs.stickPrecision + delta;
    if (p < 1) p = 1;
    if (p > 7) p = 7;
    appstate::prefs.stickPrecision = (uint8_t)p;
  }
}

void turn(int delta) {
  if (!s_open) return;
  if (s_editItem) { editSelected(delta); s_dirty = true; return; } // ajustando -> cambia el valor
  s_groupSel = (s_groupSel + delta + pageCount()) % pageCount();   // si no, cambia de pagina
  s_dirty = true;
}

MenuResult press() {                               // encoder press: solo cierra el ajuste en curso
  if (!s_open) return MenuResult::NONE;
  if (s_editItem) { s_editItem = false; s_dirty = true; }
  return MenuResult::NONE;
}

void back() { close(); }                           // long-press del encoder: cierra el menu
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
  if (i == idxPrec()) return theme::ROSE;
  return theme::GREEN;
}
static uint16_t uiAccent() {
  return s_editItem ? itemAccent(s_sel) : pageColor();
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
  if (i == idxPrec()) return "Precision";
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
  if (i == idxBright()) {
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
  } else if (i == idxPrec()) {
    snprintf(buf, len, "%u/7", appstate::prefs.stickPrecision);
  } else {
    snprintf(buf, len, "stick");
  }
  return buf;
}

// Iconos vectoriales de los items de ajuste (sobre el TFT). El fondo (bg) es conocido.
static void drawMenuIcon(TFT_eSPI& g, int cx, int cy, int i, uint16_t col, uint16_t bg) {
  if (i == idxBright()) {                         // brillo: sol
    g.fillCircle(cx, cy, 6, col);
    for (uint8_t a = 0; a < 8; a++) {
      float t = a * 0.785398f;
      int x0 = cx + (int)(9 * cosf(t)),  y0 = cy + (int)(9 * sinf(t));
      int x1 = cx + (int)(13 * cosf(t)), y1 = cy + (int)(13 * sinf(t));
      g.drawLine(x0, y0, x1, y1, col);
      g.drawLine(x0, y0 + 1, x1, y1 + 1, col);
    }
    return;
  }
  if (i == idxTheme()) {                          // tema: sol / luna
    if (appstate::prefs.themeMode == theme::MODE_LIGHT) g.fillCircle(cx, cy, 11, col);
    else { g.fillCircle(cx - 3, cy, 12, col); g.fillCircle(cx + 4, cy - 3, 12, bg); }
    return;
  }
  if (i == idxAccent()) {                         // color: muestras de acento
    for (uint8_t a = 0; a < 7; a++) g.fillCircle(cx - 18 + a * 6, cy, 3, theme::accentByIndex(a));
    g.drawRoundRect(cx - 24, cy - 9, 48, 18, 9, col);
    return;
  }
  if (i == idxSkin()) {                           // skin: dos paneles
    g.drawRoundRect(cx - 12, cy - 8, 18, 15, 3, col);
    g.fillRoundRect(cx - 6, cy - 2, 18, 15, 3, theme::blend(bg, col, 90));
    g.drawRoundRect(cx - 6, cy - 2, 18, 15, 3, col);
    return;
  }
  if (i == idxDim()) {                            // dimmer
    g.drawRoundRect(cx - 18, cy - 10, 36, 20, 5, col);
    g.fillRoundRect(cx - 14, cy - 5, 22, 10, 5, theme::blend(bg, col, 90));
    return;
  }
  if (i == idxClock()) {                          // hora
    g.drawCircle(cx, cy, 13, col); g.drawCircle(cx, cy, 12, col);
    g.drawFastVLine(cx, cy - 9, 10, col); g.drawLine(cx, cy, cx + 7, cy + 5, col);
    return;
  }
  if (i == idxWifi()) {                           // wifi: arcos + punto
    int by = cy + 11; g.fillCircle(cx, by, 2, col);
    for (int r = 6; r <= 16; r += 5)
      for (int a = -140; a <= -40; a += 5) {
        float t = a * 0.0174533f;
        g.drawPixel(cx + (int)(r * cosf(t)), by + (int)(r * sinf(t)), col);
      }
    return;
  }
  if (i == idxPrec()) {                           // precision: barras crecientes
    for (int b = 0; b < 4; b++) { int bh = 5 + b * 5; g.fillRect(cx - 15 + b * 9, cy + 9 - bh, 6, bh, col); }
    return;
  }
  g.drawCircle(cx, cy, 13, col);                  // calibrar: target
  g.drawCircle(cx, cy, 6, col);
  g.drawFastHLine(cx - 16, cy, 32, col);
  g.drawFastVLine(cx, cy - 16, 32, col);
}

// Picker unificado: 5 cards = 5 botones fisicos. En pagina de capas cada card es una
// capa; en pagina de settings cada card es un item con su valor (el que se ajusta queda
// resaltado). Los botones eligen en ambos casos -> mismo componente, sin carrusel/caratula.
static void renderPicker(TFT_eSPI& tft) {
  tft.fillRect(0, 74, 480, 142, theme::BG);
  const bool settings = settingsPage();
  uint8_t lys[5]; int k; int base = 0;
  if (settings) { const SettingsPage& sp = SET_PAGES[settingsPageIdx()]; k = sp.count; base = idxBright() + sp.start; }
  else          { k = groupLayers(GROUPS[s_groupSel].tag, lys, 5); }
  const int N = 5, gap = 8;
  const int cw = (480 - gap * (N + 1)) / N;        // ~83px
  const int y = 82, ch = 118;
  char buf[16];
  for (int i = 0; i < N; i++) {
    int x = gap + i * (cw + gap);
    bool occ = i < k;
    int item = (settings && occ) ? base + i : -1;
    bool editing = settings && occ && s_editItem && s_sel == item;
    uint16_t accent = occ ? (settings ? itemAccent(item) : s_km->layer(lys[i]).color) : theme::EDGE;
    uint16_t fill   = occ ? theme::CARD : theme::DARK;
    tft.fillRoundRect(x, y, cw, ch, 10, fill);
    tft.drawRoundRect(x, y, cw, ch, 10, accent);
    if (occ) tft.drawRoundRect(x + 1, y + 1, cw - 2, ch - 2, 9, theme::blend(accent, theme::FG, editing ? 90 : 50));
    tft.setTextDatum(MC_DATUM);
    if (occ) {
      const char* nm = settings ? itemTitle(item) : s_km->layer(lys[i]).name;
      const int icx = x + cw / 2, icy = y + 30;
      if (settings) {
        drawMenuIcon(tft, icx, icy, item, accent, fill);          // icono vectorial del setting
      } else {
        const int ir = 17;                                        // capa: chip + inicial (por ahora)
        const uint16_t chip = theme::blend(fill, accent, 32);
        tft.fillCircle(icx, icy, ir, chip);
        tft.drawCircle(icx, icy, ir, accent);
        char ini[2] = { nm[0], 0 };
        tft.setTextColor(accent, chip);
        tft.drawString(ini, icx, icy + 1, 4);
      }
      uikit::fitText(tft, nm, x + cw / 2, y + 64, cw - 8, theme::FG, fill, 2);   // leyenda
      if (settings) {                                                            // valor del setting
        uikit::fitText(tft, itemMeta(item, buf, sizeof(buf)), x + cw / 2, y + ch - 18, cw - 8,
                       editing ? accent : theme::SOFT, fill, 2);
      } else {                                                                   // numero de boton
        tft.setTextColor(theme::DIM, fill);
        tft.drawNumber(i + 1, x + cw / 2, y + ch - 18, 2);
      }
      tft.fillRoundRect(x + 10, y + ch - 8, cw - 20, 4, 2, accent);
    } else {
      tft.setTextColor(theme::DIM, fill);
      tft.drawString("--", x + cw / 2, y + ch / 2, 4);
    }
  }
  tft.setTextDatum(MC_DATUM);                       // caption
  tft.setTextColor(theme::SOFT, theme::BG);
  tft.drawString(settings ? "apreta un boton para elegir / ajustar" : "apreta un boton para saltar a la capa",
                 240, 208, 1);
}

static void drawHeader(TFT_eSPI& tft) {
  tft.fillRect(0, 0, 480, 70, theme::PANEL);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(theme::SOFT, theme::PANEL);
  tft.drawString("CONTROL CENTER", 240, 16, 1);
  tft.setTextColor(theme::FG, theme::PANEL);
  tft.drawString(pageName(), 240, 44, 4);
  char p[8]; snprintf(p, sizeof(p), "%d/%d", s_groupSel + 1, pageCount());
  tft.setTextDatum(MR_DATUM);
  tft.setTextColor(pageColor(), theme::PANEL);
  tft.drawString(p, 470, 14, 2);
}

static void drawHint(TFT_eSPI& tft) {
  tft.fillRect(0, 218, 480, 30, theme::BG);
  uint16_t bg = theme::PANEL;
  tft.fillRoundRect(78, 220, 92, 22, 11, bg);
  tft.fillRoundRect(194, 220, 92, 22, 11, bg);
  tft.fillRoundRect(310, 220, 92, 22, 11, bg);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(theme::SOFT, bg);
  const char *a, *b, *c;
  if (s_editItem) { a = "ajustar"; b = "listo"; c = "salir"; }   // encoder ajusta el valor
  else            { a = "grupo";   b = "boton"; c = "salir"; }   // encoder cambia pagina; botones eligen
  tft.drawString(a, 124, 231, 1);
  tft.drawString(b, 240, 231, 1);
  tft.drawString(c, 356, 231, 1);
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
  else if (s_sel == idxPrec()) pct = (uint8_t)(appstate::prefs.stickPrecision * 100 / 7);
  uikit::progress(tft, {bx, by, bw, bh}, pct, accent, theme::DARK);
  tft.drawRoundRect(bx, by, bw, bh, 11, theme::EDGE);
  char b[16]; itemMeta(s_sel, b, sizeof(b));
  tft.fillRoundRect(414, by - 1, 62, bh + 2, 12, theme::PANEL);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(accent, theme::PANEL);
  tft.drawString(b, 445, by + 11, 2);
}

static void renderBody(TFT_eSPI& tft) {
  renderPicker(tft);   // capas y settings comparten el mismo render de cards
}

void render(TFT_eSPI& tft) {
  if (!s_km) return;

  if (s_needFull) {
    tft.fillScreen(theme::BG);
    drawHeader(tft);
    tft.fillRect(0, 68, 480, 4, uiAccent());
    renderBody(tft);
    drawHint(tft);
    drawEditor(tft);
    s_needFull = false; s_dirty = false;
    return;
  }
  if (!s_dirty) return;
  s_dirty = false;
  drawHeader(tft);
  tft.fillRect(0, 68, 480, 4, uiAccent());
  renderBody(tft);
  drawHint(tft);
  drawEditor(tft);
}

}  // namespace menu
