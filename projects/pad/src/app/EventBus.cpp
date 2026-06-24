#include "EventBus.h"

namespace bus {

QueueHandle_t actionQueue = nullptr;
QueueHandle_t uiMailbox   = nullptr;

void begin() {
  actionQueue = xQueueCreate(32, sizeof(Action));
  uiMailbox   = xQueueCreate(1, sizeof(UiSnapshot));  // mailbox (capacidad 1)
}

}  // namespace bus
