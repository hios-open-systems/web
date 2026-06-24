// ============================================================================
//  EventBus - Las colas FreeRTOS que conectan las tareas.
//   - actionQueue: Action resueltas (inputTask -> transportTask).
//   - uiMailbox:   ultimo UiSnapshot (inputTask -> uiTask, cross-core,
//                  xQueueOverwrite: el lector siempre ve el ultimo sin bloquear).
//  (rawInputQueue no hace falta aun: input y dispatch corren en la misma task.)
// ============================================================================
#pragma once
#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "Types.h"
#include "../actions/Action.h"

namespace bus {

extern QueueHandle_t actionQueue;   // cola de Action
extern QueueHandle_t uiMailbox;     // mailbox de 1 UiSnapshot

void begin();

}  // namespace bus
