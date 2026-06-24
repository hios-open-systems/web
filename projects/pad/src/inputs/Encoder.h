// ============================================================================
//  Encoder - KY-040 leido por INTERRUPCIONES (tabla de cuadratura) para no
//  perder pasos. Emite ROTATE con el delta (en detentes, con signo) en v1.
//  El pulsador del encoder lo maneja ButtonMatrix (ENC_SW).
// ============================================================================
#pragma once
#include "../app/Types.h"

class Encoder {
public:
  void begin();
  // Emite un ROTATE por cada detente acumulado desde la ultima llamada.
  void update(uint32_t now, InputSink& sink);

  long count() const;  // cuenta cruda acumulada (4 por detente)

private:
  long m_lastReportedDetent = 0;   // ultimo detente reportado
};
