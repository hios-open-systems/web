#include "MenuModel.h"
#include <string.h>
#include "../app/Theme.h"
#include "../app/SettingsRegistry.h"
#include "NavModel.h"

namespace menumodel {

static constexpr int MAX_SECTIONS = 10;   // soporta el modelo v2 (companion puede definir mas secciones)
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

// Fallback historico: secciones desde plantillas + Views extra del KeyMap. Es
// el comportamiento de siempre, intacto, cuando no hay NavModel cargado.
static void buildFromTemplates(const KeyMap* keymap) {
  s_sectionCount = (int)(sizeof(TEMPLATE) / sizeof(TEMPLATE[0]));
  for (int s = 0; s < s_sectionCount; s++) {
    s_sections[s] = { TEMPLATE[s].name, TEMPLATE[s].color, s_items[s], 0 };
    for (int i = 0; i < TEMPLATE[s].count; i++) {
      const TemplateItem& item = TEMPLATE[s].items[i];
      if (!item.layer || layerExists(item.layer)) addItem(s, { item.layer, item.setting });
    }
  }
  if (!keymap) return;
  for (uint8_t i = 0; i < keymap->count(); i++) {
    const Layer& layer = keymap->layer(i);
    if (layerIsListed(layer.name)) continue;
    int s = sectionIndexForName(layer.name, layer.group);
    addItem(s, { layer.name, -1 });
  }
}

// Agrega una seccion de ajustes (Apariencia/Sistema) derivada de SettingsRegistry,
// para que los settings sigan siendo alcanzables cuando el menu viene del NavModel
// (el modelo de la companion todavia no representa los settings como Views).
static void addSettingsSection(const char* name, uint16_t color, settings::Group group) {
  if (s_sectionCount >= MAX_SECTIONS) return;
  s_sections[s_sectionCount] = { name, color, s_items[s_sectionCount], 0 };
  for (int i = 0; i < settings::count(); i++) {
    const settings::Desc& d = settings::at(i);
    if (d.group == group) addItem(s_sectionCount, { nullptr, (int8_t)d.id });
  }
  if (s_sections[s_sectionCount].count > 0) s_sectionCount++;
}

// Path v2: secciones/Views vienen del NavModel cargado por config. Solo se
// listan Views que existan como Layer en el KeyMap (el dispatcher las entiende).
static void buildFromNav(const KeyMap* keymap) {
  s_sectionCount = 0;
  for (int si = 0; si < navmodel::sectionCount() && s_sectionCount < MAX_SECTIONS; si++) {
    const navmodel::Section& ns = navmodel::section(si);
    s_sections[s_sectionCount] = { ns.label, ns.color ? ns.color : theme::CYAN, s_items[s_sectionCount], 0 };
    for (int k = 0; k < ns.viewCount; k++) {
      const navmodel::View& nv = navmodel::view(ns.viewIdx[k]);
      if (keymap && keymap->indexOf(nv.label) < 0) continue;   // View sin Layer viva -> se omite
      addItem(s_sectionCount, { nv.label, -1 });
    }
    if (s_sections[s_sectionCount].count > 0) s_sectionCount++;
  }
  addSettingsSection("Apariencia", theme::VIOLET, settings::APPEARANCE);
  addSettingsSection("Sistema",    theme::GREEN,  settings::SYSTEM);
}

void begin(const KeyMap* keymap) {
  s_keymap = keymap;
  if (navmodel::valid()) buildFromNav(keymap);
  else                   buildFromTemplates(keymap);
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