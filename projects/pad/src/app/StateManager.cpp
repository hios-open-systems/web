#include "StateManager.h"
#include <Arduino.h>

void StateManager::applyToggle(StateToggle t) {
  switch (t) {
    case StateToggle::MIC:    m_s.micMuted  = !m_s.micMuted;  Serial.printf("[state] mic=%s\n",  m_s.micMuted ? "muteado" : "abierto"); break;
    case StateToggle::MEDIA:  m_s.mediaPlay = !m_s.mediaPlay; Serial.printf("[state] media=%s\n", m_s.mediaPlay ? "play" : "pausa"); break;
    case StateToggle::CAMERA: m_s.camOff    = !m_s.camOff;    Serial.printf("[state] cam=%s\n",   m_s.camOff ? "off" : "on"); break;
    case StateToggle::MOUSE:  m_s.mouseOn   = !m_s.mouseOn;   break;
    default: break;
  }
}

void StateManager::bumpVolume(int d) {
  int v = (int)m_s.volume + d;
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  m_s.volume = (uint8_t)v;
}
