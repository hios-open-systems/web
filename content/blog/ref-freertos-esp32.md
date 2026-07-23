---
title: "FreeRTOS en ESP32: lo mínimo que hay que saber"
date: "2026-07-23"
lang: "es"
summary: "El ESP-IDF corre FreeRTOS en los dos cores: tasks y prioridades, cuándo pinear, colas y semáforos para comunicar, el watchdog y los patrones típicos en proyectos maker."
tags: ["esp32", "freertos", "rtos", "referencia"]
category: "referencia"
---

Aunque nunca escribas `xTaskCreate`, en un ESP32 ya estás corriendo FreeRTOS: el ESP-IDF (y el core de Arduino, que es una capa encima) usa una variante SMP de FreeRTOS que ejecuta tasks en los **dos cores** del chip. Entender lo básico evita la mitad de los bugs raros: cuelgues, watchdogs, datos corruptos entre "hilos".

## El mapa: dos cores, muchas tasks

- **Core 0 (PRO_CPU)**: ahí viven las tasks del sistema — WiFi, Bluetooth, TCP/IP.
- **Core 1 (APP_CPU)**: en Arduino, el `loop()` corre acá como una task más (prioridad 1).

El scheduler es preemptivo por prioridad: siempre corre la task lista de mayor prioridad en cada core. Prioridad **0 es la más baja** (la task IDLE); números más altos ganan. Para código de aplicación, prioridades entre 1 y 5 suelen alcanzar — subir prioridad "para que ande más rápido" es un antipatrón que mata de hambre al resto.

## Crear tasks y cuándo pinear

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
    1            // core (0, 1, o tskNO_AFFINITY)
  );
}
```

¿Cuándo pinear a un core?

- **Pineá** lo que es sensible a latencia o jitter (audio, tiras de LED con timing estricto, un loop de control) al core 1, lejos de WiFi/BT.
- **No pinees** (usá `tskNO_AFFINITY`) lo que no le importa dónde correr: el scheduler balancea solo.

El stack es por task y **no crece**: si se desborda, crash. Ante dudas, arrancá generoso (4–8 KB) y medí con `uxTaskGetStackHighWaterMark`.

## Comunicar tasks: nunca estado compartido a pelo

Dos tasks tocando la misma variable global sin protección es una condición de carrera esperando a manifestarse (y con dos cores, ni un `noInterrupts()` te salva). Las herramientas, de más simple a más pesada:

- **Task notifications** (`xTaskNotify` / `ulTaskNotifyTake`): lo más liviano, un "timbre" con un valor de 32 bits. Ideal para "despertá y fijate".
- **Colas** (`xQueueSend` / `xQueueReceive`): pasan **copias** de datos entre tasks. El patrón productor-consumidor por excelencia. Desde una ISR, la variante `...FromISR`.
- **Semáforos y mutexes** (`xSemaphoreTake` / `Give`): para proteger un recurso compartido (un bus I2C, un display). Mutex para exclusión, semáforo binario para señalizar.

```cpp
QueueHandle_t q = xQueueCreate(8, sizeof(Event));

// productor (p. ej. callback de red o ISR)
xQueueSend(q, &ev, 0);

// consumidor (task de UI): bloquea sin gastar CPU hasta que llegue algo
Event ev;
if (xQueueReceive(q, &ev, portMAX_DELAY) == pdTRUE) {
  render(ev);
}
```

## El watchdog y la task IDLE

El ESP-IDF arma un **task watchdog** que vigila, entre otras, a las tasks IDLE de cada core. Si tu task corre en un loop apretado sin ceder nunca la CPU, la IDLE de ese core no ejecuta, el watchdog no se alimenta y te comés un reset con `task_wdt` en el log.

La cura es ceder CPU: `vTaskDelay(pdMS_TO_TICKS(n))` bloquea la task y deja correr al resto. Un busy-wait (`while (millis() - t0 < 100) {}`) quema CPU y no cede nada. En Arduino-ESP32, `delay()` llama a `vTaskDelay` por debajo, así que sí cede — el enemigo son los loops que "esperan" girando.

Detalle: el tick por defecto suele ser de 100 Hz (10 ms), así que `vTaskDelay` tiene esa granularidad. Para timing fino usá timers de hardware o `vTaskDelayUntil` para periodicidad estable.

## Patrones típicos en proyectos maker

- **Task de UI vs task de trabajo**: la pantalla/encoder en una task (core 1), la red o el audio en otra. La UI nunca bloquea esperando la red; se hablan por cola.
- **Productor-consumidor**: callbacks de red/BLE/ESP-NOW solo copian el dato a una cola y salen; una task consumidora hace el trabajo pesado a su ritmo.
- **ISR mínima**: la interrupción marca el evento (`xQueueSendFromISR` o notification) y una task lo procesa. Nada de lógica ni `Serial.print` dentro de la ISR.
- **Un dueño por recurso**: en vez de mutex por todos lados, una sola task es dueña del display (o del bus) y las demás le mandan mensajes. Menos deadlocks, más fácil de razonar.

## Chuleta

| Necesito... | Uso |
|---|---|
| Esperar sin quemar CPU | `vTaskDelay(pdMS_TO_TICKS(ms))` |
| Loop con período estable | `vTaskDelayUntil` |
| Avisarle algo simple a otra task | task notification |
| Pasarle datos a otra task | cola (`xQueueSend/Receive`) |
| Proteger un bus/recurso | mutex |
| Saber si el stack alcanza | `uxTaskGetStackHighWaterMark` |
