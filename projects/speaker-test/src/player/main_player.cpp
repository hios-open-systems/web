// HIOS Speaker Test - PLAYER
// -----------------------------------------------------------------------------
// Reproductor de chiptune por I2S, data-driven e independiente.
//   - Al boot toca la ultima cancion guardada en flash (o la DefaultSong).
//   - Sirve su propia pagina web (http) para cambiar la cancion en vivo:
//     compones en openhios.dev -> "exportar para device" -> pegas aca -> suena.
//   - Si no hay WiFi, igual suena (independiente de la red).
//
//   pio run -e player -t upload
//   (configura WIFI_SSID / WIFI_PASS en platformio.ini)
// -----------------------------------------------------------------------------
#include <Arduino.h>
#include "Synth.h"
#include "Sequencer.h"
#include "AudioEngine.h"
#include "Store.h"
#include "Net.h"

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== HIOS Speaker Test - PLAYER ===");

  synth::init();
  seq::begin(audio::SAMPLE_RATE);
  audio::begin();
  store::begin();
  net::begin();  // carga cancion + reproduce + WiFi + servidor web

  Serial.println("Listo.");
}

void loop() {
  net::loop();
  delay(2);
}
