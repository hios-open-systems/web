// HIOS Speaker Test - Voces del synth (device)
// -----------------------------------------------------------------------------
// Porta el DSP de song.cpp, generalizado por instrumento. Osciladores inline
// (se llaman por muestra); midiToFreq via LUT de 128 entradas armada al boot.
// -----------------------------------------------------------------------------
#pragma once
#include <math.h>
#include <stdint.h>
#include "SongFormat.h"

namespace synth {

extern float FREQ_LUT[128];  // Hz por nota MIDI
void init();

inline float triWave(float ph) { return ph < 0.5f ? (4.0f * ph - 1.0f) : (3.0f - 4.0f * ph); }
inline float pulseWave(float ph, float duty) { return ph < duty ? 0.5f : -0.5f; }
inline float sawWave(float ph) { return 2.0f * ph - 1.0f; }

// ruido blanco rapido (xorshift por voz, sin estado global)
inline uint32_t xorshift(uint32_t& s) {
  s ^= s << 13;
  s ^= s >> 17;
  s ^= s << 5;
  return s;
}
inline float noiseWave(uint32_t& s) { return (int32_t)xorshift(s) / 2147483648.0f; }

// Una muestra de la voz, en [-1,1] (antes de velocity/volumen/rampas).
//   ph   : fase 0..1 del oscilador
//   prog : avance dentro de la nota 0..1 (para envolventes de decay)
//   tSec : segundos desde note-on (percusion usa decay por tiempo fijo)
inline float voiceSample(uint8_t instr, float ph, float prog, float tSec,
                         uint8_t pitch, uint32_t& rng) {
  switch (instr) {
    case songfmt::INSTR_PULSE_LEAD:
      return pulseWave(ph, 0.25f) * expf(-3.5f * prog);
    case songfmt::INSTR_PULSE_SOFT:
      return pulseWave(ph, 0.5f) * 0.8f * expf(-2.0f * prog);
    case songfmt::INSTR_TRIANGLE_BASS:
      return triWave(ph) * 0.9f * (0.6f + 0.4f * expf(-2.0f * prog));
    case songfmt::INSTR_SAW_LEAD:
      return sawWave(ph) * 0.7f * expf(-3.0f * prog);
    case songfmt::INSTR_SNES_LEAD:
      return (0.6f * triWave(ph) + 0.4f * pulseWave(ph, 0.5f)) *
             (0.5f + 0.5f * expf(-1.5f * prog));
    case songfmt::INSTR_NOISE_PERC: {
      bool kick = pitch <= 45;                       // pitch grave = bombo
      float env = expf(-tSec / (kick ? 0.10f : 0.03f));
      return noiseWave(rng) * env * (kick ? 0.9f : 0.5f);
    }
    default:
      return pulseWave(ph, 0.25f) * expf(-3.5f * prog);
  }
}

}  // namespace synth
