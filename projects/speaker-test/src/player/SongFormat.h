// HIOS Speaker Test - Formato de cancion compartido (device <-> web)
// -----------------------------------------------------------------------------
// Fuente de verdad EN EL FIRMWARE del contrato de formato. La web lo espeja en
// lib/workbench/chiptune.ts; scripts/song-selftest.ts verifica que no driftee
// (falla CI ante cualquier desalineacion).
//
// El "wire" que entra por POST /api/song es el perfil reducido v:2 que produce
// serializeDeviceSong() en la web:
//   { v:2, n, bpm, ppq, bpb, lb, t:[ { i, m, vol, no:[[pitch,start,dur,vel],...] } ] }
// donde `i` = indice entero en INSTRUMENT_IDS (el orden del enum de abajo ES el
// contrato) y `vol` = volumen 0..1 escalado a 0..255.
// -----------------------------------------------------------------------------
#pragma once
#include <stdint.h>

namespace songfmt {

constexpr uint16_t WIRE_VERSION   = 2;    // rechazar cualquier otro
constexpr uint16_t PPQ            = 480;  // el tick-math asume esta resolucion
constexpr uint16_t TICKS_PER_STEP = 120;  // grilla de semicorchea (PPQ / 4)

constexpr uint16_t BPM_MIN   = 40;
constexpr uint16_t BPM_MAX   = 300;
constexpr uint8_t  PITCH_MIN = 0;
constexpr uint8_t  PITCH_MAX = 127;
constexpr uint8_t  VEL_MIN   = 1;
constexpr uint8_t  VEL_MAX   = 127;

constexpr uint8_t  MAX_TRACKS      = 8;
constexpr uint16_t MAX_NOTES_TOTAL = 512;  // pool plano compartido entre tracks
constexpr uint8_t  MAX_VOICES      = 8;    // polifonia maxima
constexpr uint32_t MAX_WIRE_BYTES  = 16384;  // body de /api/song (413 si excede)

constexpr float    A4_HZ = 440.0f;  // midiToFreq = A4_HZ * 2^((m-69)/12)

// El ORDEN debe ser IDENTICO a INSTRUMENT_IDS en lib/workbench/chiptune.ts.
// El indice = el entero "i" del wire. El comentario // <web-id> es lo que lee el
// self-test para atar cada miembro a su InstrumentId de la web.
enum Instrument : uint8_t {
  INSTR_PULSE_LEAD = 0,  // pulse-lead
  INSTR_PULSE_SOFT,      // pulse-soft
  INSTR_TRIANGLE_BASS,   // triangle-bass
  INSTR_SAW_LEAD,        // saw-lead
  INSTR_SNES_LEAD,       // snes-lead
  INSTR_NOISE_PERC,      // noise-perc
  INSTR_COUNT
};

}  // namespace songfmt
