#include "MenuModel.h"
#include <string.h>
#include "../app/Theme.h"

namespace menumodel {

static constexpr int MAX_SECTIONS = 7;
static constexpr int MAX_ITEMS_PER_SECTION = 10;

struct TemplateItem { const char* layer; int8_t setting; };
struct TemplateSection { const char* name; uint16_t color; const TemplateItem* items; int count; };

static const TemplateItem T_TRABAJO[]    = { {"Edicion", -1}, {"Dev", -1}, {"Apps", -1}, {"Navegador", -1}, {"Launcher", -1}, {"Macros", -1} };
static const TemplateItem T_MULTIMEDIA[] = { {"Multimedia", -1}, {"YouTube", -1}, {"Netflix", -1}, {"Spotify", -1}, {"Disney+", -1}, {"Paramount", -1} };
static const TemplateItem T_LLAMADAS[]   = { {"Meet", -1}, {"Slack", -1}, {"Zoom", -1}, {"Teams", -1} };
static const TemplateItem T_APARIENCIA[] = { {nullptr, S_BRIGHT}, {nullptr, S_THEME}, {nullptr, S_ACCENT} };
static const TemplateItem T_SISTEMA[]    = { {nullptr, S_CLOCK}, {nullptr, S_WIFI}, {nullptr, S_CAL}, {nullptr, S_PREC}, {nullptr, S_DIM} };
static const TemplateItem T_LUCES[]      = { {"RGB", -1}, {"WiZ", -1} };
static const TemplateItem T_MONITOR[]    = { {"General", -1}, {"Red", -1}, {"Nucleos", -1}, {"Disco", -1} };

static const TemplateSection TEMPLATE[] = {
  { "Trabajo",    theme::CYAN,    T_TRABAJO,    6 },
  { "Multimedia", theme::MAGENTA, T_MULTIMEDIA, 6 },
  { "Llamadas",   theme::ROSE,    T_LLAMADAS,   4 },
  { "Apariencia", theme::VIOLET,  T_APARIENCIA, 3 },
  { "Sistema",    theme::GREEN,   T_SISTEMA,    5 },
  { "Luces",      theme::YELLOW,  T_LUCES,      2 },
  { "Monitor",    theme::CYAN,    T_MONITOR,    4 },
};

static Item s_items[MAX_SECTIONS][MAX_ITEMS_PER_SECTION];
static Section s_sections[MAX_SECTIONS];
static int s_sectionCount = 0;
static const KeyMap* s_keymap = nullptr;

static bool layerExists(const char* name) {
  return s_keymap && s_keymap->indexOf(name) >= 0;
}

static bool hasLayer(const Section& section, const char* name) {
  if (!name) return false;
  for (int i = 0; i < section.count; i++)
    if (section.items[i].layer && strcmp(section.items[i].layer, name) == 0) return true;
  return false;
}

static bool layerIsListed(const char* name) {
  for (int i = 0; i < s_sectionCount; i++)
    if (hasLayer(s_sections[i], name)) return true;
  return false;
}

static bool addItem(int sectionIdx, const Item& item) {
  Section& section = s_sections[sectionIdx];
  if (section.count >= MAX_ITEMS_PER_SECTION) return false;
  s_items[sectionIdx][section.count++] = item;
  return true;
}

static int sectionIndexForName(const char* layerName, LayerGroup group) {
  if (!strcmp(layerName, "RGB") || !strcmp(layerName, "WiZ")) return 5;
  if (!strcmp(layerName, "General") || !strcmp(layerName, "Red") || !strcmp(layerName, "Nucleos") || !strcmp(layerName, "Disco")) return 6;
  switch (group) {
    case LayerGroup::MULTIMEDIA: return 1;
    case LayerGroup::LLAMADAS:   return 2;
    case LayerGroup::SISTEMA:    return 4;
    default:                     return 0;
  }
}

void begin(const KeyMap* keymap) {
  s_keymap = keymap;
  s_sectionCount = (int)(sizeof(TEMPLATE) / sizeof(TEMPLATE[0]));
  for (int s = 0; s < s_sectionCount; s++) {
    s_sections[s] = { TEMPLATE[s].name, TEMPLATE[s].color, s_items[s], 0 };
    for (int i = 0; i < TEMPLATE[s].count; i++) {
      const TemplateItem& item = TEMPLATE[s].items[i];
      if (!item.layer || layerExists(item.layer)) addItem(s, { item.layer, item.setting });
    }
  }
  if (!s_keymap) return;
  for (uint8_t i = 0; i < s_keymap->count(); i++) {
    const Layer& layer = s_keymap->layer(i);
    if (layerIsListed(layer.name)) continue;
    int s = sectionIndexForName(layer.name, layer.group);
    addItem(s, { layer.name, -1 });
  }
}

int sectionCount() {
  if (s_sectionCount == 0) begin(nullptr);
  return s_sectionCount;
}

const Section& section(int index) {
  if (s_sectionCount == 0) begin(nullptr);
  if (index < 0 || index >= sectionCount()) index = 0;
  return s_sections[index];
}

int sectionOfLayer(const KeyMap& keymap, uint8_t layerIdx) {
  if (s_keymap != &keymap) begin(&keymap);
  if (layerIdx >= keymap.count()) return 0;
  const char* name = keymap.layer(layerIdx).name;
  for (int s = 0; s < sectionCount(); s++) {
    const Section& sec = section(s);
    for (int i = 0; i < sec.count; i++)
      if (sec.items[i].layer && strcmp(sec.items[i].layer, name) == 0) return s;
  }
  return 0;
}

}  // namespace menumodel