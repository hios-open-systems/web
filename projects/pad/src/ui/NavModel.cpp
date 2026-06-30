#include "NavModel.h"
#include <string.h>
#include "../app/Theme.h"

namespace navmodel {

static Section s_sections[MAX_SECTIONS];
static View    s_views[MAX_VIEWS];
static int     s_sectionCount = 0;
static int     s_viewCount    = 0;
static bool    s_valid        = false;
static char    s_homeView[NAV_ID_LEN] = {0};

static void copyStr(char* dst, const char* src, size_t cap) {
  if (!src) src = "";
  strncpy(dst, src, cap - 1);
  dst[cap - 1] = '\0';
}

static ViewKind parseKind(const char* k) {
  if (!strcmp(k, "monitor"))    return ViewKind::MONITOR;
  if (!strcmp(k, "settings"))   return ViewKind::SETTINGS;
  if (!strcmp(k, "wifi"))       return ViewKind::WIFI;
  if (!strcmp(k, "game"))       return ViewKind::GAME;
  if (!strcmp(k, "webContent")) return ViewKind::WEBCONTENT;
  return ViewKind::CARDS;
}

uint16_t colorFromName(const char* name) {
  if (!name || !name[0]) return 0;
  if (!strcmp(name, "cyan"))    return theme::CYAN;
  if (!strcmp(name, "magenta")) return theme::MAGENTA;
  if (!strcmp(name, "green"))   return theme::GREEN;
  if (!strcmp(name, "orange"))  return theme::ORANGE;
  if (!strcmp(name, "yellow"))  return theme::YELLOW;
  if (!strcmp(name, "blue"))    return theme::BLUE;
  if (!strcmp(name, "red"))     return theme::RED;
  if (!strcmp(name, "purple"))  return theme::PURPLE;
  if (!strcmp(name, "violet"))  return theme::VIOLET;
  if (!strcmp(name, "rose"))    return theme::ROSE;
  return 0;
}

void clear() {
  s_sectionCount = 0;
  s_viewCount    = 0;
  s_valid        = false;
  s_homeView[0]  = '\0';
}

int indexOfView(const char* id) {
  if (!id || !id[0]) return -1;
  for (int i = 0; i < s_viewCount; i++)
    if (!strcmp(s_views[i].id, id)) return i;
  return -1;
}

bool loadFromJson(JsonObjectConst root) {
  clear();
  JsonObjectConst nav   = root["navigation"];
  JsonArrayConst  views = root["views"];
  if (nav.isNull() || views.isNull()) return false;   // config plana legacy: sin modelo

  for (JsonObjectConst vo : views) {
    if (s_viewCount >= MAX_VIEWS) break;
    View& v = s_views[s_viewCount];
    copyStr(v.id, vo["id"] | "", NAV_ID_LEN);
    if (!v.id[0]) continue;
    copyStr(v.label, vo["label"] | v.id, NAV_LABEL_LEN);
    v.color     = (uint16_t)(vo["color"] | (int)theme::CYAN);
    v.kind      = parseKind(vo["kind"] | "cards");
    v.cardCount = 0;
    for (JsonObjectConst co : vo["cards"].as<JsonArrayConst>()) {
      if (v.cardCount >= MAX_CARDS) break;
      Card& c = v.cards[v.cardCount];
      int slot = co["slot"] | -1;
      if (slot < 0 || slot >= MAX_CARDS) continue;
      c.slot = (uint8_t)slot;
      copyStr(c.label, co["label"] | "", NAV_LABEL_LEN);
      v.cardCount++;
    }
    s_viewCount++;
  }

  for (JsonObjectConst so : nav["sections"].as<JsonArrayConst>()) {
    if (s_sectionCount >= MAX_SECTIONS) break;
    Section& s = s_sections[s_sectionCount];
    copyStr(s.id, so["id"] | "", NAV_ID_LEN);
    if (!s.id[0]) continue;
    copyStr(s.label, so["label"] | s.id, NAV_LABEL_LEN);
    s.color     = colorFromName(so["color"] | "");
    s.viewCount = 0;
    for (JsonVariantConst rv : so["views"].as<JsonArrayConst>()) {
      if (s.viewCount >= MAX_VIEWS_PER_SECTION) break;
      int idx = indexOfView(rv | "");
      if (idx < 0) continue;
      s.viewIdx[s.viewCount++] = (uint8_t)idx;
      if (!s.color) s.color = s_views[idx].color;   // hereda el color de la 1ra View si no vino
    }
    if (s.viewCount > 0) s_sectionCount++;           // descarta secciones vacias
  }

  copyStr(s_homeView, nav["homeView"] | "", NAV_ID_LEN);
  s_valid = (s_sectionCount > 0);
  return s_valid;
}

bool           valid()        { return s_valid; }
int            sectionCount() { return s_sectionCount; }
const Section& section(int i) { return s_sections[(i < 0 || i >= s_sectionCount) ? 0 : i]; }
int            viewCount()    { return s_viewCount; }
const View&    view(int i)    { return s_views[(i < 0 || i >= s_viewCount) ? 0 : i]; }
const char*    homeView()     { return s_homeView; }

}  // namespace navmodel
