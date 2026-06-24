// ============================================================================
//  BleHidTransport - HID COMPUESTO por BLE (teclado + mouse + media) en un solo
//  dispositivo, sobre NimBLEHIDDevice. Se anuncia como "HIOS PAD"; emparejas
//  desde el Bluetooth de la PC/celu (Windows, Linux, etc. - HID estandar).
//  Report IDs: 1=teclado(8B), 2=mouse(4B rel), 3=consumer(2B).
// ============================================================================
#pragma once
#include "ITransport.h"

class NimBLEHIDDevice;
class NimBLECharacteristic;

class BleHidTransport : public ITransport {
public:
  bool begin() override;
  void tick() override {}
  bool isConnected() override { return m_connected; }

  void sendKey(const KeyAction& k) override;
  void sendMedia(const MediaAction& m) override;
  void sendMouse(const MouseAction& m) override;
  void sendText(const char* s) override;

  TransportId id() override { return TransportId::BLE; }
  const char* name() override { return "BLE"; }

private:
  void kbReport(const uint8_t* r);     // 8 bytes
  void mouseReport(const uint8_t* r);  // 4 bytes
  void consReport(const uint8_t* r);   // 2 bytes

  NimBLEHIDDevice*      m_hid     = nullptr;
  NimBLECharacteristic* m_inKb    = nullptr;
  NimBLECharacteristic* m_inMouse = nullptr;
  NimBLECharacteristic* m_inCons  = nullptr;
  volatile bool         m_connected = false;
};
