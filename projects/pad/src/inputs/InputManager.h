// ============================================================================
//  InputManager - Agrupa todas las fuentes de entrada (botones, encoder, stick)
//  y las samplea en un solo update(). Es la unica clase que el resto del sistema
//  necesita conocer para recibir InputEvents. Agregar una entrada nueva = sumar
//  una fuente aca (o, a futuro, una que implemente una base InputSource comun).
// ============================================================================
#pragma once
#include "../app/Types.h"
#include "ButtonMatrix.h"
#include "Encoder.h"
#include "AnalogStick.h"

class InputManager {
public:
  void begin();
  void update(uint32_t now, InputSink& sink);

  const ButtonMatrix& buttons() const { return m_buttons; }
  const Encoder&      encoder() const { return m_encoder; }
  const AnalogStick&  stick()   const { return m_stick; }

private:
  ButtonMatrix m_buttons;
  Encoder      m_encoder;
  AnalogStick  m_stick;
};
