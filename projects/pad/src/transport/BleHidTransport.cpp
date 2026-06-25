#include "BleHidTransport.h"
#include <Arduino.h>
#include <NimBLEDevice.h>
#include <NimBLEHIDDevice.h>
#include "../app/AppState.h"

// ============================================================================
//  Descriptor HID compuesto: teclado (ID 1) + mouse (ID 2) + consumer (ID 3).
// ============================================================================
static const uint8_t REPORT_MAP[] = {
  // --- Teclado (Report ID 1): 1 mod + 1 reserved + 6 keys ---
  0x05, 0x01, 0x09, 0x06, 0xA1, 0x01,
  0x85, 0x01,
  0x05, 0x07, 0x19, 0xE0, 0x29, 0xE7, 0x15, 0x00, 0x25, 0x01,
  0x75, 0x01, 0x95, 0x08, 0x81, 0x02,            // 8 bits de modificadores
  0x95, 0x01, 0x75, 0x08, 0x81, 0x03,            // reserved
  0x95, 0x06, 0x75, 0x08, 0x15, 0x00, 0x25, 0x65,
  0x05, 0x07, 0x19, 0x00, 0x29, 0x65, 0x81, 0x00, // 6 teclas
  0xC0,
  // --- Mouse (Report ID 2): 3 botones + 5 pad + X,Y,Wheel (rel) ---
  0x05, 0x01, 0x09, 0x02, 0xA1, 0x01,
  0x85, 0x02,
  0x09, 0x01, 0xA1, 0x00,
  0x05, 0x09, 0x19, 0x01, 0x29, 0x03, 0x15, 0x00, 0x25, 0x01,
  0x95, 0x03, 0x75, 0x01, 0x81, 0x02,            // 3 botones
  0x95, 0x01, 0x75, 0x05, 0x81, 0x03,            // padding
  0x05, 0x01, 0x09, 0x30, 0x09, 0x31, 0x09, 0x38,
  0x15, 0x81, 0x25, 0x7F, 0x75, 0x08, 0x95, 0x03, 0x81, 0x06, // X,Y,Wheel
  0xC0, 0xC0,
  // --- Consumer (Report ID 3): un usage de 16 bits ---
  0x05, 0x0C, 0x09, 0x01, 0xA1, 0x01,
  0x85, 0x03,
  0x15, 0x00, 0x26, 0xFF, 0x03, 0x19, 0x00, 0x2A, 0xFF, 0x03,
  0x75, 0x10, 0x95, 0x01, 0x81, 0x00,
  0xC0,
};

// ----------------------------------------------------------------------------
// Traduccion de un keycode (ASCII o KEY_* estilo Arduino) a un usage HID.
// Para k>=0x88 (bloque KEY_*: F-keys, flechas, etc.): usage = k - 0x88.
// Para ASCII: tabla; setea shift si hace falta. Devuelve 0 si no se mapea.
static uint8_t keyToUsage(uint8_t k, bool& shift) {
  shift = false;
  if (k >= 0x88) return (uint8_t)(k - 0x88);
  if (k >= 'a' && k <= 'z') return (uint8_t)(0x04 + (k - 'a'));
  if (k >= 'A' && k <= 'Z') { shift = true; return (uint8_t)(0x04 + (k - 'A')); }
  if (k >= '1' && k <= '9') return (uint8_t)(0x1E + (k - '1'));
  switch (k) {
    case '0': return 0x27;
    case ' ': return 0x2C;  case '\n': return 0x28;  case '\t': return 0x2B;
    case '-': return 0x2D;  case '=': return 0x2E;   case '[': return 0x2F;
    case ']': return 0x30;  case '\\': return 0x31;  case ';': return 0x33;
    case '\'': return 0x34; case '`': return 0x35;   case ',': return 0x36;
    case '.': return 0x37;  case '/': return 0x38;
    // simbolos con shift
    case '!': shift = true; return 0x1E;  case '@': shift = true; return 0x1F;
    case '#': shift = true; return 0x20;  case '$': shift = true; return 0x21;
    case '%': shift = true; return 0x22;  case '^': shift = true; return 0x23;
    case '&': shift = true; return 0x24;  case '*': shift = true; return 0x25;
    case '(': shift = true; return 0x26;  case ')': shift = true; return 0x27;
    case '_': shift = true; return 0x2D;  case '+': shift = true; return 0x2E;
    case '{': shift = true; return 0x2F;  case '}': shift = true; return 0x30;
    case '|': shift = true; return 0x31;  case ':': shift = true; return 0x33;
    case '"': shift = true; return 0x34;  case '~': shift = true; return 0x35;
    case '<': shift = true; return 0x36;  case '>': shift = true; return 0x37;
    case '?': shift = true; return 0x38;
    default: return 0;
  }
}

static uint8_t hidMods(uint8_t m) {
  uint8_t r = 0;
  if (m & kmod::CTRL)  r |= 0x01;
  if (m & kmod::SHIFT) r |= 0x02;
  if (m & kmod::ALT)   r |= 0x04;
  if (m & kmod::GUI)   r |= 0x08;
  return r;
}

static uint16_t consumerUsage(MediaUsage u) {
  switch (u) {
    case MediaUsage::VOL_UP:     return 0x00E9;
    case MediaUsage::VOL_DOWN:   return 0x00EA;
    case MediaUsage::MUTE:       return 0x00E2;
    case MediaUsage::PLAY_PAUSE: return 0x00CD;
    case MediaUsage::NEXT:       return 0x00B5;
    case MediaUsage::PREV:       return 0x00B6;
    case MediaUsage::STOP:       return 0x00B7;
    default:                     return 0;
  }
}

// ----------------------------------------------------------------------------
#if CONFIG_BT_NIMBLE_EXT_ADV
// Advertising conmutable EN RUNTIME (sin reflashear): 0=legacy, 1=extended, 2=dual.
// Se elige por serial en tick() (l/e/d). Default DUAL: instancia legacy para que
// Windows lo descubra (su stack NO escanea advertising extendido) + instancia
// extendida para el MT7921 de Linux. Asi empareja en ambos sin tocar nada.
static NimBLEHIDDevice* s_hidDev  = nullptr;
static uint8_t          s_advMode = 2;

static void fillAdv(NimBLEExtAdvertisement& a, bool legacy) {
  a.setLegacyAdvertising(legacy);
  a.setConnectable(true);
  a.setScannable(legacy);               // legacy conectable exige scannable; ext conectable lo prohibe
  a.setFlags(0x06);                     // LE General Discoverable + BR/EDR no soportado
  a.setName("HIOS PAD");
  a.setAppearance(0x03C0);
  a.setCompleteServices(s_hidDev->hidService()->getUUID());
}

static void startAdvMode(uint8_t mode) {
  NimBLEExtAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->stop();
  NimBLEExtAdvertisement a0;
  fillAdv(a0, mode != 1);               // legacy en modo 0/2, extended en modo 1
  adv->setInstanceData(0, a0);
  adv->start(0);
  if (mode == 2) {                      // dual: instancia 1 extendida (para que el MT7921 lo descubra)
    NimBLEExtAdvertisement a1;
    fillAdv(a1, false);
    adv->setInstanceData(1, a1);
    adv->start(1);
  }
  s_advMode = mode;
  Serial.printf("[ble] adv mode=%u (%s)\n", mode, mode == 0 ? "LEGACY" : mode == 1 ? "EXTENDED" : "DUAL");
}
#endif

// ----------------------------------------------------------------------------
// Callbacks de conexion: actualizan el flag y re-arrancan advertising al cortar.
class SrvCb : public NimBLEServerCallbacks {
public:
  volatile bool* flag = nullptr;
  void onConnect(NimBLEServer* s, ble_gap_conn_desc* desc) override {
    if (flag) *flag = true;
    Serial.println("[ble] central CONECTADO");
    // Pedir intervalo de conexion corto (7.5-15ms) -> mouse/HID con baja latencia.
    // Sin esto Linux negocia un intervalo lento (~30-50ms) -> puntero con lag.
    s->updateConnParams(desc->conn_handle, 6, 12, 0, 200);
  }
  void onDisconnect(NimBLEServer*) override {
    if (flag) *flag = false;
    Serial.println("[ble] central DESCONECTADO");
#if CONFIG_BT_NIMBLE_EXT_ADV
    startAdvMode(s_advMode);            // re-arranca el modo actual (legacy/ext/dual)
#else
    NimBLEDevice::startAdvertising();
#endif
  }
  void onAuthenticationComplete(ble_gap_conn_desc* desc) override {
    Serial.printf("[ble] auth: enc=%d auth=%d bond=%d keysz=%d\n",
                  desc->sec_state.encrypted, desc->sec_state.authenticated,
                  desc->sec_state.bonded, desc->sec_state.key_size);
  }
};
static SrvCb s_srvCb;

// ----------------------------------------------------------------------------
bool BleHidTransport::begin() {
  NimBLEDevice::init("HIOS PAD");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);             // TX al maximo: discovery/alcance robustos. Las tramas de adv son chicas -> costo de bateria despreciable.
  NimBLEDevice::setSecurityAuth(true, false, true);   // bonding + secure connections (just works)

  NimBLEServer* server = NimBLEDevice::createServer();
  s_srvCb.flag = &m_connected;
  server->setCallbacks(&s_srvCb);

  m_hid = new NimBLEHIDDevice(server);
  m_inKb    = m_hid->inputReport(1);
  m_inMouse = m_hid->inputReport(2);
  m_inCons  = m_hid->inputReport(3);
  m_hid->manufacturer()->setValue("HIOS");
  m_hid->pnp(0x02, 0xE502, 0xA111, 0x0210);
  m_hid->hidInfo(0x00, 0x01);
  m_hid->reportMap((uint8_t*)REPORT_MAP, sizeof(REPORT_MAP));
  m_hid->startServices();
  m_hid->setBatteryLevel(100);

#if CONFIG_BT_NIMBLE_EXT_ADV
  s_hidDev = m_hid;
  // BUG de NimBLE-Arduino: el ctor de NimBLEExtAdvertising no inicializa m_pCallbacks.
  // Al entrar una conexion, el advertising termina -> evento ADV_COMPLETE -> deref de
  // puntero basura -> panic LoadProhibited (el pad reboota en cada conexion). setCallbacks(nullptr)
  // lo apunta a defaultCallbacks (onStopped no-op) y mata el crash.
  NimBLEDevice::getAdvertising()->setCallbacks(nullptr);
  startAdvMode(s_advMode);                             // arranca en legacy; conmutable por serial
#else
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->setAppearance(0x03C0);                          // HID generico
  adv->addServiceUUID(m_hid->hidService()->getUUID());
  adv->start();
#endif
  Serial.printf("[ble] adv 'HIOS PAD'  addr=%s  (serial: l=legacy e=ext d=dual s=status)\n",
                NimBLEDevice::getAddress().toString().c_str());
  return true;
}

void BleHidTransport::tick() {
#if CONFIG_BT_NIMBLE_EXT_ADV
  while (Serial.available()) {
    char c = (char)Serial.read();
    if      (c == 'l') startAdvMode(0);
    else if (c == 'e') startAdvMode(1);
    else if (c == 'd') startAdvMode(2);
    else if (c == 's') Serial.printf("[ble] mode=%u conn=%d  stick accel=%d\n", s_advMode, (int)m_connected, appstate::mouseAccel);
    else if (c == '+') { appstate::mouseAccel++; Serial.printf("[stick] accel=%d\n", appstate::mouseAccel); }
    else if (c == '-') { if (appstate::mouseAccel > 0) appstate::mouseAccel--; Serial.printf("[stick] accel=%d\n", appstate::mouseAccel); }
  }
#endif
}

void BleHidTransport::kbReport(const uint8_t* r)    { m_inKb->setValue(r, 8);    m_inKb->notify(); }
void BleHidTransport::mouseReport(const uint8_t* r) { m_inMouse->setValue(r, 4); m_inMouse->notify(); }
void BleHidTransport::consReport(const uint8_t* r)  { m_inCons->setValue(r, 2);  m_inCons->notify(); }

void BleHidTransport::sendKey(const KeyAction& k) {
  if (!m_connected) return;
  uint8_t rep[8] = {0};
  rep[0] = hidMods(k.modifiers);
  uint8_t n = 2;
  for (uint8_t i = 0; i < 6 && k.keys[i] && n < 8; i++) {
    bool sh; uint8_t u = keyToUsage(k.keys[i], sh);
    if (sh) rep[0] |= 0x02;     // left shift
    if (u)  rep[n++] = u;
  }
  kbReport(rep);
  delay(10);
  uint8_t zero[8] = {0};
  kbReport(zero);
}

void BleHidTransport::sendText(const char* s) {
  if (!m_connected || !s) return;
  for (; *s; ++s) {
    bool sh; uint8_t u = keyToUsage((uint8_t)*s, sh);
    if (!u) continue;
    uint8_t rep[8] = {0};
    if (sh) rep[0] = 0x02;
    rep[2] = u;
    kbReport(rep); delay(6);
    uint8_t zero[8] = {0};
    kbReport(zero); delay(6);
  }
}

void BleHidTransport::sendMouse(const MouseAction& m) {
  if (!m_connected) return;
  switch (m.mode) {
    case MouseMode::MOVE_FROM_STICK: {
      if (!m.dx && !m.dy) return;
      uint8_t rep[4] = { 0, (uint8_t)(int8_t)m.dx, (uint8_t)(int8_t)m.dy, 0 };
      mouseReport(rep);
      break;
    }
    case MouseMode::SCROLL_FROM_ENC: {
      if (!m.wheel) return;
      uint8_t rep[4] = { 0, 0, 0, (uint8_t)(int8_t)m.wheel };
      mouseReport(rep);
      break;
    }
    case MouseMode::CLICK: {
      uint8_t btn = m.buttons ? m.buttons : 0x01;   // 0x01=izq, 0x02=der, 0x04=medio
      Serial.printf("[mouse] click btn=%u\n", btn);
      uint8_t down[4] = { btn, 0, 0, 0 };
      uint8_t up[4] = { 0, 0, 0, 0 };
      // Robusto sobre BLE: hold largo (cruza varios eventos de conexion sea cual sea el
      // intervalo negociado) + reenvio del down por si una notif se pierde. Asi el host
      // ve un press claro y sostenido, no una pulsacion de ~0ms que descarta.
      mouseReport(down); delay(55);
      mouseReport(down); delay(55);
      mouseReport(up);
      break;
    }
  }
}

void BleHidTransport::sendMedia(const MediaAction& m) {
  if (!m_connected) return;
  uint16_t u = consumerUsage(m.usage);
  if (!u) return;
  uint8_t rep[2] = { (uint8_t)(u & 0xFF), (uint8_t)(u >> 8) };
  consReport(rep); delay(10);
  uint8_t zero[2] = {0, 0};
  consReport(zero);
}

// Fabrica (ver Transports.h): aisla el transporte BLE del USB.
#include "Transports.h"
ITransport* bleHidInstance() { static BleHidTransport t; return &t; }
