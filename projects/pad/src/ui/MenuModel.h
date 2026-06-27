#pragma once

#include <stdint.h>
#include "../mapping/KeyMap.h"

namespace menumodel {

enum SettingId : int8_t { S_BRIGHT, S_THEME, S_ACCENT, S_DIM, S_CLOCK, S_WIFI, S_CAL, S_PREC };

struct Item {
  const char* layer;
  int8_t setting;
};

struct Section {
  const char* name;
  uint16_t color;
  const Item* items;
  int count;
};

void begin(const KeyMap* keymap);
int sectionCount();
const Section& section(int index);
int sectionOfLayer(const KeyMap& keymap, uint8_t layerIdx);

}  // namespace menumodel