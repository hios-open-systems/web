#include "SongModel.h"
#include <string.h>
#include <ArduinoJson.h>

using namespace songfmt;

static inline int clampi(int v, int lo, int hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

void finalizeSong(DeviceSong& song) {
  if (song.ppq == 0) song.ppq = PPQ;
  if (song.bpb == 0) song.bpb = 4;
  if (song.lb == 0) song.lb = 4;
  song.loopTicks = (uint32_t)song.lb * song.bpb * song.ppq;
  if (song.loopTicks == 0) song.loopTicks = (uint32_t)PPQ * 4 * 4;
}

ParseResult parseDeviceSong(const char* json, size_t len, DeviceSong& out) {
  ParseResult r{false, 0, 0, 0};

  JsonDocument doc;
  if (deserializeJson(doc, json, len)) return r;      // JSON malo -> 400
  if ((int)(doc["v"] | 0) != WIRE_VERSION) return r;  // version equivocada

  const char* nm = doc["n"] | "device";
  strncpy(out.name, nm, sizeof(out.name) - 1);
  out.name[sizeof(out.name) - 1] = '\0';

  out.bpm = (uint16_t)clampi(doc["bpm"] | 120, BPM_MIN, BPM_MAX);
  out.ppq = (uint16_t)(doc["ppq"] | PPQ);
  out.bpb = (uint16_t)(doc["bpb"] | 4);
  out.lb  = (uint16_t)(doc["lb"] | 4);

  out.trackCount = 0;
  out.noteCount = 0;
  uint16_t dropped = 0;

  JsonArrayConst tracks = doc["t"].as<JsonArrayConst>();
  for (JsonObjectConst t : tracks) {
    if (out.trackCount >= MAX_TRACKS) { dropped++; continue; }
    DevTrack& dt = out.tracks[out.trackCount];

    int instr = t["i"] | 0;
    if (instr < 0 || instr >= INSTR_COUNT) instr = INSTR_PULSE_LEAD;
    dt.instr = (uint8_t)instr;
    dt.muted = (t["m"] | 0) ? 1 : 0;
    dt.vol   = (uint8_t)clampi(t["vol"] | 204, 0, 255);
    dt.firstNote = out.noteCount;

    uint16_t cnt = 0;
    JsonArrayConst notes = t["no"].as<JsonArrayConst>();
    for (JsonArrayConst n : notes) {
      if (out.noteCount >= MAX_NOTES_TOTAL) { dropped++; continue; }
      DevNote& dn = out.notes[out.noteCount];
      dn.pitch = (uint8_t)clampi(n[0] | 0, PITCH_MIN, PITCH_MAX);
      dn.start = (uint16_t)(int)(n[1] | 0);
      dn.dur   = (uint16_t)(int)(n[2] | 0);
      dn.vel   = (uint8_t)clampi(n[3] | 100, VEL_MIN, VEL_MAX);
      out.noteCount++;
      cnt++;
    }
    dt.noteCount = cnt;
    out.trackCount++;
  }

  finalizeSong(out);
  r.ok = true;
  r.tracks = out.trackCount;
  r.notes = out.noteCount;
  r.dropped = dropped;
  return r;
}
