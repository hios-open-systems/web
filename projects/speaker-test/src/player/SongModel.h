// HIOS Speaker Test - Modelo de cancion en RAM (device)
// -----------------------------------------------------------------------------
// Struct fijo y compacto al que se parsea el wire v:2. Una DevNote son 6 bytes,
// asi 512 notas ~ 3 KB. El JsonDocument de ArduinoJson es TRANSITORIO: se parsea
// aca y se descarta antes de reproducir (no queda vivo durante el audio).
// -----------------------------------------------------------------------------
#pragma once
#include <stddef.h>
#include <stdint.h>
#include "SongFormat.h"

struct DevNote {
  uint8_t  pitch;  // MIDI 0..127
  uint8_t  vel;    // 1..127
  uint16_t start;  // ticks desde el inicio del loop
  uint16_t dur;    // ticks
};

struct DevTrack {
  uint8_t  instr;      // songfmt::Instrument
  uint8_t  vol;        // 0..255
  uint8_t  muted;      // 0/1
  uint16_t firstNote;  // indice en DeviceSong::notes
  uint16_t noteCount;
};

struct DeviceSong {
  char     name[32];
  uint16_t bpm, ppq, bpb, lb;
  uint8_t  trackCount;
  DevTrack tracks[songfmt::MAX_TRACKS];
  uint16_t noteCount;
  DevNote  notes[songfmt::MAX_NOTES_TOTAL];
  uint32_t loopTicks;  // lb*bpb*ppq, precomputado
};

struct ParseResult {
  bool     ok;
  uint16_t tracks;
  uint16_t notes;
  uint16_t dropped;  // tracks/notas descartadas por exceder los caps
};

// Recalcula loopTicks a partir de lb/bpb/ppq.
void finalizeSong(DeviceSong& song);

// Parsea el wire v:2 a `out`. Tolerante: clamp de rangos, drop de excedentes,
// instrumento desconocido -> pulse-lead. Devuelve ok=false en JSON malo o version
// equivocada (y en ese caso el llamador mantiene la cancion en curso).
ParseResult parseDeviceSong(const char* json, size_t len, DeviceSong& out);
