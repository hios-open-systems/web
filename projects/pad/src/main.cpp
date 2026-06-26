// ============================================================================
//  Macropad / Control Deck - ESP32-S3
//  Capas + macros + UI funcional. main.cpp crea las colas y tres tareas:
//    - inputTask  (Core 1): samplea -> Dispatcher (capa activa) -> actionQueue
//    - transportTask (Core 1): ejecuta Action/TEXT/MACRO en el transporte HID
//    - uiTask     (Core 0): dashboard (skin activo) con capa, keycaps y estado
//
//  La UI usa componentes reutilizables + un sistema de skins:
//    ui/Layout.h  -> tokens de layout (posiciones/tamanos)
//    ui/IconKit.h -> iconos vectoriales unificados
//    ui/UiKit.h   -> primitivas de widget (card, pill, badge, iconWell, fitText)
//    ui/Skin.h    -> interfaz de skin; ui/Skins.cpp -> Cards / Minimal / Watch
//  renderUI() es agnostico al skin: delega en el skin activo y maneja el
//  dirty-check generico (solo redibuja lo que cambia).
// ============================================================================
#include <Arduino.h>
#include <TFT_eSPI.h>
#include <qrcode.h>
#include <string.h>

#include "app/Config.h"
#include "app/Pins.h"
#include "app/Theme.h"
#include "app/Types.h"
#include "app/EventBus.h"
#include "inputs/InputManager.h"
#include "mapping/KeyMap.h"
#include "mapping/Dispatcher.h"
#include "actions/Action.h"
#include "actions/MacroEngine.h"
#include "storage/DefaultConfig.h"
#include "storage/Nvs.h"
#include "transport/TransportRouter.h"
#include "transport/Transports.h"
#include "app/AppState.h"
#include "app/StateManager.h"
#include "app/Calibration.h"
#include "ui/Menu.h"
#include "ui/StatusPanel.h"
#include "ui/Layout.h"
#include "ui/Skin.h"
#include "net/Net.h"

static TFT_eSPI        tft = TFT_eSPI();
static InputManager    inputs;
static KeyMap          keymap;
static Dispatcher      dispatcher;
static StateManager    stateManager;
static MacroEngine     macroEngine;
static TransportRouter router;

static void uiForceRedraw();   // fwd

// Sink en modo NORMAL: cada evento va al Dispatcher.
class DispatchSink : public InputSink {
public:
  void emit(const InputEvent& e) override {
    appstate::lastInputMs = e.t_ms;
    dispatcher.dispatch(e);
  }
};

// Sink en modo MENU: el encoder navega (girar/entrar/subir) y, en el "picker"
// de un grupo de capas, los 5 botones fisicos eligen capa directamente.
class MenuSink : public InputSink {
public:
  uint32_t lastInput = 0;
  bool     longConsumed = false;
  void emit(const InputEvent& e) override {
    appstate::lastInputMs = e.t_ms;
    lastInput = e.t_ms;
    if (e.id == InputId::ENC_ROT && e.edge == Edge::ROTATE) {
      menu::turn(e.v1 > 0 ? +1 : -1);
    } else if (e.id == InputId::ENC_SW) {
      if (e.edge == Edge::PRESS) longConsumed = false;
      else if (e.edge == Edge::LONG_PRESS) {        // sube un nivel; en nivel 1 cierra
        longConsumed = true; menu::back();
        if (!menu::isOpen()) { appstate::mode = AppMode::NORMAL; uiForceRedraw(); }
      } else if (e.edge == Edge::RELEASE && !longConsumed) {
        applyResult(menu::press());
      }
    } else if (e.edge == Edge::PRESS && menu::inLayerPicker() &&
               (int)e.id <= (int)InputId::BTN_5) {  // BTN_1..BTN_5 -> elegir capa
      applyResult(menu::pickButton((uint8_t)e.id - (uint8_t)InputId::BTN_1));
    }
  }
private:
  void applyResult(MenuResult r) {
    if (r == MenuResult::SWITCH_LAYER) { dispatcher.setLayer(menu::selectedLayer()); menu::close(); appstate::mode = AppMode::NORMAL; uiForceRedraw(); }
    else if (r == MenuResult::CALIBRATE) { menu::close(); appstate::mode = AppMode::CALIBRATING; }
    else if (r == MenuResult::WIFI_SETUP) { menu::close(); net::openWifi(); appstate::mode = AppMode::WIFI; }
  }
};

// Sink en modo WIFI: long-press del encoder = salir; tap = reconfigurar (portal).
class WifiSink : public InputSink {
public:
  bool exit = false;
  bool reconfigure = false;
  void emit(const InputEvent& e) override {
    if (e.id != InputId::ENC_SW) return;
    if      (e.edge == Edge::LONG_PRESS) { exit = true; m_long = true; }
    else if (e.edge == Edge::PRESS)      { m_long = false; }
    else if (e.edge == Edge::RELEASE)    { if (!m_long) reconfigure = true; }
  }
private:
  bool m_long = false;
};

// ----------------------------------------------------------------------------
static void backlightBegin() {
  ledcSetup(cfg::BL_CANAL, cfg::BL_FREQ, cfg::BL_RES);
  ledcAttachPin(pins::TFT_BL, cfg::BL_CANAL);
}
static void applyBacklight(uint8_t pct) {
  if (pct > 100) pct = 100;
  ledcWrite(cfg::BL_CANAL, (uint32_t)pct * 255 / 100);
}

// ============================================================================
//  UI - delega en el skin activo (ver ui/Skins.cpp).
// ============================================================================
static char g_clock[8] = "--:--";   // placeholder hasta NTP/RTC

static void updateClock(uint32_t now) {
  uint16_t minute = appstate::currentClockMinute(now);
  snprintf(g_clock, sizeof(g_clock), "%02u:%02u", minute / 60, minute % 60);
}

static bool s_uiForce = false;
static void uiForceRedraw() { s_uiForce = true; }

static uint8_t activeSkinIndex(const UiSnapshot& s) {
  // Las capas del Monitor (General/Red/Nucleos) fuerzan su vista, sin importar el
  // skin de dashboard elegido en Apariencia. Al salir de la capa, vuelve el skin.
  int mi = skins::monitorIndex(keymap.layer(s.activeLayer).name);
  if (mi >= 0) return (uint8_t)mi;
  uint8_t i = appstate::prefs.skinIndex;
  return i < skins::dashboardCount() ? i : 0;
}

// Dirty-check generico (el skin pone el COMO):
//   primer frame / cambio de capa / cambio de skin -> limpia y full()
//   cambio de minuto -> full() (repinta opaco, sin flash)
//   boton -> keycap() en su lugar; estado -> status(); mouse -> full();
//   stick (en modo mouse) -> stick() si el skin lo soporta.
static void renderUI(const UiSnapshot& s) {
  static bool       first = true;
  static UiSnapshot prev{};
  static int        prevLayer = -1;
  static uint8_t    prevSkin = 255;

  if (s_uiForce) { first = true; s_uiForce = false; }

  const uint8_t skinIdx = activeSkinIndex(s);
  const Skin&   sk = skins::get(skinIdx);
  SkinContext   ctx{ &tft, &keymap, g_clock };

  bool layerChanged = (s.activeLayer != prevLayer);
  bool skinChanged  = (skinIdx != prevSkin);

  uint16_t clockMinute = appstate::currentClockMinute(millis());
  static int prevClockMinute = -1;
  bool clockChanged = ((int)clockMinute != prevClockMinute);
  if (clockChanged) { updateClock(millis()); prevClockMinute = clockMinute; }

  if (first || layerChanged || skinChanged) {
    // Solo limpiar a negro en boot o cambio de skin (layout distinto). En cambio
    // de CAPA el full() repinta opaco region por region -> sin flash negro.
    if (first || skinChanged) tft.fillScreen(theme::BG);
    sk.full(ctx, s);
    prev = s; prevLayer = s.activeLayer; prevSkin = skinIdx; first = false;
    return;
  }

  if (clockChanged) {
    if (sk.clock) sk.clock(ctx);                  // redibuja SOLO el reloj (sin flash)
    else { sk.full(ctx, s); prev = s; return; }   // skins sin clock(): full opaco
  }

  // Botones: redibuja el keycap si cambio su estado o su flash de long-press.
  for (uint8_t i = 0; i < layout::KC_COUNT; i++) {
    bool on = s.buttons & (1 << i), prevOn = prev.buttons & (1 << i);
    bool fl = s.longFlash & (1 << i), prevFl = prev.longFlash & (1 << i);
    if (on != prevOn || fl != prevFl) sk.keycap(ctx, s, i, on);
  }

  // Estado (mic/cam/media/vol/enlace).
  bool statusChanged = s.micMuted != prev.micMuted || s.camOff != prev.camOff ||
                       s.mediaPlay != prev.mediaPlay || s.volume != prev.volume ||
                       s.transports != prev.transports || s.live != prev.live ||
                       s.cpuTemp != prev.cpuTemp || s.gpuTemp != prev.gpuTemp ||
                       s.cpuLoad != prev.cpuLoad || s.gpuLoad != prev.gpuLoad ||
                       s.uptimeSec != prev.uptimeSec ||   // heartbeat 1Hz del companion -> refresca el monitor
                       s.wifiOff != prev.wifiOff ||
                       s.wizOn != prev.wizOn || s.wizBright != prev.wizBright ||
                       strcmp(s.wizRoom, prev.wizRoom) != 0 || strcmp(s.wizTarget, prev.wizTarget) != 0;
  if (statusChanged) sk.status(ctx, s);

  // Modo mouse cambio -> full (poco frecuente). Solo movimiento del stick y el
  // skin con cursor en vivo -> redibujo solo el cursor.
  // Encoder: girar (encPos) o presionar/soltar el SW (bit 5).
  const bool encActivity = (s.encPos != prev.encPos) || (((s.buttons ^ prev.buttons) >> 5) & 1);
  // Cambios que SI tocan toda la franja (mouse on/off, modo del encoder, enlace companion).
  const bool fullStrip   = s.mouseOn != prev.mouseOn || s.encMode != prev.encMode || s.live != prev.live;
  if (fullStrip) {
    if (sk.encoder) sk.encoder(ctx, s);
    else sk.full(ctx, s);
  } else if (encActivity) {
    if (sk.encDial) sk.encDial(ctx, s);   // SOLO el dial -> no flashea los boxes de companion/mouse
    else if (sk.encoder) sk.encoder(ctx, s);
  } else if (s.mouseOn && sk.stick) {
    bool stickMoved = (abs((int)s.stickX - (int)prev.stickX) > cfg::STICK_DISPLAY_DELTA) ||
                      (abs((int)s.stickY - (int)prev.stickY) > cfg::STICK_DISPLAY_DELTA);
    if (stickMoved || s.clickFlash != prev.clickFlash) sk.stick(ctx, s);
  }

  prev = s;
}

// Lee la bateria (2S por divisor -> ADC) y devuelve 0..100, o 255 si esta
// desactivada (BATTERY_ENABLED=false). Muestrea cada BAT_SAMPLE_MS y cachea.
static uint8_t readBatteryPct(uint32_t now) {
  if (!cfg::BATTERY_ENABLED) return 255;
  static uint32_t lastMs = 0;
  static uint8_t  cached = 255;
  if (lastMs != 0 && (now - lastMs) < cfg::BAT_SAMPLE_MS) return cached;
  lastMs = now;
  uint32_t mv = 0;
  for (int i = 0; i < 8; i++) mv += analogReadMilliVolts(cfg::BAT_ADC_PIN);
  mv /= 8;
  uint32_t vbat = mv * (cfg::BAT_R1_K + cfg::BAT_R2_K) / cfg::BAT_R2_K;   // deshace el divisor
  long pct = (long)(vbat - cfg::BAT_EMPTY_MV) * 100 / (cfg::BAT_FULL_MV - cfg::BAT_EMPTY_MV);
  cached = (uint8_t)(pct < 0 ? 0 : pct > 100 ? 100 : pct);
  return cached;
}

// ============================================================================
//  Tareas
// ============================================================================
static void inputTask(void*) {
  DispatchSink dsink;
  MenuSink     msink;
  Serial.printf("[inputTask] core %d\n", xPortGetCoreID());
  static uint32_t comboStart = 0;
  static bool     menuEntered = false;
  for (;;) {
    uint32_t now = millis();

    // En calibracion el inputTask se pausa (la rutina en uiTask lee el stick).
    if (appstate::mode == AppMode::CALIBRATING) { comboStart = 0; vTaskDelay(pdMS_TO_TICKS(20)); continue; }

    // En el menu, el encoder lo maneja (girar/elegir/cerrar) via msink.
    if (appstate::mode == AppMode::MENU) {
      if (!menuEntered) { msink.lastInput = now; menuEntered = true; }
      inputs.update(now, msink);
      if (now - msink.lastInput > cfg::MENU_TIMEOUT_MS) { menu::close(); appstate::mode = AppMode::NORMAL; uiForceRedraw(); }
      if (appstate::mode != AppMode::MENU) { menuEntered = false; nvs::saveUiPrefs(appstate::prefs); }
      vTaskDelay(pdMS_TO_TICKS(5));
      continue;
    }
    menuEntered = false;

    // En modo WiFi: long-press del encoder = salir; tap = reconfigurar (levantar portal).
    if (appstate::mode == AppMode::WIFI) {
      WifiSink wsink;
      inputs.update(now, wsink);
      if (wsink.exit) { net::stopPortal(); appstate::mode = AppMode::NORMAL; uiForceRedraw(); }
      else if (wsink.reconfigure && !net::portalActive()) { net::requestPortal(); uiForceRedraw(); }
      vTaskDelay(pdMS_TO_TICKS(10));
      continue;
    }

    // NORMAL
    inputs.update(now, dsink);
    dispatcher.tick(now);   // cierra el tap simple del stick pasada la ventana

    // Combo de calibracion: ENC_SW (5) + STICK_SW (6) mantenidos juntos.
    if (inputs.buttons().pressed(5) && inputs.buttons().pressed(6)) {
      if (comboStart == 0) comboStart = now;
      else if (now - comboStart >= cfg::CAL_COMBO_MS) appstate::mode = AppMode::CALIBRATING;
    } else comboStart = 0;

    const OptState& st = stateManager.get();
    UiSnapshot s{};
    for (uint8_t i = 0; i < 7; i++)
      if (inputs.buttons().pressed(i)) s.buttons |= (1 << i);
    s.encPos      = inputs.encoder().count() / 4;
    s.stickX      = inputs.stick().x();
    s.stickY      = inputs.stick().y();
    s.activeLayer = dispatcher.activeLayer();
    s.mouseOn     = dispatcher.mouseOn();
    s.clickFlash  = dispatcher.clickFlash(now);       // flash L/R en el box del mouse
    s.encMode     = dispatcher.encMode();
    s.longFlash   = dispatcher.longFlashMask(now);   // flash de confirmacion de long-press
    // Feedback REAL-first: si el companion mando estado fresco, pisa al optimista;
    // si no, fallback al optimista (= comportamiento de siempre, sin companion).
    const bool live = net::hasFreshState(now);
    if (live) {
      const RealState& r = net::realState();
      stateManager.syncFrom(r);                // re-ancla el optimista al ultimo real
      s.micMuted = r.micMuted;   s.camOff  = r.camOff;
      s.mediaPlay = r.mediaPlay; s.volume  = r.volume;
      s.cpuTemp = r.cpuTemp;     s.gpuTemp = r.gpuTemp;
      s.cpuLoad = r.cpuLoad;     s.gpuLoad = r.gpuLoad;
      s.cpuFan = r.cpuFan;       s.gpuFan = r.gpuFan;       s.ram = r.ram;
      s.netDown = r.netDown;     s.netUp = r.netUp;
      strlcpy(s.ip, r.ip, sizeof(s.ip));
      s.coreCount = r.coreCount > 24 ? 24 : r.coreCount;
      memcpy(s.cores, r.cores, sizeof(s.cores));
      s.vramUsed = r.vramUsed;   s.vramTotal = r.vramTotal;
      s.uptimeSec = r.uptimeSec; s.procs = r.procs;
      s.diskPct = r.diskPct;     s.diskRd = r.diskRd;       s.diskWr = r.diskWr;
      strlcpy(s.wizRoom, r.wizRoom, sizeof(s.wizRoom));
      strlcpy(s.wizTarget, r.wizTarget, sizeof(s.wizTarget));
      s.wizOn = r.wizOn;         s.wizBright = r.wizBright;
    } else {
      s.micMuted = st.micMuted;   s.camOff  = st.camOff;
      s.mediaPlay = st.mediaPlay; s.volume  = st.volume;
      s.cpuTemp = s.gpuTemp = -1000;           // sin dato
      s.cpuLoad = s.gpuLoad = 255;
      s.cpuFan = -1; s.gpuFan = s.ram = 255;
      s.netDown = s.netUp = 0xFFFFFFFF; s.ip[0] = 0; s.coreCount = 0;
      s.vramUsed = 0xFFFF; s.vramTotal = 0; s.uptimeSec = 0xFFFFFFFF; s.procs = 0xFFFF;
      s.diskPct = 255; s.diskRd = s.diskWr = 0xFFFFFFFF;
      s.wizRoom[0] = 0; s.wizTarget[0] = 0; s.wizOn = false; s.wizBright = 0;
    }
    s.live        = live;
    uint8_t tp = 0;                                  // transporte HID activo + WiFi
    if (router.activeConnected()) {
      ITransport* ah = router.activeHid();
      tp |= (ah && ah->id() == TransportId::BLE) ? tport::BLE : tport::USB;
    }
    if (net::isConnected()) tp |= tport::WIFI;
    s.transports  = tp;
    s.wifiOff     = !net::isWifiEnabled();          // aviso si el usuario apago el WiFi

    s.battery     = readBatteryPct(now);            // 255 = sin medicion (BATTERY_ENABLED=false)
    xQueueOverwrite(bus::uiMailbox, &s);

    vTaskDelay(pdMS_TO_TICKS(2));
  }
}

static void transportTask(void*) {
  Serial.printf("[transportTask] core %d\n", xPortGetCoreID());
  ITransport* usbHid = usbHidInstance();
  ITransport* bleHid = bleHidInstance();
  router.registerHid(usbHid);
  router.registerHid(bleHid);
  usbHid->begin();
  bleHid->begin();                // arranca advertising BLE ("HIOS PAD")
  router.setActiveHid(TransportId::USB);
  Serial.println(F("[transport] USB HID + BLE ('HIOS PAD') activos"));

  Action a;
  for (;;) {
    // Auto-switch: si un host enumero el USB -> USB; si no (desenchufado o solo
    // alimentacion) -> BLE. Asi "ir wireless" = desenchufar del PC y emparejar.
    router.setActiveHid(usbHid->isConnected() ? TransportId::USB : TransportId::BLE);

    if (xQueueReceive(bus::actionQueue, &a, pdMS_TO_TICKS(20)) == pdTRUE) {
      ITransport* hid = router.activeHid();
      if (a.type == ActionType::TEXT) {
        if (hid) hid->sendText(textById(a.p.text.id));
      } else if (a.type == ActionType::MACRO) {
        if (hid) macroEngine.run(a.p.macro.id, *hid);
      } else {
        router.execute(a);
      }
    }
    router.tick();
  }
}

// Pantalla del portal de configuracion WiFi (la dibuja el uiTask, dueno del TFT).
// QR (derecha) que UNE el celu al AP de setup (formato WIFI:), texto a la izq.
static void drawWifiSetup() {
  tft.fillScreen(theme::BG);

  // QR: "WIFI:T:nopass;S:<ssid>;;" -> el celu se une solo a la red de setup.
  char payload[64];
  snprintf(payload, sizeof(payload), "WIFI:T:nopass;S:%s;;", net::apName());
  QRCode qr;
  uint8_t qrData[qrcode_getBufferSize(3)];
  qrcode_initText(&qr, qrData, 3, ECC_LOW, payload);
  const int scale = 5, quiet = 3;                     // quiet zone obligatoria
  const int dim = (qr.size + 2 * quiet) * scale;
  const int ox = 466 - dim, oy = (320 - dim) / 2;     // pegado a la derecha
  tft.fillRoundRect(ox, oy, dim, dim, 8, TFT_WHITE);  // QR necesita fondo claro
  for (uint8_t yy = 0; yy < qr.size; yy++)
    for (uint8_t xx = 0; xx < qr.size; xx++)
      if (qrcode_getModule(&qr, xx, yy))
        tft.fillRect(ox + (quiet + xx) * scale, oy + (quiet + yy) * scale, scale, scale, TFT_BLACK);

  // Instrucciones (izquierda).
  tft.setTextDatum(TL_DATUM);
  tft.setTextColor(theme::CYAN, theme::BG);
  tft.drawString("WiFi setup", 22, 34, 4);
  tft.setTextColor(theme::FG, theme::BG);
  tft.drawString("Escanea el QR para", 22, 90, 2);
  tft.drawString("unirte a la red:", 22, 112, 2);
  tft.setTextColor(theme::GREEN, theme::BG);
  tft.drawString(net::apName(), 22, 136, 4);
  tft.setTextColor(theme::SOFT, theme::BG);
  tft.drawString("Luego abri en el navegador:", 22, 182, 2);
  tft.setTextColor(theme::FG, theme::BG);
  char url[40]; snprintf(url, sizeof(url), "http://%s", net::ip());
  tft.drawString(url, 22, 204, 4);
  tft.setTextColor(theme::DIM, theme::BG);
  tft.drawString("Manten el encoder para salir", 22, 252, 1);
}

// Pantalla de ESTADO de WiFi (cuando ya hay creds): red, IP, mDNS. NO re-registra.
// Tap del encoder = reconfigurar (portal); long-press = salir.
static void drawWifiStatus() {
  tft.fillScreen(theme::BG);
  tft.setTextDatum(TL_DATUM);
  tft.setTextColor(theme::CYAN, theme::BG);
  tft.drawString("WiFi", 22, 34, 4);

  const bool conn = net::isConnected();
  tft.setTextColor(conn ? theme::GREEN : theme::SOFT, theme::BG);
  tft.drawString(conn ? "Conectado" : "Conectando...", 22, 88, 4);

  tft.setTextColor(theme::SOFT, theme::BG);
  tft.drawString("Red", 22, 142, 2);
  tft.setTextColor(theme::FG, theme::BG);
  tft.drawString(net::ssid(), 22, 160, 4);

  if (conn) {
    tft.setTextColor(theme::SOFT, theme::BG);
    tft.drawString("IP", 22, 206, 2);
    tft.setTextColor(theme::FG, theme::BG);
    char ipl[48]; snprintf(ipl, sizeof(ipl), "%s   http://%s.local", net::ip(), cfg::MDNS_HOST);
    tft.drawString(ipl, 22, 224, 2);
  }

  tft.setTextColor(theme::DIM, theme::BG);
  tft.drawString("Tap encoder = reconfigurar    Manten = salir", 22, 282, 1);
}

static void uiTask(void*) {
  Serial.printf("[uiTask] core %d\n", xPortGetCoreID());
  UiSnapshot snap{};
  snap.stickX = snap.stickY = 2048;
  int  wifiView = 0;        // 0=ninguna, 1=portal(setup), 2=estado
  bool wifiConn = false;    // ultimo isConnected dibujado (refresca al conectar)
  for (;;) {
    // Modo WiFi: el portal (setup con QR) o la pantalla de estado son duenos del TFT.
    if (appstate::mode == AppMode::WIFI) {
      if (net::portalActive()) {
        if (wifiView != 1) { drawWifiSetup(); wifiView = 1; }
      } else {
        bool conn = net::isConnected();
        if (wifiView != 2 || conn != wifiConn) { drawWifiStatus(); wifiView = 2; wifiConn = conn; }
      }
      vTaskDelay(pdMS_TO_TICKS(150));
      continue;
    }
    if (wifiView != 0) { wifiView = 0; uiForceRedraw(); }

    if (appstate::mode == AppMode::CALIBRATING) {
      runStickCalibration(tft);   // modal; vuelve a NORMAL al terminar
      uiForceRedraw();
      continue;
    }
    if (appstate::mode == AppMode::MENU) {
      applyBacklight(appstate::brightness);   // brillo en vivo al editar
      menu::render(tft);                       // dirty-check interno
      vTaskDelay(pdMS_TO_TICKS(16));
      continue;
    }
    xQueuePeek(bus::uiMailbox, &snap, pdMS_TO_TICKS(50));
    uint32_t now = millis();
    uint16_t dimSecs = appstate::dimTimeoutSeconds();
    uint8_t targetBrightness = appstate::brightness;
    if (dimSecs > 0 && now - appstate::lastInputMs > (uint32_t)dimSecs * 1000UL) {
      targetBrightness = 0;
    }
    applyBacklight(targetBrightness);
    renderUI(snap);
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// WiFi + portal + NTP (M1). Vive en su propia tarea para no bloquear input/UI.
static void netTask(void*) {
  Serial.printf("[netTask] core %d\n", xPortGetCoreID());
  net::begin();
  for (;;) {
    net::tick();
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println(F("=== control-deck (ESP32-S3) - capas + macros + UI ==="));
  Serial.printf("[hw] PSRAM=%u  heap=%u  flash=%u\n",
                (unsigned)ESP.getPsramSize(), (unsigned)ESP.getFreeHeap(), (unsigned)ESP.getFlashChipSize());

  loadDefaults(keymap);
  dispatcher.begin(&keymap);
  dispatcher.setState(&stateManager);
  menu::init(&keymap);

  nvs::begin();
  // Calibracion del stick desde NVS (si existe). Si no, fallback al centro de boot.
  if (nvs::loadStickCal(appstate::stickCal))
    Serial.println(F("[cal] calibracion del stick cargada de NVS"));
  else
    Serial.println(F("[cal] sin calibracion (usando centro de boot). Manten ENC+Stick 1.5s para calibrar."));
  if (!nvs::loadUiPrefs(appstate::prefs)) {
    appstate::resetPrefs();
    appstate::prefs.brightness = nvs::loadBrightness(100);
  }
  appstate::prefs.magic = UI_PREFS_MAGIC;
  if (appstate::prefs.themeMode > theme::MODE_LIGHT) appstate::prefs.themeMode = theme::MODE_DARK;
  if (appstate::prefs.accentIndex > 6) appstate::prefs.accentIndex = 0;
  if (appstate::prefs.dimTimeout > 4) appstate::prefs.dimTimeout = 2;
  if (appstate::prefs.skinIndex >= skins::dashboardCount()) appstate::prefs.skinIndex = 0;
  if (appstate::prefs.brightness < 10 || appstate::prefs.brightness > 100) appstate::prefs.brightness = 100;
  if (appstate::prefs.clockMinute >= 24 * 60) appstate::prefs.clockMinute = 12 * 60;
  appstate::brightness = appstate::prefs.brightness;
  appstate::prefs.clockSetAtMs = millis();
  appstate::lastInputMs = millis();
  theme::applyMode(appstate::prefs.themeMode);
  updateClock(millis());

  inputs.begin();
  backlightBegin();
  applyBacklight(appstate::brightness);
  tft.init();
  tft.setRotation(3);   // landscape 180 (modulo montado al reves)
  statuspanel::begin(tft);   // crea el sprite del panel de estado (lo usa el skin Cards)

  bus::begin();

  xTaskCreatePinnedToCore(inputTask,     "input",     4096, nullptr, 5, nullptr, 1);
  xTaskCreatePinnedToCore(transportTask, "transport", 4096, nullptr, 4, nullptr, 1);
  xTaskCreatePinnedToCore(uiTask,        "ui",        8192, nullptr, 2, nullptr, 0);
  xTaskCreatePinnedToCore(netTask,       "net",      16384, nullptr, 1, nullptr, 0);

  Serial.printf("Capas: %u. Encoder press = menu (capas/settings/calibrar).\n", keymap.count());
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}
