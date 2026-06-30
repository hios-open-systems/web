#include "Menu.h"
#include <Arduino.h>
#include <math.h>
#include <esp_heap_caps.h>
#include "../app/Theme.h"
#include "../app/AppState.h"
#include "UiKit.h"
#include "MenuModel.h"

namespace menu {

// ---------------------------------------------------------------------------
//  Menu de UN nivel: cada seccion muestra cards sobre los botones fisicos.
//  Los botones ELIGEN (View -> salta; setting editable -> el encoder ajusta el
//  valor en vivo; WiFi/Calibrar -> accion). El encoder gira = cambiar de seccion;
//  long-press = cerrar. Sin carrusel ni caratula.
// ---------------------------------------------------------------------------
// Un item del menu es una View (por nombre -> robusto a reordenar DefaultConfig)
// o un setting interno. La definicion vive en MenuModel para aislar el render del
// origen de datos; el siguiente paso es reemplazar ese modelo por config runtime.

// ---------------------------------------------------------------------------
//  Tokens de layout del menu. UNA sola fuente para la geometria de la grilla y
//  del tile, en vez de numeros magicos sueltos por todo el render. Cambiar la
//  grilla o el tile = tocar ESTO y nada mas.
// ---------------------------------------------------------------------------
namespace mlay {
constexpr int BODY_Y = 74, BODY_H = 174;                 // zona de grilla (74..248, usa la banda libre)
constexpr int COLS = 5, GAP = 8;                         // 5 columnas, separacion horiz/vert
constexpr int TILE_W = (480 - GAP * (COLS + 1)) / COLS;  // ~83px
constexpr int TILE_H = 80;
constexpr int GRID_Y = 78;                               // top de la fila 0 (filas en 78 y 166)
constexpr int RADIUS = 10;                               // radio del tile
constexpr int INNER = 1,  INNER_RADIUS = RADIUS - INNER; // borde interno sutil: 1px adentro, radio 9
constexpr int SEL_INNER = 2, SEL_RADIUS = RADIUS - SEL_INNER; // 2do borde de la seccion actual (overview)
constexpr int BADGE_X = 6, BADGE_Y = 6, BADGE_W = 19, BADGE_H = 14;  // numero (badge arriba-izq)
constexpr int ICON_DY = 34, LABEL_DY = 62, ICON_R = 15;  // capa: centro icono / centro label / radio del chip
constexpr int SET_ICON_DY = 30, SET_NAME_DY = 54, SET_VAL_DY = 70;   // setting: icono / nombre / valor
constexpr int SEC_ICON_DY = 36, SEC_NAME_DY = 64;        // overview: icono / nombre de seccion
constexpr int TXT_MARGIN = 8;                            // margen lateral del texto (w - TXT_MARGIN)
}  // namespace mlay

static KeyMap* s_km = nullptr;
static bool    s_open     = false;
static int     s_groupSel = 0;     // seccion actual (0..pageCount()-1)
static int     s_sel      = 0;     // indice REAL: capa elegida o item de ajuste
static bool    s_editItem = false; // ajustando un setting (el encoder cambia el valor)
static bool    s_overview = false; // vista de TODAS las secciones (botones 1-10 saltan a una)
static bool    s_dirty    = true;
static bool    s_needFull = true;

// --- indices de los items de ajuste (despues de las capas) ---
static int idxBright() { return s_km ? s_km->count() : 0; }
static int idxTheme()  { return idxBright() + 1; }
static int idxAccent() { return idxBright() + 2; }
static int idxDim()    { return idxBright() + 3; }
static int idxClock()  { return idxBright() + 4; }
static int idxWifi()   { return idxBright() + 5; }
static int idxCal()    { return idxBright() + 6; }
static int idxPrec()   { return idxBright() + 7; }

// Indice de una capa por nombre (-1 si no esta). Robusto a reordenar DefaultConfig.
static int layerIndexByName(const char* name) {
  if (!s_km) return -1;
  for (uint8_t i = 0; i < s_km->count(); i++)
    if (strcmp(s_km->layer(i).name, name) == 0) return (int)i;
  return -1;
}
static int pageCount() { return menumodel::sectionCount(); }
// Pagina que contiene a la capa actual (para abrir el menu en el lugar correcto).
static int pageOfLayer(uint8_t layerIdx) {
  return s_km ? menumodel::sectionOfLayer(*s_km, layerIdx) : 0;
}
static const char* pageName()  { return menumodel::section(s_groupSel).name; }
static uint16_t    pageColor() { return menumodel::section(s_groupSel).color; }

void init(KeyMap* km) { s_km = km; menumodel::begin(km); }

void open(uint8_t currentLayer) {
  s_open = true; s_editItem = false; s_overview = false;
  s_sel = currentLayer;
  s_groupSel = pageOfLayer(currentLayer);
  s_dirty = true; s_needFull = true;
}
void close() {
  s_open = false; s_editItem = false;
}
bool isOpen() { return s_open; }

// Hay botones-card en TODAS las secciones (Views y settings): los botones eligen.
bool inLayerPicker() { return s_open; }

// Boton i (0..9): elige el item i de la seccion actual. View -> salta; setting editable ->
// entra en ajuste (el encoder cambia el valor); WiFi/Calibrar -> accion directa.
MenuResult pickButton(uint8_t i) {
  if (!s_open) return MenuResult::NONE;
  if (s_overview) {                                // overview: el boton i salta a esa pagina
    if ((int)i < pageCount()) { s_groupSel = i; s_overview = false; s_needFull = true; s_dirty = true; }
    return MenuResult::NONE;
  }
  const menumodel::Section& pg = menumodel::section(s_groupSel);
  if ((int)i >= pg.count) return MenuResult::NONE;
  const menumodel::Item& it = pg.items[i];
  if (it.layer) {                                  // capa -> saltar
    int li = layerIndexByName(it.layer);
    if (li < 0) return MenuResult::NONE;
    s_sel = li; s_editItem = false;
    return MenuResult::SWITCH_LAYER;
  }
  int item = idxBright() + it.setting;             // setting
  if (item == idxCal())  { s_editItem = false; return MenuResult::CALIBRATE; }
  if (item == idxWifi()) { s_editItem = false; return MenuResult::WIFI_SETUP; }
  if (s_editItem && s_sel == item) s_editItem = false;   // 2do toque del mismo item: listo
  else { s_sel = item; s_editItem = true; }              // entra en ajuste
  s_dirty = true;
  return MenuResult::NONE;
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
  if (s_overview) return;                                          // en overview se elige con botones; el encoder NO navega por atras
  s_groupSel = (s_groupSel + delta + pageCount()) % pageCount();   // en el picker, cambia de seccion
  s_dirty = true;
}

MenuResult press() {                               // encoder press: cierra el ajuste, o abre/cierra el overview
  if (!s_open) return MenuResult::NONE;
  if (s_editItem) s_editItem = false;
  else            s_overview = !s_overview;         // ver TODAS las secciones (botones 1-10 saltan)
  s_needFull = true; s_dirty = true;
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

// Icono representativo de una capa (por nombre). false si no hay match -> el caller cae
// al chip + inicial. Dibuja centrado en (cx,cy) con el color de la capa.
static bool drawLayerIcon(TFT_eSPI& g, const char* nm, int cx, int cy, uint16_t col, uint16_t bg) {
  (void)bg;
  auto is = [&](const char* s) { return strcmp(nm, s) == 0; };
  if (is("Edicion")) {                                  // lapiz
    g.drawLine(cx - 9, cy + 9, cx + 7, cy - 7, col);
    g.drawLine(cx - 8, cy + 10, cx + 8, cy - 6, col);
    g.fillTriangle(cx - 10, cy + 10, cx - 4, cy + 10, cx - 10, cy + 4, col);
    return true;
  }
  if (is("Dev")) {                                      // < >
    g.drawLine(cx - 4, cy - 8, cx - 12, cy, col); g.drawLine(cx - 12, cy, cx - 4, cy + 8, col);
    g.drawLine(cx + 4, cy - 8, cx + 12, cy, col); g.drawLine(cx + 12, cy, cx + 4, cy + 8, col);
    return true;
  }
  if (is("Apps")) {                                     // grilla 2x2
    for (int r = 0; r < 2; r++) for (int c = 0; c < 2; c++)
      g.fillRoundRect(cx - 11 + c * 13, cy - 11 + r * 13, 9, 9, 2, col);
    return true;
  }
  if (is("Multimedia")) {                               // play (solo la capa generica)
    g.fillTriangle(cx - 6, cy - 9, cx - 6, cy + 9, cx + 10, cy, col);
    return true;
  }
  if (is("Navegador")) {                                // globo
    g.drawCircle(cx, cy, 12, col);
    g.drawEllipse(cx, cy, 5, 12, col);
    g.drawFastHLine(cx - 12, cy, 24, col);
    return true;
  }
  // Apps de streaming/llamadas (YouTube/Netflix/Meet/Zoom/Teams/Slack/Spotify/Disney+/...)
  // NO comparten un icono de categoria: caen a la inicial BOLD -> cada una distinguible.
  if (is("RGB")) {                                      // tres circulos R/G/B
    g.fillCircle(cx, cy - 5, 6, theme::RED);
    g.fillCircle(cx - 6, cy + 4, 6, theme::GREEN);
    g.fillCircle(cx + 6, cy + 4, 6, theme::BLUE);
    return true;
  }
  if (is("WiZ")) {                                      // lampara
    g.fillCircle(cx, cy - 3, 9, col);
    g.fillRect(cx - 5, cy + 5, 10, 5, col);
    g.drawFastHLine(cx - 4, cy + 11, 8, col);
    return true;
  }
  if (is("General")) {                                  // pantallita con grafico
    g.drawRoundRect(cx - 12, cy - 9, 24, 18, 3, col);
    g.drawLine(cx - 8, cy + 3, cx - 3, cy - 3, col);
    g.drawLine(cx - 3, cy - 3, cx + 2, cy + 1, col);
    g.drawLine(cx + 2, cy + 1, cx + 8, cy - 5, col);
    return true;
  }
  if (is("Red")) {                                      // flechas subida/bajada (throughput)
    g.fillTriangle(cx - 6, cy - 10, cx - 11, cy - 3, cx - 1, cy - 3, col);
    g.fillRect(cx - 8, cy - 3, 4, 11, col);
    g.fillTriangle(cx + 6, cy + 10, cx + 1, cy + 3, cx + 11, cy + 3, col);
    g.fillRect(cx + 4, cy - 8, 4, 11, col);
    return true;
  }
  if (is("Nucleos")) {                                  // chip de CPU
    g.drawRoundRect(cx - 9, cy - 9, 18, 18, 2, col);
    g.drawRect(cx - 4, cy - 4, 8, 8, col);
    for (int k = -4; k <= 4; k += 4) {
      g.drawFastVLine(cx + k, cy - 13, 4, col);
      g.drawFastVLine(cx + k, cy + 10, 4, col);
      g.drawFastHLine(cx - 13, cy + k, 4, col);
      g.drawFastHLine(cx + 10, cy + k, 4, col);
    }
    return true;
  }
  return false;
}

// Icono representativo de una SECCION (los 7 grupos del menu). Centrado en (cx,cy).
// Da identidad visual a cada seccion en el overview (mas que el numero). false = sin match.
static bool drawSectionIcon(TFT_eSPI& g, const char* nm, int cx, int cy, uint16_t col) {
  auto is = [&](const char* s) { return strcmp(nm, s) == 0; };
  if (is("Trabajo")) {                                  // portafolio
    g.drawRoundRect(cx - 12, cy - 5, 24, 16, 3, col);
    g.drawRoundRect(cx - 5, cy - 10, 10, 6, 2, col);
    g.drawFastHLine(cx - 12, cy + 2, 24, col);
    return true;
  }
  if (is("Multimedia")) { g.fillTriangle(cx - 7, cy - 10, cx - 7, cy + 10, cx + 9, cy, col); return true; }
  if (is("Llamadas")) {                                 // telefono
    g.drawRoundRect(cx - 7, cy - 12, 14, 24, 3, col);
    g.fillCircle(cx, cy + 8, 1, col);
    g.drawFastHLine(cx - 4, cy - 8, 8, col);
    return true;
  }
  if (is("Apariencia")) {                               // paleta (3 dots)
    g.drawCircle(cx, cy, 11, col);
    g.fillCircle(cx - 4, cy - 3, 2, theme::RED);
    g.fillCircle(cx + 4, cy - 3, 2, theme::GREEN);
    g.fillCircle(cx, cy + 4, 2, theme::BLUE);
    return true;
  }
  if (is("Sistema")) {                                  // engranaje aproximado
    g.drawCircle(cx, cy, 7, col);
    g.drawCircle(cx, cy, 3, col);
    g.drawFastVLine(cx, cy - 11, 4, col);  g.drawFastVLine(cx, cy + 7, 4, col);
    g.drawFastHLine(cx - 11, cy, 4, col);  g.drawFastHLine(cx + 7, cy, 4, col);
    return true;
  }
  if (is("Luces")) {                                    // bombilla
    g.drawCircle(cx, cy - 3, 8, col);
    g.drawFastHLine(cx - 4, cy + 6, 8, col);
    g.drawFastHLine(cx - 3, cy + 9, 6, col);
    return true;
  }
  if (is("Monitor")) {                                  // pantallita con grafico
    g.drawRoundRect(cx - 12, cy - 9, 24, 18, 3, col);
    g.drawLine(cx - 8, cy + 3, cx - 3, cy - 3, col);
    g.drawLine(cx - 3, cy - 3, cx + 2, cy + 1, col);
    g.drawLine(cx + 2, cy + 1, cx + 8, cy - 5, col);
    return true;
  }
  return false;
}

// Posicion de la card i en la grilla FIJA de 10 (2 filas x 5). Geometria: mlay.
static void cardRect(int i, int& x, int& y, int& w, int& h) {
  w = mlay::TILE_W; h = mlay::TILE_H;
  x = mlay::GAP    + (i % mlay::COLS) * (w + mlay::GAP);
  y = mlay::GRID_Y + (i / mlay::COLS) * (h + mlay::GAP);
}

// --- helpers de dibujo del tile (DRY: los comparten picker y overview) ---
// Marco: fondo + borde + borde interno sutil (la "doble linea").
static void drawTileFrame(TFT_eSPI& g, int x, int y, int w, int h, uint16_t fill, uint16_t border, uint16_t inner) {
  g.fillRoundRect(x, y, w, h, mlay::RADIUS, fill);
  g.drawRoundRect(x, y, w, h, mlay::RADIUS, border);
  g.drawRoundRect(x + mlay::INNER, y + mlay::INNER, w - 2 * mlay::INNER, h - 2 * mlay::INNER, mlay::INNER_RADIUS, inner);
}
// Numero del boton, como badge chico arriba-izquierda.
static void drawTileBadge(TFT_eSPI& g, int x, int y, int num, uint16_t bg, uint16_t fg) {
  char nb[3]; snprintf(nb, sizeof(nb), "%d", num);
  uikit::badge(g, {x + mlay::BADGE_X, y + mlay::BADGE_Y, mlay::BADGE_W, mlay::BADGE_H}, nb, bg, fg, 4, 1);
}
// Slot sin contenido: presente pero apagado (no "--").
static void drawEmptySlot(TFT_eSPI& g, int x, int y, int w, int h, int num) {
  g.fillRoundRect(x, y, w, h, mlay::RADIUS, theme::DARK);
  g.drawRoundRect(x, y, w, h, mlay::RADIUS, theme::EDGE);
  g.setTextDatum(MC_DATUM); g.setTextColor(theme::DIM, theme::DARK);
  g.drawNumber(num, x + w / 2, y + h / 2, 2);
}

// Picker unificado: hasta 10 cards = 10 botones (doble fila si >5). Cada card es un item
// de la seccion actual (View o setting). Settings muestran su valor; el que se ajusta queda
// resaltado. Las capas muestran su icono + numero de boton. Los botones 1-10 eligen.
static void renderPicker(TFT_eSPI& tft) {
  tft.fillRect(0, mlay::BODY_Y, 480, mlay::BODY_H, theme::BG);
  const menumodel::Section& pg = menumodel::section(s_groupSel);
  const int total = pg.count;
  char buf[16];
  for (int i = 0; i < 10; i++) {                    // SIEMPRE los 10 (el pad tiene 10 botones)
    int x, y, w, h; cardRect(i, x, y, w, h);
    if (i >= total) { drawEmptySlot(tft, x, y, w, h, i + 1); continue; }
    const menumodel::Item* it = &pg.items[i];
    bool isSetting = it->layer == nullptr;
    int sIdx = isSetting ? idxBright() + it->setting : -1;
    int lIdx = !isSetting ? layerIndexByName(it->layer) : -1;
    bool editing = isSetting && s_editItem && s_sel == sIdx;
    uint16_t accent = isSetting ? itemAccent(sIdx)
                    : (lIdx >= 0 ? s_km->layer(lIdx).color : pg.color);
    const uint16_t fill = theme::CARD;
    drawTileFrame(tft, x, y, w, h, fill, accent, theme::blend(accent, theme::FG, editing ? 90 : 50));
    drawTileBadge(tft, x, y, i + 1, theme::blend(fill, accent, 60), editing ? theme::FG : accent);
    tft.setTextDatum(MC_DATUM);
    const char* nm = isSetting ? itemTitle(sIdx) : it->layer;
    const int icx = x + w / 2;
    if (isSetting) {
      drawMenuIcon(tft, icx, y + mlay::SET_ICON_DY, sIdx, accent, fill);
      uikit::fitText(tft, nm, icx, y + mlay::SET_NAME_DY, w - mlay::TXT_MARGIN, theme::FG, fill, 2);
      uikit::fitText(tft, itemMeta(sIdx, buf, sizeof(buf)), icx, y + mlay::SET_VAL_DY, w - mlay::TXT_MARGIN,
                     editing ? accent : theme::SOFT, fill, 2);
    } else {
      const int icy = y + mlay::ICON_DY;
      if (!drawLayerIcon(tft, nm, icx, icy, accent, fill)) {       // capa sin icono: chip + inicial
        const uint16_t chip = theme::blend(fill, accent, 32);
        tft.fillCircle(icx, icy, mlay::ICON_R, chip);
        tft.drawCircle(icx, icy, mlay::ICON_R, accent);
        char ini[2] = { nm[0], 0 };
        tft.setTextColor(accent, chip);
        tft.drawString(ini, icx, icy + 1, 4);
      }
      uikit::fitText(tft, nm, icx, y + mlay::LABEL_DY, w - mlay::TXT_MARGIN, theme::FG, fill, 2);
    }
  }
}

// Overview: TODAS las secciones como cards numeradas (doble fila si >5); la actual
// resaltada. Boton i = ir a esa seccion. Con 10 botones entran las 7 secciones.
static void renderOverview(TFT_eSPI& tft) {
  tft.fillRect(0, mlay::BODY_Y, 480, mlay::BODY_H, theme::BG);
  const int total = pageCount();
  for (int i = 0; i < 10; i++) {                    // SIEMPRE los 10 (el pad tiene 10 botones)
    int x, y, w, h; cardRect(i, x, y, w, h);
    if (i >= total) { drawEmptySlot(tft, x, y, w, h, i + 1); continue; }
    bool cur = i == s_groupSel;
    const menumodel::Section& sec = menumodel::section(i);
    uint16_t accent = sec.color;
    // La seccion actual (de donde venis) queda teñida con su acento para ubicarte.
    uint16_t fill = cur ? theme::blend(theme::DARK, accent, 55) : theme::DARK;
    tft.fillRoundRect(x, y, w, h, mlay::RADIUS, fill);
    tft.drawRoundRect(x, y, w, h, mlay::RADIUS, accent);
    if (cur) {                                          // doble borde para resaltar la seccion actual
      tft.drawRoundRect(x + mlay::INNER, y + mlay::INNER, w - 2 * mlay::INNER, h - 2 * mlay::INNER, mlay::INNER_RADIUS, accent);
      tft.drawRoundRect(x + mlay::SEL_INNER, y + mlay::SEL_INNER, w - 2 * mlay::SEL_INNER, h - 2 * mlay::SEL_INNER, mlay::SEL_RADIUS, theme::blend(accent, theme::FG, 60));
    }
    tft.setTextDatum(MC_DATUM);
    const int icx = x + w / 2;
    const uint16_t iconCol = cur ? theme::FG : accent;   // sobre el fill teñido, la actual va en blanco
    drawTileBadge(tft, x, y, i + 1, theme::blend(fill, accent, 60), cur ? theme::FG : accent);
    if (!drawSectionIcon(tft, sec.name, icx, y + mlay::SEC_ICON_DY, iconCol)) {
      tft.setTextColor(iconCol, fill);
      tft.drawNumber(i + 1, icx, y + mlay::SEC_ICON_DY, 4);
    }
    uikit::fitText(tft, sec.name, icx, y + mlay::SEC_NAME_DY, w - mlay::TXT_MARGIN, cur ? theme::FG : theme::SOFT, fill, 2);
  }
}

static void drawHeader(TFT_eSPI& tft) {
  tft.fillRect(0, 0, 480, 70, theme::PANEL);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(theme::SOFT, theme::PANEL);
  tft.drawString("CONTROL CENTER", 240, 16, 1);
  tft.setTextColor(theme::FG, theme::PANEL);
  const char* hn = s_overview ? "Secciones" : pageName();
  tft.drawString(hn, 240, 44, 4);
  if (!s_overview) {                                  // icono de la seccion a la izq del nombre
    int tw = tft.textWidth(hn, 4);
    drawSectionIcon(tft, hn, 240 - tw / 2 - 20, 44, pageColor());
  }
  if (!s_overview) {                                  // contador de seccion: solo en el picker (en overview no aplica)
    char p[8]; snprintf(p, sizeof(p), "%d/%d", s_groupSel + 1, pageCount());
    tft.setTextDatum(MR_DATUM);
    tft.setTextColor(pageColor(), theme::PANEL);
    tft.drawString(p, 470, 14, 2);
  }
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
  if (s_overview) renderOverview(tft);   // vista de todas las secciones (botones saltan)
  else            renderPicker(tft);     // items de la seccion actual
}

void render(TFT_eSPI& tft) {
  if (!s_km) return;

  if (s_needFull) {
    // Sin fillScreen (evita el parpadeo negro al abrir). renderBody rellena la grilla
    // (74..248) y drawEditor su banda (252..294); solo limpiamos los gaps entre zonas.
    tft.fillRect(0, 72,  480, 2,  theme::BG);   // header/accent .. grilla
    tft.fillRect(0, 248, 480, 4,  theme::BG);   // grilla .. editor
    tft.fillRect(0, 294, 480, 26, theme::BG);   // editor .. fondo
    drawHeader(tft);
    tft.fillRect(0, 68, 480, 4, uiAccent());
    renderBody(tft);
    drawEditor(tft);
    s_needFull = false; s_dirty = false;
    return;
  }
  if (!s_dirty) return;
  s_dirty = false;
  drawHeader(tft);
  tft.fillRect(0, 68, 480, 4, uiAccent());
  renderBody(tft);
  drawEditor(tft);
}

}  // namespace menu
