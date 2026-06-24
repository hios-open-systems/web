// ============================================================================
//  UsbHidTransport - HID por el USB nativo (GPIO19/20) usando las clases
//  TinyUSB del core (USBHIDKeyboard / USBHIDMouse / USBHIDConsumerControl).
//  Requiere -D ARDUINO_USB_MODE=1 en platformio.ini.
// ============================================================================
#pragma once
#include "ITransport.h"
#include <USB.h>
#include <USBHIDKeyboard.h>
#include <USBHIDMouse.h>
#include <USBHIDConsumerControl.h>

class UsbHidTransport : public ITransport {
public:
  bool begin() override;
  void tick() override {}
  bool isConnected() override;

  void sendKey(const KeyAction& k) override;
  void sendMedia(const MediaAction& m) override;
  void sendMouse(const MouseAction& m) override;
  void sendText(const char* s) override;

  TransportId id() override { return TransportId::USB; }
  const char* name() override { return "USB"; }

private:
  USBHIDKeyboard        m_kb;
  USBHIDMouse           m_mouse;
  USBHIDConsumerControl m_consumer;
};
