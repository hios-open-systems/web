/*
 * ═══════════════════════════════════════════════════════════════════════════
 * HIOS BTDAC - Bluetooth Audio Receiver
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ESP32 + PCM5102 DAC + LED RGB Status
 * 
 * Pinout I2S:
 *   BCK  -> GPIO 27
 *   LCK  -> GPIO 14
 *   DIN  -> GPIO 13
 *   SCK  -> GND
 * 
 * Pinout LED RGB (con resistencias 330Ω):
 *   R -> GPIO 4
 *   G -> GPIO 16
 *   B -> GPIO 17
 * 
 * Estados LED:
 *   Azul parpadeante  -> Esperando conexión
 *   Cyan parpadeante  -> Conectando
 *   Verde fijo        -> Conectado
 *   Verde parpadeante -> Reproduciendo
 *   Rojo parpadeante  -> Error
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

#include <Arduino.h>
#include "BluetoothA2DPSink.h"

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const char* BT_DEVICE_NAME = "HIOS BTDAC";

// Pines I2S (PCM5102) - PINOUT VERIFICADO
const int I2S_BCK  = 27;
const int I2S_LRCK = 14;
const int I2S_DOUT = 13;

// Pines LED RGB (con resistencias 330Ω)
const int LED_R = 4;
const int LED_G = 16;
const int LED_B = 17;

// Volumen inicial (0-127)
const int INITIAL_VOLUME = 60;

// ═══════════════════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════════════════

BluetoothA2DPSink a2dp_sink;

enum SystemState {
    STATE_WAITING,      // Esperando conexión BT
    STATE_CONNECTING,   // Conectando
    STATE_CONNECTED,    // Conectado, sin reproducir
    STATE_PLAYING,      // Reproduciendo audio
    STATE_ERROR         // Error
};

volatile SystemState currentState = STATE_WAITING;

// Variables para LED parpadeante (non-blocking)
unsigned long previousMillis = 0;
bool ledBlinkState = false;

// Info del track actual
String currentTitle = "";
String currentArtist = "";
String currentAlbum = "";

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES LED
// ═══════════════════════════════════════════════════════════════════════════

void led_off() {
    digitalWrite(LED_R, LOW);
    digitalWrite(LED_G, LOW);
    digitalWrite(LED_B, LOW);
}

void led_set(bool r, bool g, bool b) {
    digitalWrite(LED_R, r ? HIGH : LOW);
    digitalWrite(LED_G, g ? HIGH : LOW);
    digitalWrite(LED_B, b ? HIGH : LOW);
}

// Colores predefinidos
void led_red()    { led_set(1, 0, 0); }
void led_green()  { led_set(0, 1, 0); }
void led_blue()   { led_set(0, 0, 1); }
void led_cyan()   { led_set(0, 1, 1); }
void led_yellow() { led_set(1, 1, 0); }
void led_purple() { led_set(1, 0, 1); }
void led_white()  { led_set(1, 1, 1); }

void led_test() {
    Serial.println("[LED] Test de colores...");
    led_red();    delay(150);
    led_green();  delay(150);
    led_blue();   delay(150);
    led_cyan();   delay(150);
    led_yellow(); delay(150);
    led_purple(); delay(150);
    led_white();  delay(150);
    led_off();
}

// ═══════════════════════════════════════════════════════════════════════════
// CALLBACKS A2DP
// ═══════════════════════════════════════════════════════════════════════════

void connection_state_changed(esp_a2d_connection_state_t state, void *ptr) {
    switch (state) {
        case ESP_A2D_CONNECTION_STATE_DISCONNECTED:
            Serial.println("[BT] Desconectado");
            currentState = STATE_WAITING;
            currentTitle = "";
            currentArtist = "";
            currentAlbum = "";
            break;
            
        case ESP_A2D_CONNECTION_STATE_CONNECTING:
            Serial.println("[BT] Conectando...");
            currentState = STATE_CONNECTING;
            break;
            
        case ESP_A2D_CONNECTION_STATE_CONNECTED:
            Serial.println("[BT] ¡Conectado!");
            currentState = STATE_CONNECTED;
            break;
            
        case ESP_A2D_CONNECTION_STATE_DISCONNECTING:
            Serial.println("[BT] Desconectando...");
            break;
    }
}

void audio_state_changed(esp_a2d_audio_state_t state, void *ptr) {
    switch (state) {
        case ESP_A2D_AUDIO_STATE_STARTED:
            Serial.println("[Audio] ▶ Reproduciendo");
            currentState = STATE_PLAYING;
            break;
            
        case ESP_A2D_AUDIO_STATE_STOPPED:
            Serial.println("[Audio] ■ Detenido");
            if (currentState == STATE_PLAYING) {
                currentState = STATE_CONNECTED;
            }
            break;
            
        case ESP_A2D_AUDIO_STATE_REMOTE_SUSPEND:
            Serial.println("[Audio] ⏸ Pausado");
            if (currentState == STATE_PLAYING) {
                currentState = STATE_CONNECTED;
            }
            break;
    }
}

void avrc_metadata_callback(uint8_t id, const uint8_t *text) {
    String content = String((char*)text);
    
    switch (id) {
        case ESP_AVRC_MD_ATTR_TITLE:
            currentTitle = content;
            Serial.printf("[Track] 🎵 %s\n", content.c_str());
            break;
            
        case ESP_AVRC_MD_ATTR_ARTIST:
            currentArtist = content;
            Serial.printf("[Track] 👤 %s\n", content.c_str());
            break;
            
        case ESP_AVRC_MD_ATTR_ALBUM:
            currentAlbum = content;
            Serial.printf("[Track] 💿 %s\n", content.c_str());
            break;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
    Serial.begin(115200);
    delay(500);
    
    Serial.println();
    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.println("              HIOS BTDAC - Bluetooth Audio                 ");
    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.printf("Dispositivo: %s\n", BT_DEVICE_NAME);
    Serial.printf("Pines I2S: BCK=%d, LCK=%d, DIN=%d\n", I2S_BCK, I2S_LRCK, I2S_DOUT);
    Serial.println("═══════════════════════════════════════════════════════════");
    
    // Configurar pines LED
    pinMode(LED_R, OUTPUT);
    pinMode(LED_G, OUTPUT);
    pinMode(LED_B, OUTPUT);
    
    // Test de LEDs
    led_test();
    
    // ─────────────────────────────────────────────────────────────────────────
    // Configuración I2S
    // ─────────────────────────────────────────────────────────────────────────
    
    Serial.println("[I2S] Configurando...");
    
    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCK,
        .ws_io_num = I2S_LRCK,
        .data_out_num = I2S_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };
    a2dp_sink.set_pin_config(pin_config);
    
    // ─────────────────────────────────────────────────────────────────────────
    // Callbacks
    // ─────────────────────────────────────────────────────────────────────────
    
    a2dp_sink.set_on_connection_state_changed(connection_state_changed);
    a2dp_sink.set_on_audio_state_changed(audio_state_changed);
    a2dp_sink.set_avrc_metadata_callback(avrc_metadata_callback);
    
    // Habilitar AVRCP para recibir metadata
    a2dp_sink.set_avrc_metadata_attribute_mask(
        ESP_AVRC_MD_ATTR_TITLE | 
        ESP_AVRC_MD_ATTR_ARTIST | 
        ESP_AVRC_MD_ATTR_ALBUM
    );
    
    // ─────────────────────────────────────────────────────────────────────────
    // Volumen y arranque
    // ─────────────────────────────────────────────────────────────────────────
    
    a2dp_sink.set_volume(INITIAL_VOLUME);
    
    Serial.println("[BT] Iniciando Bluetooth...");
    a2dp_sink.start(BT_DEVICE_NAME);
    
    Serial.println("[OK] Sistema listo");
    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.println("Buscá '" + String(BT_DEVICE_NAME) + "' en tu teléfono");
    Serial.println("═══════════════════════════════════════════════════════════");
    
    currentState = STATE_WAITING;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOOP
// ═══════════════════════════════════════════════════════════════════════════

void loop() {
    unsigned long currentMillis = millis();
    
    switch (currentState) {
        case STATE_WAITING:
            // Azul parpadeante lento - Esperando conexión
            if (currentMillis - previousMillis >= 1000) {
                previousMillis = currentMillis;
                ledBlinkState = !ledBlinkState;
                led_set(0, 0, ledBlinkState);
            }
            break;
            
        case STATE_CONNECTING:
            // Cyan parpadeante rápido - Conectando
            if (currentMillis - previousMillis >= 200) {
                previousMillis = currentMillis;
                ledBlinkState = !ledBlinkState;
                led_set(0, ledBlinkState, ledBlinkState);
            }
            break;
            
        case STATE_CONNECTED:
            // Verde fijo - Conectado
            led_green();
            break;
            
        case STATE_PLAYING:
            // Verde parpadeante suave - Reproduciendo
            if (currentMillis - previousMillis >= 500) {
                previousMillis = currentMillis;
                ledBlinkState = !ledBlinkState;
                led_set(0, ledBlinkState, 0);
            }
            break;
            
        case STATE_ERROR:
            // Rojo parpadeante - Error
            if (currentMillis - previousMillis >= 250) {
                previousMillis = currentMillis;
                ledBlinkState = !ledBlinkState;
                led_set(ledBlinkState, 0, 0);
            }
            break;
    }
    
    delay(10);
}

// ═══════════════════════════════════════════════════════════════════════════
// FIN
// ═══════════════════════════════════════════════════════════════════════════
