---
title: "FreeRTOS en ESP32: tareas, comunicación y diagnóstico"
date: "2026-07-23"
lang: "es"
summary: "Conceptos para organizar tareas, comunicar componentes y revisar memoria y tiempos en un proyecto con ESP-IDF."
tags: ["esp32", "freertos", "rtos", "referencia"]
category: "referencia"
---

ESP-IDF integra FreeRTOS para organizar tareas y recursos. La cantidad de núcleos y la configuración dependen del chip y del proyecto; no todos los integrantes de la familia ESP32 tienen dos núcleos.

## Tareas, prioridades y afinidad

En los objetivos compatibles con SMP, una tarea puede tener afinidad con un núcleo o ejecutarse sin una afinidad fija. Las tareas listas se planifican teniendo en cuenta su prioridad y los núcleos donde pueden ejecutarse.

No asumas una distribución universal de WiFi, Bluetooth y aplicación. Revisá la configuración de tu versión y medí antes de asignar prioridades o fijar tareas a un núcleo. [FreeRTOS en ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/freertos_idf.html).

## Crear tareas y elegir afinidad

Este fragmento usa la entrada `setup()` de Arduino-ESP32. Adaptá el trabajo de la tarea y comprobá el resultado de su creación. No es una aplicación de audio completa.

```cpp
void audioTask(void *param) {
  for (;;) {
    // trabajo periódico
    vTaskDelay(pdMS_TO_TICKS(10));
  }
  // Una task nunca debe "retornar"; si termina, vTaskDelete(NULL).
}

void setup() {
  xTaskCreatePinnedToCore(
    audioTask,   // función
    "audio",     // nombre (debug)
    4096,        // stack en bytes (en ESP-IDF/Arduino, no words)
    NULL,        // parámetro
    3,           // prioridad
    NULL,        // handle
    tskNO_AFFINITY // sin fijar un núcleo
  );
}
```

¿Cuándo fijar una tarea a un núcleo?

- **Afinidad fija:** usala cuando el diseño o las mediciones justifiquen un núcleo concreto.
- **Sin afinidad fija:** `tskNO_AFFINITY` permite que el planificador elija entre los núcleos disponibles.

El stack se dimensiona por tarea. En ESP-IDF, el tamaño indicado al crearla se expresa en bytes. Revisá el uso observado y los casos de mayor consumo; no tomes el tamaño del ejemplo como un valor suficiente para cualquier aplicación.

## Comunicar tareas y proteger recursos

El acceso concurrente a datos compartidos necesita coordinación. Elegí el mecanismo según el dato o recurso que deban compartir las tareas:

- **Notificaciones de tarea** (`xTaskNotify` / `ulTaskNotifyTake`): permiten señalizar eventos a una tarea sin crear una cola. Elegí la operación según cómo uses el valor de notificación.
- **Colas** (`xQueueSend` / `xQueueReceive`): copian elementos entre tareas. Comprobá qué ocurre si la cola se llena; desde una ISR, usá las variantes `...FromISR`.
- **Semáforos y mutexes** (`xSemaphoreTake` / `xSemaphoreGive`): usá un mutex para exclusión sobre un recurso compartido y un semáforo binario para señalización.

Los siguientes fragmentos suponen que tu aplicación define `Event` y `render`. Creá la cola durante la inicialización, comprobá que no sea nula y compartí su identificador entre productor y consumidor.

```cpp
QueueHandle_t q = xQueueCreate(8, sizeof(Event));

// Productor en contexto de tarea; desde una ISR, usar la variante FromISR.
Event produced{}; // completar con los datos a enviar
if (xQueueSend(q, &produced, 0) != pdTRUE) {
  // gestionar la cola llena
}

// Consumidor: la espera bloquea esta tarea, no al resto.
Event ev;
if (xQueueReceive(q, &ev, portMAX_DELAY) == pdTRUE) {
  render(ev);
}
```

## Watchdog y esperas

La configuración del watchdog determina qué tareas se supervisan y qué ocurre cuando exceden el tiempo permitido. Si aparece un error `task_wdt`, revisá qué tarea dejó de progresar y conservá el log para diagnosticarlo.

Para esperar un intervalo, `vTaskDelay(pdMS_TO_TICKS(n))` bloquea la tarea y permite ejecutar otras. Una espera activa como `while (millis() - t0 < 100) {}` consume tiempo de CPU. Elegí el mecanismo según la precisión y la carga del sistema.

La resolución de las esperas depende de la frecuencia de tick configurada. Revisá esa frecuencia y las necesidades de temporización antes de elegir el mecanismo.

## Patrones de organización

- **Interfaz y trabajo en tareas separadas:** comunicá la pantalla y los controles con la tarea de red o audio mediante mensajes. Comprobá que las esperas y los recursos compartidos no bloqueen la interacción.
- **Productor-consumidor:** mantené breves los callbacks y trasladá el procesamiento a otra tarea mediante una cola. Definí qué hacer cuando no haya espacio.
- **ISR breve:** registrá el evento con una API apta para interrupciones y procesalo en una tarea. Evitá operaciones bloqueantes y verificá las restricciones de la plataforma.
- **Una tarea responsable de un recurso:** concentrá el acceso a una pantalla o bus en una tarea y enviá solicitudes desde las demás. Documentá el orden y la capacidad de esas solicitudes.

## Referencia rápida

| Necesito... | Uso |
|---|---|
| Esperar un intervalo | `vTaskDelay(pdMS_TO_TICKS(ms))` |
| Loop con período estable | `vTaskDelayUntil` |
| Avisarle algo simple a otra task | task notification |
| Pasarle datos a otra task | cola (`xQueueSend/Receive`) |
| Proteger un bus/recurso | mutex |
| Saber si el stack alcanza | `uxTaskGetStackHighWaterMark` |
