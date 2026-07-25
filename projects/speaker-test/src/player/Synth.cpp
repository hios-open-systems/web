#include "Synth.h"

namespace synth {

float FREQ_LUT[128];

void init() {
  for (int m = 0; m < 128; m++) {
    FREQ_LUT[m] = songfmt::A4_HZ * powf(2.0f, (m - 69) / 12.0f);
  }
}

}  // namespace synth
