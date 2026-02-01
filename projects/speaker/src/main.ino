/**
 * HIOS WiFi Speaker - Firmware v3.0
 *
 * Hub de audio WiFi + Bluetooth con display LCD.
 *
 * FEATURES:
 * - WiFi Radio Streams (presets + custom URL)
 * - YouTube Audio via Invidious API
 * - Bluetooth A2DP Sink
 * - Bluetooth Serial config (WiFi setup via BT terminal app)
 * - LCD 16x2 I2C display
 * - Web control interface
 * - Battery monitoring
 * - OTA Updates
 *
 * HARDWARE:
 * - ESP32 DevKit V1
 * - MAX98357 I2S Amplifier
 * - LCD 16x2 I2C (HD44780)
 * - Speaker 4ohm 3W
 * - LM2596 Power Supply (5V)
 * - 2x 18650 Batteries
 *
 * PINOUT:
 * - I2S: DIN=GPIO25, BCLK=GPIO26, LRC=GPIO27
 * - I2C: SDA=GPIO21, SCL=GPIO22
 * - VBAT: GPIO34 (divisor 100k/100k)
 *
 * License: MIT
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#include <ArduinoOTA.h>
#include <Preferences.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Audio libraries
#include "Audio.h"  // ESP32-audioI2S library
#include "BluetoothA2DPSink.h"
#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// ============================================
// CONFIGURACION
// ============================================

const char* DEVICE_NAME = "HIOS-Speaker";
const char* AP_PASSWORD = "hios1234";
const char* OTA_PASSWORD = "hios";

// ============================================
// PINES
// ============================================

// I2S Audio
#define I2S_DOUT      25
#define I2S_BCLK      26
#define I2S_LRC       27

// I2C LCD
#define I2C_SDA       21
#define I2C_SCL       22
#define LCD_ADDR      0x27  // Probar 0x3F si no funciona

// Bateria
#define VBAT_PIN      34
#define VBAT_ENABLED  true
#define VBAT_MULT     2.0
#define VBAT_MIN      6.0
#define VBAT_MAX      8.4

// ============================================
// OBJETOS GLOBALES
// ============================================

WebServer server(80);
LiquidCrystal_I2C lcd(LCD_ADDR, 16, 2);
Audio audio;
BluetoothA2DPSink a2dp_sink;
Preferences prefs;

// ============================================
// ESTADO
// ============================================

enum Mode { MODE_IDLE, MODE_WIFI_RADIO, MODE_WIFI_STREAM, MODE_BLUETOOTH };
Mode currentMode = MODE_IDLE;

int volume = 80;
float batteryVoltage = 0.0;
int batteryPercent = 0;
unsigned long lastBatteryRead = 0;
unsigned long lastLCDUpdate = 0;

String currentStation = "";
String currentTitle = "";
String currentArtist = "";
bool isPlaying = false;

// ============================================
// RADIO PRESETS
// ============================================

struct RadioStation {
    const char* name;
    const char* url;
    const char* genre;
};

RadioStation radioPresets[] = {
    {"Mega 98.3", "http://cdn.instream.audio:9078/stream", "Pop"},
    {"Rock & Pop", "http://mp3.metadatastream.com/stream/rockandpop", "Rock"},
    {"Blue FM 100.7", "http://mediasrv.bluefm.com.ar/bluefm.mp3", "Hits"},
    {"La 100", "http://la100-edge.cdn.gob.ar/la100.mp3", "Pop"},
    {"Aspen 102.3", "http://cdn.instream.audio:9082/stream", "Relax"},
    {"Metro 95.1", "http://metro951.com/metro951.mp3", "Urban"},
    {"FreshFM Trance", "http://sc9.1.fm:7070/", "Trance"},
    {"SomaFM Groove", "http://ice1.somafm.com/groovesalad-128-mp3", "Chill"},
    {"KEXP Seattle", "http://live-mp3-128.kexp.org/kexp128.mp3", "Indie"},
    {"Jazz24", "http://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1", "Jazz"},
};
const int RADIO_COUNT = sizeof(radioPresets) / sizeof(radioPresets[0]);

// ============================================
// LCD FUNCTIONS
// ============================================

void lcdInit() {
    Wire.begin(I2C_SDA, I2C_SCL);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("HIOS Speaker");
    lcd.setCursor(0, 1);
    lcd.print("v3.0 Starting...");
}

void lcdUpdate() {
    lcd.clear();

    // Linea 1: Modo + Volumen + Bateria
    lcd.setCursor(0, 0);
    switch (currentMode) {
        case MODE_WIFI_RADIO:
            lcd.print("Radio ");
            break;
        case MODE_WIFI_STREAM:
            lcd.print("Stream");
            break;
        case MODE_BLUETOOTH:
            lcd.print("BT    ");
            break;
        default:
            lcd.print("Idle  ");
    }

    lcd.setCursor(7, 0);
    lcd.print("V:");
    lcd.print(volume);
    lcd.print("%");

    if (VBAT_ENABLED && batteryPercent >= 0) {
        lcd.setCursor(13, 0);
        if (batteryPercent >= 100) {
            lcd.print("FUL");
        } else {
            lcd.print(batteryPercent);
            lcd.print("%");
        }
    }

    // Linea 2: Titulo o estado
    lcd.setCursor(0, 1);
    if (isPlaying) {
        String display = currentTitle.length() > 0 ? currentTitle : currentStation;
        if (display.length() > 16) {
            display = display.substring(0, 15) + ".";
        }
        lcd.print(display);
    } else {
        lcd.print("Ready");
    }
}

void lcdShowMessage(const char* line1, const char* line2) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
}

// ============================================
// BATTERY
// ============================================

void readBattery() {
    if (!VBAT_ENABLED) {
        batteryPercent = -1;
        return;
    }

    long sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += analogRead(VBAT_PIN);
        delay(1);
    }
    float adcVoltage = (sum / 10.0 / 4095.0) * 3.3;
    batteryVoltage = adcVoltage * VBAT_MULT;
    batteryPercent = constrain(::map(batteryVoltage * 100, VBAT_MIN * 100, VBAT_MAX * 100, 0, 100), 0, 100);
}

// ============================================
// WIFI AUDIO
// ============================================

void setupWiFiAudio() {
    audio.setPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);
    audio.setVolume(::map(volume, 0, 100, 0, 21));
}

void playRadioStation(int index) {
    if (index < 0 || index >= RADIO_COUNT) return;

    stopAll();
    currentMode = MODE_WIFI_RADIO;
    currentStation = radioPresets[index].name;
    currentTitle = "";

    lcdShowMessage("Connecting...", radioPresets[index].name);

    audio.connecttohost(radioPresets[index].url);
    isPlaying = true;

    Serial.printf("[Radio] Playing: %s\n", radioPresets[index].name);
}

void playCustomURL(const char* url) {
    stopAll();
    currentMode = MODE_WIFI_STREAM;
    currentStation = "Custom Stream";
    currentTitle = "";

    lcdShowMessage("Connecting...", "Custom URL");

    audio.connecttohost(url);
    isPlaying = true;

    Serial.printf("[Stream] Playing: %s\n", url);
}

void playYouTube(const char* videoId) {
    // Usar Invidious para obtener URL de audio
    // Invidious instances: https://api.invidious.io/
    String apiUrl = "https://inv.nadeko.net/api/v1/videos/" + String(videoId);

    HTTPClient http;
    http.begin(apiUrl);
    http.setTimeout(10000);

    lcdShowMessage("Loading...", "YouTube");

    int httpCode = http.GET();
    if (httpCode == 200) {
        String payload = http.getString();

        // Buscar URL de audio (formato adaptativo)
        // Simplificado - en produccion usar ArduinoJson
        int audioStart = payload.indexOf("\"audioQuality\"");
        if (audioStart > 0) {
            int urlStart = payload.indexOf("\"url\":\"", audioStart) + 7;
            int urlEnd = payload.indexOf("\"", urlStart);
            String audioUrl = payload.substring(urlStart, urlEnd);
            audioUrl.replace("\\/", "/");

            stopAll();
            currentMode = MODE_WIFI_STREAM;
            currentStation = "YouTube";

            audio.connecttohost(audioUrl.c_str());
            isPlaying = true;

            Serial.println("[YouTube] Playing audio stream");
        } else {
            lcdShowMessage("Error", "No audio found");
            Serial.println("[YouTube] No audio stream found");
        }
    } else {
        lcdShowMessage("Error", "API failed");
        Serial.printf("[YouTube] API error: %d\n", httpCode);
    }
    http.end();
}

// ============================================
// BLUETOOTH AUDIO
// ============================================

// Callback para metadata de BT
void avrc_metadata_callback(uint8_t id, const uint8_t *text) {
    if (id == 0x01) {  // Title
        currentTitle = String((char*)text);
    } else if (id == 0x02) {  // Artist
        currentArtist = String((char*)text);
    }
    Serial.printf("[BT] Metadata %d: %s\n", id, text);
}

void startBluetooth() {
    stopAll();
    currentMode = MODE_BLUETOOTH;
    currentStation = "Bluetooth";
    currentTitle = "Waiting...";

    lcdShowMessage("Bluetooth", "Waiting...");

    // Configurar A2DP Sink
    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK,
        .ws_io_num = I2S_LRC,
        .data_out_num = I2S_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    a2dp_sink.set_pin_config(pin_config);
    a2dp_sink.set_avrc_metadata_callback(avrc_metadata_callback);
    a2dp_sink.start(DEVICE_NAME);

    isPlaying = true;
    Serial.println("[BT] A2DP Sink started");
}

void stopBluetooth() {
    if (currentMode == MODE_BLUETOOTH) {
        a2dp_sink.end();
        currentMode = MODE_IDLE;
        isPlaying = false;
        Serial.println("[BT] Stopped");
    }
}

// ============================================
// CONTROL
// ============================================

void stopAll() {
    if (currentMode == MODE_WIFI_RADIO || currentMode == MODE_WIFI_STREAM) {
        audio.stopSong();
    } else if (currentMode == MODE_BLUETOOTH) {
        a2dp_sink.end();
    }
    currentMode = MODE_IDLE;
    isPlaying = false;
    currentTitle = "";
    currentArtist = "";
}

void setVolume(int vol) {
    volume = constrain(vol, 0, 100);

    if (currentMode == MODE_WIFI_RADIO || currentMode == MODE_WIFI_STREAM) {
        audio.setVolume(::map(volume, 0, 100, 0, 21));
    } else if (currentMode == MODE_BLUETOOTH) {
        a2dp_sink.set_volume(::map(volume, 0, 100, 0, 127));
    }

    prefs.putInt("volume", volume);
    Serial.printf("[Volume] %d%%\n", volume);
}

// ============================================
// BLUETOOTH SERIAL CONFIG
// ============================================

String btBuffer = "";

void btSendLine(const char* msg) {
    SerialBT.println(msg);
    Serial.println(msg);
}

void btScanNetworks() {
    btSendLine("[SCAN] Scanning WiFi networks...");
    int n = WiFi.scanNetworks();
    if (n == 0) {
        btSendLine("[SCAN] No networks found");
    } else {
        for (int i = 0; i < n; i++) {
            String line = String(i + 1) + ": " + WiFi.SSID(i) + " (" + WiFi.RSSI(i) + "dBm)";
            if (WiFi.encryptionType(i) != WIFI_AUTH_OPEN) line += " *";
            btSendLine(line.c_str());
        }
    }
    btSendLine("[SCAN] Done");
}

void btShowStatus() {
    btSendLine("═══ HIOS Speaker Status ═══");

    String wifiStatus = "[WiFi] ";
    if (WiFi.status() == WL_CONNECTED) {
        wifiStatus += "Connected: " + WiFi.localIP().toString();
        wifiStatus += " (RSSI: " + String(WiFi.RSSI()) + "dBm)";
    } else {
        wifiStatus += "Not connected";
    }
    btSendLine(wifiStatus.c_str());

    String savedSSID = prefs.getString("wifi_ssid", "");
    if (savedSSID.length() > 0) {
        btSendLine(("[Saved] SSID: " + savedSSID).c_str());
    }

    btSendLine(("[Volume] " + String(volume) + "%").c_str());
    btSendLine(("[Battery] " + String(batteryVoltage, 2) + "V (" + String(batteryPercent) + "%)").c_str());
    btSendLine(("[Mode] " + String(currentMode == MODE_WIFI_RADIO ? "Radio" :
                                    currentMode == MODE_WIFI_STREAM ? "Stream" :
                                    currentMode == MODE_BLUETOOTH ? "BT Audio" : "Idle")).c_str());
    btSendLine("════════════════════════════");
}

void btSetWiFi(String ssid, String password) {
    btSendLine(("[WiFi] Setting: " + ssid).c_str());

    // Guardar credenciales
    prefs.putString("wifi_ssid", ssid);
    prefs.putString("wifi_pass", password);

    // Intentar conectar
    WiFi.disconnect();
    WiFi.begin(ssid.c_str(), password.c_str());

    lcdShowMessage("Connecting", ssid.c_str());

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        SerialBT.print(".");
        attempts++;
    }
    SerialBT.println();

    if (WiFi.status() == WL_CONNECTED) {
        String msg = "[WiFi] OK! IP: " + WiFi.localIP().toString();
        btSendLine(msg.c_str());
        lcdShowMessage("WiFi OK", WiFi.localIP().toString().c_str());

        if (MDNS.begin(DEVICE_NAME)) {
            MDNS.addService("http", "tcp", 80);
        }
    } else {
        btSendLine("[WiFi] Failed to connect");
        lcdShowMessage("WiFi Error", "Check credentials");
    }
}

void btResetWiFi() {
    btSendLine("[WiFi] Clearing saved credentials...");
    prefs.remove("wifi_ssid");
    prefs.remove("wifi_pass");
    WiFi.disconnect(true, true);
    btSendLine("[WiFi] Done. Restart to apply.");
}

void btShowHelp() {
    btSendLine("═══ HIOS Commands ═══");
    btSendLine("WIFI:ssid:password  - Set WiFi credentials");
    btSendLine("SCAN                - Scan WiFi networks");
    btSendLine("STATUS              - Show device status");
    btSendLine("RESET               - Clear WiFi credentials");
    btSendLine("RESTART             - Restart device");
    btSendLine("VOL:0-100           - Set volume");
    btSendLine("HELP                - Show this help");
    btSendLine("═════════════════════");
}

void processBluetoothCommand(String originalCmd) {
    originalCmd.trim();
    String cmd = originalCmd;
    cmd.toUpperCase();

    Serial.printf("[BT Cmd] %s\n", originalCmd.c_str());

    if (cmd.startsWith("WIFI:")) {
        // Parse WIFI:ssid:password (mantener case original)
        String params = originalCmd.substring(5);
        int sepIndex = params.indexOf(':');
        if (sepIndex > 0) {
            String ssid = params.substring(0, sepIndex);
            String pass = params.substring(sepIndex + 1);
            btSetWiFi(ssid, pass);
        } else {
            btSendLine("[Error] Format: WIFI:ssid:password");
        }
    }
    else if (cmd == "SCAN") {
        btScanNetworks();
    }
    else if (cmd == "STATUS") {
        btShowStatus();
    }
    else if (cmd == "RESET") {
        btResetWiFi();
    }
    else if (cmd == "RESTART") {
        btSendLine("[System] Restarting...");
        delay(500);
        ESP.restart();
    }
    else if (cmd.startsWith("VOL:")) {
        int vol = originalCmd.substring(4).toInt();
        setVolume(vol);
        btSendLine(("[Volume] Set to " + String(volume) + "%").c_str());
    }
    else if (cmd == "HELP" || cmd == "?") {
        btShowHelp();
    }
    else if (cmd.length() > 0) {
        btSendLine("[Error] Unknown command. Type HELP for commands.");
    }
}

void handleBluetoothSerial() {
    while (SerialBT.available()) {
        char c = SerialBT.read();
        if (c == '\n' || c == '\r') {
            if (btBuffer.length() > 0) {
                processBluetoothCommand(btBuffer);
            }
            btBuffer = "";
        } else if (btBuffer.length() < 128) {  // Limit buffer size
            btBuffer += c;
        }
    }
}

// ============================================
// WEB SERVER
// ============================================

String getStatusJSON() {
    String json = "{";
    json += "\"mode\":\"" + String(currentMode == MODE_WIFI_RADIO ? "radio" :
                                   currentMode == MODE_WIFI_STREAM ? "stream" :
                                   currentMode == MODE_BLUETOOTH ? "bluetooth" : "idle") + "\",";
    json += "\"playing\":" + String(isPlaying ? "true" : "false") + ",";
    json += "\"station\":\"" + currentStation + "\",";
    json += "\"title\":\"" + currentTitle + "\",";
    json += "\"volume\":" + String(volume) + ",";
    json += "\"battery\":" + String(batteryPercent) + ",";
    json += "\"voltage\":" + String(batteryVoltage, 2) + ",";
    json += "\"rssi\":" + String(WiFi.RSSI());
    json += "}";
    return json;
}

String getRadioListJSON() {
    String json = "[";
    for (int i = 0; i < RADIO_COUNT; i++) {
        if (i > 0) json += ",";
        json += "{\"id\":" + String(i) + ",";
        json += "\"name\":\"" + String(radioPresets[i].name) + "\",";
        json += "\"genre\":\"" + String(radioPresets[i].genre) + "\"}";
    }
    json += "]";
    return json;
}

void handleRoot() {
    String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <meta charset='UTF-8'>
    <title>HIOS Speaker</title>
    <style>
        :root { --accent: #f59e0b; --bg: #0d0d0d; --card: #1a1a1a; --success: #10b981; --blue: #3b82f6; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: #fff; padding: 15px; }
        .container { max-width: 500px; margin: 0 auto; }
        h1 { color: var(--accent); font-size: 24px; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; font-size: 14px; }
        .card { background: var(--card); border-radius: 12px; padding: 15px; margin-bottom: 15px; }
        .card h2 { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 12px; }

        .now-playing { text-align: center; padding: 20px; }
        .mode-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 10px; }
        .mode-radio { background: var(--success); color: #000; }
        .mode-bluetooth { background: var(--blue); color: #fff; }
        .mode-idle { background: #333; color: #888; }
        .now-title { font-size: 18px; font-weight: bold; margin: 10px 0 5px; }
        .now-station { color: #888; font-size: 14px; }

        .volume-row { display: flex; align-items: center; gap: 12px; }
        .volume-row input { flex: 1; height: 6px; -webkit-appearance: none; background: #333; border-radius: 3px; }
        .volume-row input::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: var(--accent); border-radius: 50%; }
        .volume-val { min-width: 45px; text-align: right; font-weight: bold; }

        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; background: #262626; border: none; color: #888; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .tab.active { background: var(--accent); color: #000; }

        .station-list { max-height: 250px; overflow-y: auto; }
        .station { display: flex; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; margin-bottom: 5px; background: #262626; }
        .station:hover { background: #333; }
        .station.playing { background: rgba(16, 185, 129, 0.2); border: 1px solid var(--success); }
        .station-name { flex: 1; font-size: 14px; }
        .station-genre { font-size: 11px; color: #666; }

        .input-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .input-row input { flex: 1; padding: 12px; background: #262626; border: 1px solid #333; border-radius: 8px; color: #fff; font-size: 14px; }
        .btn { padding: 12px 20px; background: var(--accent); color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn:hover { background: #d97706; }
        .btn-secondary { background: #333; color: #fff; }
        .btn-blue { background: var(--blue); color: #fff; }
        .btn-stop { background: #ef4444; color: #fff; }

        .status-row { display: flex; justify-content: space-between; font-size: 13px; color: #666; }

        .controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
        .control-btn { padding: 15px; background: #262626; border: none; border-radius: 8px; color: #fff; cursor: pointer; }
        .control-btn:hover { background: #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>HIOS Speaker</h1>
        <p class="subtitle">WiFi + Bluetooth Audio Hub</p>

        <div class="card now-playing">
            <span class="mode-badge mode-idle" id="modeBadge">IDLE</span>
            <div class="now-title" id="nowTitle">Ready</div>
            <div class="now-station" id="nowStation">Select a source below</div>
        </div>

        <div class="card">
            <h2>Volume</h2>
            <div class="volume-row">
                <input type="range" id="volume" min="0" max="100" value="80" oninput="setVol(this.value)">
                <span class="volume-val" id="volVal">80%</span>
            </div>
        </div>

        <div class="card">
            <div class="tabs">
                <button class="tab active" onclick="showTab('radio')">Radio</button>
                <button class="tab" onclick="showTab('youtube')">YouTube</button>
                <button class="tab" onclick="showTab('bluetooth')">Bluetooth</button>
            </div>

            <div id="tab-radio">
                <div class="station-list" id="stationList"></div>
            </div>

            <div id="tab-youtube" style="display:none">
                <div class="input-row">
                    <input type="text" id="ytUrl" placeholder="YouTube URL or Video ID">
                </div>
                <button class="btn" onclick="playYT()" style="width:100%">Play YouTube</button>
                <p style="color:#666;font-size:12px;margin-top:10px;text-align:center">
                    Paste a YouTube URL or video ID (e.g., dQw4w9WgXcQ)
                </p>
            </div>

            <div id="tab-bluetooth" style="display:none;text-align:center;padding:20px 0">
                <p style="color:#888;margin-bottom:15px">Switch to Bluetooth mode to receive audio from your phone</p>
                <button class="btn btn-blue" onclick="startBT()">Enable Bluetooth</button>
                <p style="color:#666;font-size:12px;margin-top:15px">
                    Device will appear as "HIOS-Speaker"
                </p>
            </div>
        </div>

        <div class="card">
            <div class="controls">
                <button class="control-btn btn-stop" onclick="stop()">Stop</button>
                <button class="control-btn" onclick="cmd('restart')">Restart</button>
                <button class="control-btn" onclick="cmd('reset-wifi')">Reset WiFi</button>
            </div>
        </div>

        <div class="card">
            <div class="status-row">
                <span>Battery: <span id="battery">--</span></span>
                <span>WiFi: <span id="rssi">--</span> dBm</span>
            </div>
        </div>
    </div>

    <script>
        let currentPlaying = -1;

        function cmd(c) { fetch('/' + c); }
        function setVol(v) {
            document.getElementById('volVal').textContent = v + '%';
            fetch('/volume?v=' + v);
        }

        function showTab(t) {
            document.querySelectorAll('.tab').forEach((el,i) => el.classList.toggle('active',
                (t=='radio'&&i==0)||(t=='youtube'&&i==1)||(t=='bluetooth'&&i==2)));
            document.getElementById('tab-radio').style.display = t=='radio' ? 'block' : 'none';
            document.getElementById('tab-youtube').style.display = t=='youtube' ? 'block' : 'none';
            document.getElementById('tab-bluetooth').style.display = t=='bluetooth' ? 'block' : 'none';
        }

        function playStation(id) {
            fetch('/radio?id=' + id);
            currentPlaying = id;
            updateStationList();
        }

        function playYT() {
            let url = document.getElementById('ytUrl').value.trim();
            let videoId = url.includes('youtube.com') ? url.split('v=')[1]?.split('&')[0] :
                          url.includes('youtu.be') ? url.split('/').pop() : url;
            if (videoId) fetch('/youtube?id=' + videoId);
        }

        function startBT() { fetch('/bluetooth'); }
        function stop() { fetch('/stop'); currentPlaying = -1; updateStationList(); }

        function updateStationList() {
            fetch('/radios').then(r => r.json()).then(list => {
                let html = '';
                list.forEach(s => {
                    html += '<div class="station' + (s.id==currentPlaying?' playing':'') + '" onclick="playStation(' + s.id + ')">';
                    html += '<span class="station-name">' + s.name + '</span>';
                    html += '<span class="station-genre">' + s.genre + '</span>';
                    html += '</div>';
                });
                document.getElementById('stationList').innerHTML = html;
            });
        }

        function updateStatus() {
            fetch('/status').then(r => r.json()).then(d => {
                document.getElementById('volume').value = d.volume;
                document.getElementById('volVal').textContent = d.volume + '%';
                document.getElementById('rssi').textContent = d.rssi;
                document.getElementById('battery').textContent = d.battery >= 0 ? d.voltage + 'V (' + d.battery + '%)' : 'N/A';

                let badge = document.getElementById('modeBadge');
                badge.textContent = d.mode.toUpperCase();
                badge.className = 'mode-badge mode-' + d.mode;

                document.getElementById('nowTitle').textContent = d.title || d.station || 'Ready';
                document.getElementById('nowStation').textContent = d.playing ? d.station : 'Select a source below';
            });
        }

        updateStationList();
        updateStatus();
        setInterval(updateStatus, 3000);
    </script>
</body>
</html>
)rawliteral";
    server.send(200, "text/html", html);
}

void setupWebServer() {
    server.on("/", handleRoot);
    server.on("/status", []() { server.send(200, "application/json", getStatusJSON()); });
    server.on("/radios", []() { server.send(200, "application/json", getRadioListJSON()); });

    server.on("/volume", []() {
        if (server.hasArg("v")) setVolume(server.arg("v").toInt());
        server.send(200, "text/plain", String(volume));
    });

    server.on("/radio", []() {
        if (server.hasArg("id")) playRadioStation(server.arg("id").toInt());
        server.send(200, "text/plain", "OK");
    });

    server.on("/youtube", []() {
        if (server.hasArg("id")) playYouTube(server.arg("id").c_str());
        server.send(200, "text/plain", "OK");
    });

    server.on("/bluetooth", []() {
        startBluetooth();
        server.send(200, "text/plain", "OK");
    });

    server.on("/stop", []() {
        stopAll();
        server.send(200, "text/plain", "OK");
    });

    server.on("/restart", []() {
        server.send(200, "text/plain", "Restarting...");
        delay(500);
        ESP.restart();
    });

    server.on("/reset-wifi", []() {
        server.send(200, "text/plain", "Resetting WiFi...");
        delay(500);
        WiFi.disconnect(true, true);
        ESP.restart();
    });

    server.begin();
    Serial.println("[Web] Server started");
}

// ============================================
// AUDIO CALLBACKS
// ============================================

void audio_info(const char *info) {
    Serial.printf("[Audio] %s\n", info);
}

void audio_showstation(const char *info) {
    currentStation = String(info);
    Serial.printf("[Station] %s\n", info);
}

void audio_showstreamtitle(const char *info) {
    currentTitle = String(info);
    Serial.printf("[Title] %s\n", info);
}

// ============================================
// SETUP
// ============================================

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n═══════════════════════════════════════════");
    Serial.println("        HIOS WiFi Speaker v3.0");
    Serial.println("═══════════════════════════════════════════");

    // Preferences
    prefs.begin("hios", false);
    volume = prefs.getInt("volume", 80);

    // LCD
    lcdInit();

    // Battery ADC
    if (VBAT_ENABLED) {
        analogReadResolution(12);
        analogSetAttenuation(ADC_11db);
        pinMode(VBAT_PIN, INPUT);
        readBattery();
    }

    // Bluetooth Serial (siempre activo para configuración)
    SerialBT.begin(DEVICE_NAME);
    Serial.println("[BT] Serial started - connect to configure");

    // WiFi - usar credenciales guardadas
    String savedSSID = prefs.getString("wifi_ssid", "");
    String savedPass = prefs.getString("wifi_pass", "");

    if (savedSSID.length() > 0) {
        lcdShowMessage("Connecting", savedSSID.c_str());
        Serial.printf("[WiFi] Connecting to: %s\n", savedSSID.c_str());

        WiFi.mode(WIFI_STA);
        WiFi.begin(savedSSID.c_str(), savedPass.c_str());

        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(500);
            Serial.print(".");
            attempts++;
        }

        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("\n[WiFi] Connected: %s\n", WiFi.localIP().toString().c_str());

            if (MDNS.begin(DEVICE_NAME)) {
                MDNS.addService("http", "tcp", 80);
                Serial.printf("[mDNS] http://%s.local\n", DEVICE_NAME);
            }

            lcdShowMessage("WiFi OK", WiFi.localIP().toString().c_str());
        } else {
            Serial.println("\n[WiFi] Connection failed");
            lcdShowMessage("WiFi Error", "Use BT to config");
        }
    } else {
        Serial.println("[WiFi] No credentials saved");
        Serial.println("[WiFi] Connect via Bluetooth to configure");
        lcdShowMessage("No WiFi", "Config via BT");
    }

    // Web Server
    setupWebServer();

    // Audio
    setupWiFiAudio();

    // OTA
    ArduinoOTA.setHostname(DEVICE_NAME);
    ArduinoOTA.setPassword(OTA_PASSWORD);
    ArduinoOTA.begin();

    delay(1500);
    lcdUpdate();

    Serial.println("═══════════════════════════════════════════");
    Serial.println("[OK] System ready");
    Serial.println("═══════════════════════════════════════════");
}

// ============================================
// LOOP
// ============================================

void loop() {
    server.handleClient();
    ArduinoOTA.handle();
    handleBluetoothSerial();

    // Audio loop (solo en modo WiFi)
    if (currentMode == MODE_WIFI_RADIO || currentMode == MODE_WIFI_STREAM) {
        audio.loop();
    }

    // Battery cada 30s
    if (millis() - lastBatteryRead > 30000) {
        readBattery();
        lastBatteryRead = millis();
    }

    // LCD cada 1s
    if (millis() - lastLCDUpdate > 1000) {
        lcdUpdate();
        lastLCDUpdate = millis();
    }

    delay(1);
}
