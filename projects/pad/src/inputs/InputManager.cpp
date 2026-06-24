#include "InputManager.h"
#include <Arduino.h>

void InputManager::begin() {
  m_buttons.begin();
  m_encoder.begin();
  m_stick.begin();
  delay(10);                    // deja estabilizar los pull-ups
  m_buttons.seedInitialState(); // siembra estado real (sin eventos fantasma)
}

void InputManager::update(uint32_t now, InputSink& sink) {
  m_buttons.update(now, sink);
  m_encoder.update(now, sink);
  m_stick.update(now, sink);
}
