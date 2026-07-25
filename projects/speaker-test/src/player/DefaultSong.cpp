#include "DefaultSong.h"
#include <string.h>

using namespace songfmt;

// Melodia de song.cpp en notas MIDI (32 corcheas, progresion Do-Lam-Fa-Sol).
// 0 = silencio. Corchea = PPQ/2 = 240 ticks.
static const uint8_t LEAD[32] = {
  79, 76, 72, 76,  79, 81, 79, 76,   77, 74, 71, 74,  77, 79, 77, 74,
  76, 72, 67, 72,  76, 77, 76, 72,   74, 71, 67, 71,  74, 72,  0,  0,
};
// raiz del bajo por grupo de 4 corcheas: C3 A2 F2 G2 C3 F2 G2 C3
static const uint8_t BASS_ROOT[8] = { 48, 45, 41, 43, 48, 41, 43, 48 };

static DeviceSong g;
static bool g_built = false;

const DeviceSong& defaultSong() {
  if (g_built) return g;

  strncpy(g.name, "HIOS Default", sizeof(g.name) - 1);
  g.name[sizeof(g.name) - 1] = '\0';
  g.bpm = 200;
  g.ppq = PPQ;
  g.bpb = 4;
  g.lb = 4;
  g.trackCount = 0;
  g.noteCount = 0;

  const uint16_t STEP = PPQ / 2;  // corchea = 240 ticks

  // Track 0: LEAD (pulso)
  {
    DevTrack& t = g.tracks[g.trackCount];
    t.instr = INSTR_PULSE_LEAD;
    t.muted = 0;
    t.vol = 210;
    t.firstNote = g.noteCount;
    uint16_t c = 0;
    for (int i = 0; i < 32; i++) {
      if (LEAD[i] == 0) continue;
      DevNote& n = g.notes[g.noteCount++];
      n.pitch = LEAD[i];
      n.start = (uint16_t)(i * STEP);
      n.dur = (uint16_t)(STEP - 20);
      n.vel = 100;
      c++;
    }
    t.noteCount = c;
    g.trackCount++;
  }

  // Track 1: BAJO (triangulo), una nota por grupo de 4 corcheas
  {
    DevTrack& t = g.tracks[g.trackCount];
    t.instr = INSTR_TRIANGLE_BASS;
    t.muted = 0;
    t.vol = 230;
    t.firstNote = g.noteCount;
    uint16_t c = 0;
    for (int grp = 0; grp < 8; grp++) {
      DevNote& n = g.notes[g.noteCount++];
      n.pitch = BASS_ROOT[grp];
      n.start = (uint16_t)(grp * 4 * STEP);
      n.dur = (uint16_t)(4 * STEP - 20);
      n.vel = 90;
      c++;
    }
    t.noteCount = c;
    g.trackCount++;
  }

  // Track 2: PERCUSION (ruido): bombo en el beat, hi-hat en el offbeat
  {
    DevTrack& t = g.tracks[g.trackCount];
    t.instr = INSTR_NOISE_PERC;
    t.muted = 0;
    t.vol = 200;
    t.firstNote = g.noteCount;
    uint16_t c = 0;
    for (int i = 0; i < 32; i++) {
      if (i % 4 == 0) {
        DevNote& n = g.notes[g.noteCount++];
        n.pitch = 36;  // bombo (grave)
        n.start = (uint16_t)(i * STEP);
        n.dur = 120;
        n.vel = 100;
        c++;
      } else if (i % 4 == 2) {
        DevNote& n = g.notes[g.noteCount++];
        n.pitch = 42;  // hi-hat (agudo)
        n.start = (uint16_t)(i * STEP);
        n.dur = 100;
        n.vel = 70;
        c++;
      }
    }
    t.noteCount = c;
    g.trackCount++;
  }

  finalizeSong(g);
  g_built = true;
  return g;
}
