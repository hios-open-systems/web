#include "Sequencer.h"
#include <math.h>
#include "Synth.h"

using namespace songfmt;

namespace seq {

namespace {

struct Voice {
  bool     active;
  bool     releasing;
  uint8_t  instr;
  uint8_t  pitch;
  uint8_t  trackIdx;      // para machear el note-off
  float    phase;
  float    phaseInc;      // freq / SR
  float    amp;           // (vel/127) * (trackVol/255)
  uint32_t elapsed;       // muestras desde note-on
  uint32_t durSamples;    // duracion de la nota en muestras (para el prog)
  uint32_t releaseElapsed;
  uint32_t rng;
};

const DeviceSong* g_song = nullptr;
bool     g_playing = false;
int      g_sr = 44100;
double   g_ticksPerSample = 1.0;
double   g_samplesPerTick = 1.0;
double   g_posTick = 0.0;
uint32_t g_attack = 132;   // ~3ms
uint32_t g_release = 132;  // ~3ms
uint32_t g_rngSeed = 0x1234abcdUL;

Voice g_voices[MAX_VOICES];

void clearVoices() {
  for (auto& v : g_voices) { v.active = false; v.releasing = false; }
}

void releaseAll() {
  for (auto& v : g_voices) {
    if (v.active && !v.releasing) { v.releasing = true; v.releaseElapsed = 0; }
  }
}

void noteOn(uint8_t trackIdx, const DevTrack& tr, const DevNote& n) {
  // buscar voz libre; si no hay, robar la mas vieja (mayor elapsed)
  int slot = -1;
  uint32_t oldest = 0;
  for (int i = 0; i < MAX_VOICES; i++) {
    if (!g_voices[i].active) { slot = i; break; }
    if (g_voices[i].elapsed >= oldest) { oldest = g_voices[i].elapsed; slot = i; }
  }
  Voice& v = g_voices[slot];
  v.active = true;
  v.releasing = false;
  v.instr = tr.instr;
  v.pitch = n.pitch;
  v.trackIdx = trackIdx;
  v.phase = 0.0f;
  v.phaseInc = synth::FREQ_LUT[n.pitch] / (float)g_sr;
  v.amp = (n.vel / 127.0f) * (tr.vol / 255.0f);
  v.elapsed = 0;
  v.durSamples = (uint32_t)(n.dur * g_samplesPerTick);
  v.releaseElapsed = 0;
  v.rng = (g_rngSeed += 0x9e3779b9UL) | 1UL;
}

void noteOff(uint8_t trackIdx, uint8_t pitch) {
  for (auto& v : g_voices) {
    if (v.active && !v.releasing && v.trackIdx == trackIdx && v.pitch == pitch) {
      v.releasing = true;
      v.releaseElapsed = 0;
      return;
    }
  }
}

// dispara note-on/off cuyos bordes caen en [segStart, segEnd)
void scanTriggers(double segStart, double segEnd) {
  for (uint8_t t = 0; t < g_song->trackCount; t++) {
    const DevTrack& tr = g_song->tracks[t];
    if (tr.muted) continue;
    const uint16_t end = tr.firstNote + tr.noteCount;
    for (uint16_t k = tr.firstNote; k < end; k++) {
      const DevNote& n = g_song->notes[k];
      if (n.start >= segStart && n.start < segEnd) noteOn(t, tr, n);
      double off = (double)n.start + n.dur;
      if (off >= segStart && off < segEnd) noteOff(t, n.pitch);
    }
  }
}

void renderSamples(int16_t* out, int frames) {
  for (int i = 0; i < frames; i++) {
    float mix = 0.0f;
    for (auto& v : g_voices) {
      if (!v.active) continue;
      float prog = v.durSamples ? (float)v.elapsed / v.durSamples : 1.0f;
      if (prog > 1.0f) prog = 1.0f;
      float tSec = (float)v.elapsed / g_sr;
      float base = synth::voiceSample(v.instr, v.phase, prog, tSec, v.pitch, v.rng);

      float atk = v.elapsed < g_attack ? (float)v.elapsed / g_attack : 1.0f;
      float rel = 1.0f;
      if (v.releasing) {
        rel = v.releaseElapsed < g_release
                  ? 1.0f - (float)v.releaseElapsed / g_release
                  : 0.0f;
      }
      mix += base * v.amp * atk * rel;

      v.phase += v.phaseInc;
      if (v.phase >= 1.0f) v.phase -= 1.0f;
      v.elapsed++;
      if (v.releasing && ++v.releaseElapsed >= g_release) v.active = false;
    }
    // soft-clip (tanh): redondea los picos en vez de recortarlos en cuadrado.
    // El hard-clip mete energia de alta frecuencia que castiga los parlantes
    // chicos; esto suena mas limpio y, al levantar un poco las senales bajas,
    // mantiene (o mejora) el volumen percibido. Techo ~0.9 -> nunca satura int16.
    mix = tanhf(mix * 1.4f) * 0.9f;
    int16_t s = (int16_t)(mix * 11000.0f);
    out[i * 2] = s;
    out[i * 2 + 1] = s;
  }
}

}  // namespace

void begin(int sampleRate) {
  g_sr = sampleRate;
  g_attack = (uint32_t)(sampleRate * 0.003f);
  g_release = (uint32_t)(sampleRate * 0.003f);
  clearVoices();
}

void setSong(const DeviceSong* song) {
  releaseAll();  // deja morir suave lo que sonaba
  g_song = song;
  g_posTick = 0.0;
  if (song && song->bpm > 0) {
    g_ticksPerSample = (double)song->bpm * song->ppq / (60.0 * g_sr);
    g_samplesPerTick = g_ticksPerSample > 0 ? 1.0 / g_ticksPerSample : 1.0;
  }
}

void setPlaying(bool playing) { g_playing = playing; }
bool isPlaying() { return g_playing && g_song != nullptr; }

uint8_t activeVoices() {
  uint8_t n = 0;
  for (auto& v : g_voices) if (v.active) n++;
  return n;
}

void renderBlock(int16_t* out, int frames) {
  if (!g_song || !g_playing || g_song->loopTicks == 0) {
    for (int i = 0; i < frames * 2; i++) out[i] = 0;
    return;
  }
  int done = 0;
  while (done < frames) {
    double ticksLeft = (double)g_song->loopTicks - g_posTick;
    int framesToEnd = ticksLeft <= 0 ? 1 : (int)ceil(ticksLeft / g_ticksPerSample);
    if (framesToEnd < 1) framesToEnd = 1;
    int seg = frames - done;
    if (seg > framesToEnd) seg = framesToEnd;

    double segStart = g_posTick;
    double segEnd = g_posTick + seg * g_ticksPerSample;
    scanTriggers(segStart, segEnd);
    renderSamples(out + done * 2, seg);

    g_posTick = segEnd;
    done += seg;
    if (g_posTick >= (double)g_song->loopTicks - 1e-6) {
      g_posTick = 0.0;
      releaseAll();  // loop limpio, sin notas colgadas
    }
  }
}

}  // namespace seq
