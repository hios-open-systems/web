#include "Menu.h"
#include <Arduino.h>
#include <math.h>
#include <esp_heap_caps.h>
#include "../app/Theme.h"
#include "../app/AppState.h"
#include "UiKit.h"

namespace menu {

// ---------------------------------------------------------------------------
//  Menu de UN nivel: cada pagina (grupos de capas + Apariencia + Sistema) muestra
//  hasta 5 cards sobre los 5 botones fisicos. Los botones ELIGEN (capa -> salta;
//  setting editable -> el encoder ajusta el valor en vivo; WiFi/Calibrar -> accion).
//  El encoder gira = cambiar de pagina; long-press = cerrar. Sin carrusel ni caratula.
//
//  Cada pagina (PAGES[]) lista hasta 5 items que MEZCLAN capas y settings libremente
//  (ej: Apariencia = Brillo/Tema/Color/Skin/RGB). Las capas se referencian por NOMBRE.
// ---------------------------------------------------------------------------
// Un item del menu es una CAPA (por nombre -> robusto a reordenar DefaultConfig) o un
// SETTING (offset 0..8 respecto de idxBright()). Cada pagina lista hasta 5 items y los
// mezcla libremente: asi RGB (capa) puede vivir en Apariencia junto a settings, etc.
enum { S_BRIGHT, S_THEME, S_ACCENT, S_DIM, S_CLOCK, S_WIFI, S_CAL, S_PREC };  // (sin S_SKIN: ya no hay skins)
struct PageItem { const char* layer; int8_t setting; };   // layer!=nullptr => capa; si no => setting
struct Page     { const char* name; uint16_t color; const PageItem* items; int count; };

static const PageItem PI_TRABAJO[]    = { {"Edicion",-1},{"Dev",-1},{"Apps",-1},{"Navegador",-1} };
static const PageItem PI_MULTIMEDIA[] = { {"Multimedia",-1},{"YouTube",-1},{"Netflix",-1},{"Spotify",-1},{"Disney+",-1} };
static const PageItem PI_LLAMADAS[]   = { {"Meet",-1},{"Slack",-1},{"Zoom",-1},{"Teams",-1} };
static const PageItem PI_APARIENCIA[] = { {nullptr,S_BRIGHT},{nullptr,S_THEME},{nullptr,S_ACCENT} };
static const PageItem PI_SISTEMA[]    = { {nullptr,S_CLOCK},{nullptr,S_WIFI},{nullptr,S_CAL},{nullptr,S_PREC},{nullptr,S_DIM} };
static const PageItem PI_LUCES[]      = { {"RGB",-1},{"WiZ",-1} };
static const PageItem PI_MONITOR[]    = { {"General",-1},{"Red",-1},{"Nucleos",-1},{"Disco",-1} };

static const Page PAGES[] = {
  { "Trabajo",    theme::CYAN,    PI_TRABAJO,    4 },
  { "Multimedia", theme::MAGENTA, PI_MULTIMEDIA, 5 },
  { "Llamadas",   theme::ROSE,    PI_LLAMADAS,   4 },
  { "Apariencia", theme::VIOLET,  PI_APARIENCIA, 3 },   // Brillo,Tema,Color
  { "Sistema",    theme::GREEN,   PI_SISTEMA,    5 },   // Hora,WiFi,Calibrar,Precision,Dimmer
  { "Luces",      theme::YELLOW,  PI_LUCES,      2 },   // RGB + WiZ (iluminacion)
  { "Monitor",    theme::CYAN,    PI_MONITOR,    4 },   // General/Red/Nucleos/Disco (telemetria companion)
};

static KeyMap* s_km = nullptr;
static bool    s_open     = false;
static int     s_groupSel = 0;     // grupo/pagina actual (0..pageCount()-1)
static int     s_sel      = 0;     // indice REAL: capa elegida o item de ajuste
static bool    s_editItem = false; // ajustando un setting (el encoder cambia el valor)
static bool    s_overview = false; // vista de TODAS las paginas (botones 1-5 saltan a una)
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
static int pageCount() { return (int)(sizeof(PAGES) / sizeof(PAGES[0])); }
// Pagina que contiene a la capa actual (para abrir el menu en el lugar correcto).
static int pageOfLayer(uint8_t layerIdx) {
  if (!s_km || layerIdx >= s_km->count()) return 0;
  const char* nm = s_km->layer(layerIdx).name;
  for (int p = 0; p < pageCount(); p++)
    for (int i = 0; i < PAGES[p].count; i++)
      if (PAGES[p].items[i].layer && strcmp(PAGES[p].items[i].layer, nm) == 0) return p;
  return 0;
}
static const char* pageName()  { return PAGES[s_groupSel].name; }
static uint16_t    pageColor() { return PAGES[s_groupSel].color; }

void init(KeyMap* km) { s_km = km; }

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

// Hay botones-card en TODAS las paginas (capas y settings): los botones eligen.
bool inLayerPicker() { return s_open; }

// Boton i (0..4): elige el item i de la pagina actual. Capa -> salta; setting editable ->
// entra en ajuste (el encoder cambia el valor); WiFi/Calibrar -> accion directa.
MenuResult pickButton(uint8_t i) {
  if (!s_open) return MenuResult::NONE;
  if (s_overview) {                                // overview: el boton i salta a esa pagina
    if ((int)i < pageCount()) { s_groupSel = i; s_overview = false; s_needFull = true; s_dirty = true; }
    return MenuResult::NONE;
  }
  const Page& pg = PAGES[s_groupSel];
  if ((int)i >= pg.count) return MenuResult::NONE;
  const PageItem& it = pg.items[i];
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
  s_groupSel = (s_groupSel + delta + pageCount()) % pageCount();   // si no, cambia de pagina
  s_dirty = true;
}

MenuResult press() {                               // encoder press: cierra el ajuste, o abre/cierra el overview
  if (!s_open) return MenuResult::NONE;
  if (s_editItem) s_editItem = false;
  else            s_overview = !s_overview;         // ver TODAS las paginas (botones 1-5 saltan)
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

// Layout de hasta 10 cards en 1 fila (<=5 items) o 2 filas de 5 (6..10 items).
// Devuelve x,y,w,h de la card i. Con 10 botones, el picker/overview usan ambas filas.
static void cardRect(int i, int total, int& x, int& y, int& w, int& h) {
  const int cols = 5, gap = 8;
  w = (480 - gap * (cols + 1)) / cols;             // ~83px
  if (total > 5) { h = 62; y = 80 + (i / cols) * (h + 8); }   // 2 filas: 80..142, 150..212
  else           { h = 118; y = 82; }                          // 1 fila
  x = gap + (i % cols) * (w + gap);
}

// Picker unificado: hasta 10 cards = 10 botones (doble fila si >5). Cada card es un item
// de la pagina actual (capa o setting). Settings muestran su valor; el que se ajusta queda
// resaltado. Las capas muestran su icono + numero de boton. Los botones 1-10 eligen.
static void renderPicker(TFT_eSPI& tft) {
  tft.fillRect(0, 74, 480, 142, theme::BG);
  const Page& pg = PAGES[s_groupSel];
  const int total = pg.count;
  const bool two = total > 5;
  const int slots = two ? 10 : 5;
  char buf[16];
  for (int i = 0; i < slots; i++) {
    int x, y, w, h; cardRect(i, total, x, y, w, h);
    bool occ = i < total;
    const PageItem* it = occ ? &pg.items[i] : nullptr;
    bool isSetting = occ && it->layer == nullptr;
    int sIdx = isSetting ? idxBright() + it->setting : -1;
    int lIdx = (occ && !isSetting) ? layerIndexByName(it->layer) : -1;
    bool editing = isSetting && s_editItem && s_sel == sIdx;
    uint16_t accent = !occ ? theme::EDGE
                    : isSetting ? itemAccent(sIdx)
                    : (lIdx >= 0 ? s_km->layer(lIdx).color : pg.color);
    uint16_t fill = occ ? theme::CARD : theme::DARK;
    tft.fillRoundRect(x, y, w, h, 10, fill);
    tft.drawRoundRect(x, y, w, h, 10, accent);
    if (occ) tft.drawRoundRect(x + 1, y + 1, w - 2, h - 2, 9, theme::blend(accent, theme::FG, editing ? 90 : 50));
    tft.setTextDatum(MC_DATUM);
    if (occ) {
      const char* nm = isSetting ? itemTitle(sIdx) : it->layer;
      const int icx = x + w / 2, icy = y + (two ? 18 : 30);
      if (isSetting) {
        drawMenuIcon(tft, icx, icy, sIdx, accent, fill);
      } else if (!drawLayerIcon(tft, nm, icx, icy, accent, fill)) {
        const int ir = two ? 13 : 17;                             // capa sin icono: chip + inicial
        const uint16_t chip = theme::blend(fill, accent, 32);
        tft.fillCircle(icx, icy, ir, chip);
        tft.drawCircle(icx, icy, ir, accent);
        char ini[2] = { nm[0], 0 };
        tft.setTextColor(accent, chip);
        tft.drawString(ini, icx, icy + 1, two ? 2 : 4);
        if (!two) tft.drawString(ini, icx + 1, icy + 1, 4);       // faux-bold solo en 1 fila
      }
      uikit::fitText(tft, nm, icx, y + (two ? 40 : 64), w - 8, theme::FG, fill, 2);
      if (isSetting) {
        uikit::fitText(tft, itemMeta(sIdx, buf, sizeof(buf)), icx, y + h - (two ? 13 : 18), w - 8,
                       editing ? accent : theme::SOFT, fill, 2);
      } else {
        tft.setTextColor(theme::DIM, fill);
        tft.drawNumber(i + 1, icx, y + h - (two ? 13 : 18), 2);
      }
      tft.fillRoundRect(x + 10, y + h - (two ? 6 : 8), w - 20, two ? 3 : 4, 2, accent);
    } else {
      tft.setTextColor(theme::DIM, fill);
      tft.drawString("--", x + w / 2, y + h / 2, two ? 2 : 4);
    }
  }
  if (!two) {                                       // caption solo en 1 fila (en 2 no hay lugar)
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(theme::SOFT, theme::BG);
    tft.drawString("apreta un boton para elegir", 240, 208, 1);
  }
}

// Overview: TODAS las secciones como cards numeradas (doble fila si >5); la actual
// resaltada. Boton i = ir a esa seccion. Con 10 botones entran las 7 secciones.
static void renderOverview(TFT_eSPI& tft) {
  tft.fillRect(0, 74, 480, 142, theme::BG);
  const int total = pageCount();
  const bool two = total > 5;
  const int slots = two ? 10 : 5;
  for (int i = 0; i < slots; i++) {
    int x, y, w, h; cardRect(i, total, x, y, w, h);
    bool occ = i < total;
    bool cur = occ && i == s_groupSel;
    uint16_t accent = occ ? PAGES[i].color : theme::EDGE;
    uint16_t fill   = (occ && cur) ? theme::CARD : theme::DARK;
    tft.fillRoundRect(x, y, w, h, 10, fill);
    tft.drawRoundRect(x, y, w, h, 10, accent);
    if (cur) tft.drawRoundRect(x + 1, y + 1, w - 2, h - 2, 9, theme::blend(accent, theme::FG, 90));
    tft.setTextDatum(MC_DATUM);
    if (occ) {
      const int icx = x + w / 2, icy = y + (two ? 20 : 42);
      if (!drawSectionIcon(tft, PAGES[i].name, icx, icy, accent)) {
        tft.setTextColor(accent, fill);
        tft.drawNumber(i + 1, icx, icy, two ? 4 : 6);
      }
      char nb[3]; snprintf(nb, sizeof(nb), "%d", i + 1);                     // numero -> badge chico
      uikit::badge(tft, {x + 6, y + 5, two ? 15 : 18, two ? 13 : 16}, nb,
                   theme::blend(fill, accent, 60), cur ? theme::FG : accent, 4, two ? 1 : 2);
      uikit::fitText(tft, PAGES[i].name, icx, y + h - (two ? 12 : 26), w - 8,
                     cur ? theme::FG : theme::SOFT, fill, 2);
      tft.fillRoundRect(x + 10, y + h - (two ? 6 : 12), w - 20, two ? 3 : 4, 2, accent);
    } else {
      tft.setTextColor(theme::DIM, fill);
      tft.drawString("--", x + w / 2, y + h / 2, two ? 2 : 4);
    }
  }
  if (!two) {
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(theme::SOFT, theme::BG);
    tft.drawString("apreta el boton de la seccion   (encoder: volver)", 240, 208, 1);
  }
}

static void drawHeader(TFT_eSPI& tft) {
  tft.fillRect(0, 0, 480, 70, theme::PANEL);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(theme::SOFT, theme::PANEL);
  tft.drawString("CONTROL CENTER", 240, 16, 1);
  tft.setTextColor(theme::FG, theme::PANEL);
  const char* hn = s_overview ? "Paginas" : pageName();
  tft.drawString(hn, 240, 44, 4);
  if (!s_overview) {                                  // icono de la seccion a la izq del nombre
    int tw = tft.textWidth(hn, 4);
    drawSectionIcon(tft, hn, 240 - tw / 2 - 20, 44, pageColor());
  }
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
  if (s_editItem)      { a = "ajustar"; b = "listo";    c = "salir"; }   // encoder ajusta el valor
  else if (s_overview) { a = "pagina";  b = "volver";   c = "salir"; }   // boton 1-5 salta
  else                 { a = "pagina";  b = "ver todo"; c = "salir"; }   // press = overview
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
  if (s_overview) renderOverview(tft);   // vista de todas las paginas (botones saltan)
  else            renderPicker(tft);     // items de la pagina actual
}

void render(TFT_eSPI& tft) {
  if (!s_km) return;

  if (s_needFull) {
    // Sin fillScreen (evita el parpadeo negro al abrir). Los componentes rellenan sus
    // zonas; solo limpiamos los gaps entre ellos para no dejar restos del dashboard.
    tft.fillRect(0, 72,  480, 2,  theme::BG);   // header/accent .. body
    tft.fillRect(0, 216, 480, 2,  theme::BG);   // body .. hint
    tft.fillRect(0, 248, 480, 4,  theme::BG);   // hint .. editor
    tft.fillRect(0, 294, 480, 26, theme::BG);   // editor .. fondo
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
