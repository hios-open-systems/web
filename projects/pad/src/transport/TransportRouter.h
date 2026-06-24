// ============================================================================
//  TransportRouter - Posee los transportes y enruta cada Action al transporte
//  HID activo (USB o BLE). Las acciones de red (NET_*) y de capa se atienden
//  fuera del HID (M8 / LayerManager). Cambiar de transporte activo es instantaneo
//  porque ambos quedan inicializados.
// ============================================================================
#pragma once
#include "ITransport.h"

class TransportRouter {
public:
  void registerHid(ITransport* t);   // registra un transporte HID disponible
  void setActiveHid(TransportId id); // elige el activo
  ITransport* activeHid() const { return m_active; }

  void tick();                       // servicia los transportes registrados
  void execute(const Action& a);     // enruta por tipo

  bool activeConnected() { return m_active && m_active->isConnected(); }

private:
  static constexpr uint8_t MAX = 2;
  ITransport* m_hids[MAX] = {nullptr, nullptr};
  uint8_t     m_count = 0;
  ITransport* m_active = nullptr;
};
