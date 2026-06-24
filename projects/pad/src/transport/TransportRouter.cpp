#include "TransportRouter.h"

void TransportRouter::registerHid(ITransport* t) {
  if (m_count < MAX) {
    m_hids[m_count++] = t;
    if (!m_active) m_active = t;   // el primero registrado es el activo por defecto
  }
}

void TransportRouter::setActiveHid(TransportId id) {
  for (uint8_t i = 0; i < m_count; i++)
    if (m_hids[i] && m_hids[i]->id() == id) { m_active = m_hids[i]; return; }
}

void TransportRouter::tick() {
  for (uint8_t i = 0; i < m_count; i++)
    if (m_hids[i]) m_hids[i]->tick();
}

void TransportRouter::execute(const Action& a) {
  switch (a.type) {
    case ActionType::KEY:   if (m_active) m_active->sendKey(a.p.key);   break;
    case ActionType::MEDIA: if (m_active) m_active->sendMedia(a.p.media); break;
    case ActionType::MOUSE: if (m_active) m_active->sendMouse(a.p.mouse); break;
    // MACRO/LAYER/NET_* se atienden en sus milestones (M3/M4/M8).
    default: break;
  }
}
