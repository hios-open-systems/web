// HIOS Speaker Test - Motor de audio (device)
// -----------------------------------------------------------------------------
// I2S + tarea FreeRTOS de render (pineada a core 1; WiFi/WebServer en core 0).
// Andamiaje portado de projects/pad/src/audio/Audio.cpp, pero con render CONTINUO
// (no one-shot). El swap de cancion se pide desde cualquier tarea y se aplica
// dentro de la tarea de audio, asi el secuenciador nunca se toca cross-task.
// -----------------------------------------------------------------------------
#pragma once
#include <stddef.h>
#include <stdint.h>
#include "SongModel.h"

namespace audio {

constexpr int SAMPLE_RATE = 44100;

void begin();                       // instala I2S y arranca la tarea
void swap(const DeviceSong* song);  // pide hot-swap (thread-safe)
void play();
void stop();
bool playing();
uint8_t voices();

}  // namespace audio
