---
title: "FreeRTOS on ESP32: tasks, communication and diagnostics"
date: "2026-07-23"
lang: "en"
summary: "Concepts for organizing tasks, communicating between components and reviewing memory and timing in an ESP-IDF project."
tags: ["esp32", "freertos", "rtos", "reference"]
category: "referencia"
---

ESP-IDF integrates FreeRTOS to organize tasks and resources. Core count and configuration depend on the chip and project; not every member of the ESP32 family has two cores.

## Tasks, priorities and affinity

On SMP-capable targets, a task can be pinned to a core or run without fixed affinity. Ready tasks are scheduled according to their priority and the cores on which they can run.

Do not assume a universal distribution of WiFi, Bluetooth and application work. Review your version’s configuration and measure before assigning priorities or pinning tasks. [FreeRTOS in ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/freertos_idf.html).

## Create tasks and choose affinity

This fragment uses Arduino-ESP32’s `setup()` entry point. Adapt the task’s work and check the result of creating it. It is not a complete audio application.

```cpp
void audioTask(void *param) {
  for (;;) {
    // periodic work
    vTaskDelay(pdMS_TO_TICKS(10));
  }
  // A task must not return; use vTaskDelete(NULL) if it finishes.
}

void setup() {
  xTaskCreatePinnedToCore(
    audioTask,   // function
    "audio",     // debug name
    4096,        // stack in bytes in ESP-IDF/Arduino, not words
    NULL,        // parameter
    3,           // priority
    NULL,        // handle
    tskNO_AFFINITY // no fixed core
  );
}
```

When should you pin a task to a core?

- **Fixed affinity:** use it when the design or measurements justify a specific core.
- **No fixed affinity:** `tskNO_AFFINITY` lets the scheduler choose among available cores.

Size the stack for each task. In ESP-IDF, the size passed at creation is in bytes. Review observed usage and the most demanding cases; do not assume the example’s size is sufficient for every application.

## Communicate between tasks and protect resources

Concurrent access to shared data needs coordination. Choose the mechanism according to the data or resource that tasks must share:

- **Task notifications** (`xTaskNotify` / `ulTaskNotifyTake`): signal events to a task without creating a queue. Choose the operation according to how you use the notification value.
- **Queues** (`xQueueSend` / `xQueueReceive`): copy items between tasks. Check what happens when a queue fills; from an ISR, use the `...FromISR` variants.
- **Semaphores and mutexes** (`xSemaphoreTake` / `xSemaphoreGive`): use a mutex for exclusive access to a shared resource and a binary semaphore for signaling.

The following fragments assume your application defines `Event` and `render`. Create the queue during initialization, check that it is not null and share its handle between producer and consumer.

```cpp
QueueHandle_t q = xQueueCreate(8, sizeof(Event));

// Producer in task context; from an ISR, use the FromISR variant.
Event produced{}; // fill with the data to send
if (xQueueSend(q, &produced, 0) != pdTRUE) {
  // handle a full queue
}

// Consumer: the wait blocks this task, not the others.
Event ev;
if (xQueueReceive(q, &ev, portMAX_DELAY) == pdTRUE) {
  render(ev);
}
```

## Watchdog and waits

Watchdog configuration determines which tasks are monitored and what happens when they exceed the allowed time. If a `task_wdt` error occurs, check which task stopped progressing and keep the log for diagnosis.

To wait for an interval, `vTaskDelay(pdMS_TO_TICKS(n))` blocks the task and allows others to run. A busy wait such as `while (millis() - t0 < 100) {}` consumes CPU time. Choose the mechanism according to timing precision and system load.

Wait resolution depends on the configured tick frequency. Review that frequency and your timing requirements before choosing a mechanism.

## Organization patterns

- **Separate interface and worker tasks:** use messages between the display or controls and the network or audio task. Check that waits and shared resources do not block interaction.
- **Producer-consumer:** keep callbacks short and move processing to another task through a queue. Define what happens when there is no space.
- **Short ISR:** record the event with an interrupt-safe API and process it in a task. Avoid blocking operations and check platform restrictions.
- **One task responsible for a resource:** concentrate access to a display or bus in one task and send requests from the others. Document request ordering and capacity.

## Quick reference

| Need | Use |
|---|---|
| Wait for an interval | `vTaskDelay(pdMS_TO_TICKS(ms))` |
| Loop with a stable period | `vTaskDelayUntil` |
| Notify another task of a simple event | Task notification |
| Pass data to another task | Queue (`xQueueSend/Receive`) |
| Protect a bus or resource | Mutex |
| Check stack headroom | `uxTaskGetStackHighWaterMark` |
