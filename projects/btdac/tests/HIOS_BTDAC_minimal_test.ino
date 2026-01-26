/*
 * HIOS BTDAC - VERSIÓN MINIMALISTA DE PRUEBA
 * 
 * Si esta versión funciona, el problema está en la configuración I2S.
 * Si NO funciona, el problema es de hardware/cableado.
 * 
 * Pinout:
 *   GPIO 26 -> PCM5102 BCK
 *   GPIO 25 -> PCM5102 LRCK  
 *   GPIO 22 -> PCM5102 DIN
 *   PCM5102 SCK -> GND
 */

#include <Arduino.h>
#include "BluetoothA2DPSink.h"

BluetoothA2DPSink a2dp_sink;

void setup() {
    Serial.begin(115200);
    Serial.println("\n\n=== HIOS BTDAC TEST ===\n");
    
    // Configurar pines I2S
    i2s_pin_config_t pin_config = {
        .bck_io_num = 26,
        .ws_io_num = 25,
        .data_out_num = 22,
        .data_in_num = I2S_PIN_NO_CHANGE
    };
    a2dp_sink.set_pin_config(pin_config);
    
    // Iniciar con configuración por defecto
    a2dp_sink.start("HIOS TEST");
    
    Serial.println("Bluetooth iniciado como 'HIOS TEST'");
    Serial.println("Conectate y reproducí música...");
}

void loop() {
    delay(1000);
}
