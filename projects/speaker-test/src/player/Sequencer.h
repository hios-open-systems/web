// HIOS Speaker Test - Secuenciador + mezcla (device)
// -----------------------------------------------------------------------------
// Reloj de ticks derivado del sample rate, note-on/off por cruce de tiempo,
// asignacion de hasta MAX_VOICES voces (roba la mas vieja), y mezcla a int16
// estereo. Corre SOLO en la tarea de audio (nadie mas toca su estado).
// -----------------------------------------------------------------------------
#pragma once
#include <stdint.h>
#include "SongModel.h"

namespace seq {

void begin(int sampleRate);
void setSong(const DeviceSong* song);  // resetea posicion y libera voces
void setPlaying(bool playing);
bool isPlaying();
uint8_t activeVoices();

// Rellena `out` (interleaved L/R) con `frames` cuadros. Silencio si no hay
// cancion o esta detenido.
void renderBlock(int16_t* out, int frames);

}  // namespace seq
