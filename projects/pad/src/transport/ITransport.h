// ============================================================================
//  ITransport - Interfaz de un transporte HID (USB, BLE, futuro gamepad).
//  El TransportRouter habla solo con esta interfaz, asi sumar un transporte
//  nuevo no toca el dispatcher ni las entradas.
// ============================================================================
#pragma once
#include "../actions/Action.h"

enum class TransportId : uint8_t { USB, BLE };

class ITransport {
public:
  virtual ~ITransport() = default;

  virtual bool begin() = 0;
  virtual void tick() = 0;            // servicio del stack (estado de conexion)
  virtual bool isConnected() = 0;

  virtual void sendKey(const KeyAction& k) = 0;
  virtual void sendMedia(const MediaAction& m) = 0;
  virtual void sendMouse(const MouseAction& m) = 0;
  virtual void sendText(const char* s) = 0;   // teclear un string (snippets/macros)

  virtual TransportId id() = 0;
  virtual const char* name() = 0;
};
