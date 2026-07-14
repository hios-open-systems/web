// ============================================================================
//  Audio - Salida I2S a los 2x MAX98357A (bus compartido).  rev 0.9
//
//  Los 3 pines de I2S van a los DOS amplis. Lo unico distinto entre ellos es su
//  pin SD, que elige el canal y NO se cablea al S3 (LEFT = SD a Vin; RIGHT = SD
//  por 390k a Vin). O sea: el firmware manda un stream STEREO y el hardware
//  reparte. Por eso el buffer es interleaved L/R.
//
//  `tone()` NO bloquea al que llama: encola y una task propia renderiza. Si
//  bloqueara, el inputTask se congelaria mientras suena y el pad dejaria de
//  responder a las teclas justo cuando te da feedback de que apretaste una.
// ============================================================================
#pragma once
#include <stdint.h>

namespace audio {

// Instala el driver I2S y levanta la task de render. No hace ruido.
// Si cfg::AUDIO_ENABLED es false, es un no-op y ready() queda en false.
void begin();

bool ready();

// Encola un tono. Vuelve enseguida. Si la cola esta llena, lo DESCARTA (mejor
// perder un click que trabar la entrada).
//   hz  : frecuencia. 0 = silencio (sirve de pausa).
//   ms  : duracion.
//   vol : 0..255. Ojo con el buck: dos amplis a full pican fuerte.
void tone(uint16_t hz, uint16_t ms, uint8_t vol = 90);

// Feedback corto de tecla.
void click();

}  // namespace audio
