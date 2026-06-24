#include "UsbHidTransport.h"
#include <Arduino.h>
#if __has_include("tusb.h")
#include "tusb.h"
#define HAS_TUSB 1
#endif

bool UsbHidTransport::begin() {
  m_kb.begin();
  m_mouse.begin();
  m_consumer.begin();
  USB.begin();
  return true;
}

bool UsbHidTransport::isConnected() {
  // Estado REAL: TinyUSB reporta montado cuando un host enumero el dispositivo.
  // Si por alguna razon el header no esta disponible, se asume conectado.
#ifdef HAS_TUSB
  return tud_mounted();
#else
  return true;
#endif
}

void UsbHidTransport::sendKey(const KeyAction& k) {
  if (k.modifiers & kmod::CTRL)  m_kb.press(KEY_LEFT_CTRL);
  if (k.modifiers & kmod::SHIFT) m_kb.press(KEY_LEFT_SHIFT);
  if (k.modifiers & kmod::ALT)   m_kb.press(KEY_LEFT_ALT);
  if (k.modifiers & kmod::GUI)   m_kb.press(KEY_LEFT_GUI);
  for (uint8_t i = 0; i < 6 && k.keys[i]; i++) m_kb.press(k.keys[i]);
  delay(10);            // ventana minima para que el host registre el tap
  m_kb.releaseAll();
}

// Mapea nuestro MediaUsage al usage de consumer control de TinyUSB.
static uint16_t toConsumerUsage(MediaUsage u) {
  switch (u) {
    case MediaUsage::VOL_UP:     return CONSUMER_CONTROL_VOLUME_INCREMENT;
    case MediaUsage::VOL_DOWN:   return CONSUMER_CONTROL_VOLUME_DECREMENT;
    case MediaUsage::MUTE:       return CONSUMER_CONTROL_MUTE;
    case MediaUsage::PLAY_PAUSE: return CONSUMER_CONTROL_PLAY_PAUSE;
    case MediaUsage::NEXT:       return CONSUMER_CONTROL_SCAN_NEXT;
    case MediaUsage::PREV:       return CONSUMER_CONTROL_SCAN_PREVIOUS;
    case MediaUsage::STOP:       return CONSUMER_CONTROL_STOP;
    default:                     return 0;
  }
}

void UsbHidTransport::sendMedia(const MediaAction& m) {
  uint16_t usage = toConsumerUsage(m.usage);
  if (!usage) return;
  m_consumer.press(usage);
  delay(10);
  m_consumer.release();
}

void UsbHidTransport::sendText(const char* s) {
  if (s && *s) m_kb.print(s);   // teclea el string como un teclado
}

void UsbHidTransport::sendMouse(const MouseAction& m) {
  switch (m.mode) {
    case MouseMode::CLICK:
      m_mouse.click(m.buttons ? m.buttons : MOUSE_LEFT);
      break;
    case MouseMode::MOVE_FROM_STICK:
      if (m.dx || m.dy) m_mouse.move(m.dx, m.dy, 0);
      break;
    case MouseMode::SCROLL_FROM_ENC:
      if (m.wheel) m_mouse.move(0, 0, m.wheel);
      break;
  }
}
