---
title: "La IA corporativa vs. el usuario de a pie"
date: "2026-09-20"
lang: "es"
summary: "Por qué la IA corporativa profundiza la asimetría de poder, y qué tiene que ver el open hardware con la única defensa real."
tags: ["ia", "opinión", "open-source", "democratización"]
category: "referencia"
---

Hay algo profundamente frustrante en estrellarse contra un muro automatizado. Hace poco me pasó con un banco: salto de "movimiento sospechoso", fondos bloqueados un viernes a la tarde, y la única vía de contacto era un chatbot "inteligente" entrenado para absorber insultos y no resolver nada. El modelo no tiene autoridad transaccional; está ahí de escudo.

Es la asimetría de poder llevada al extremo. Cuando la corporación usa IA para blindarse del cliente, recorta costos pero te traslada todo el desgaste a vos. Vos contra un loop infinito de disculpas sintéticas. 

No me voy a poner a filosofar sobre la tiranía algorítmica. El punto es qué hacemos al respecto a nivel técnico. En HIOS, la respuesta es el hardware abierto y la computación offline. No vas a tener un chat filosófico en un ESP32, pero sí podés tener un sistema local que no dependa de que un servidor en la nube te dé permiso para prender la luz o levantar una persiana.

## Nube corporativa vs. Stack Local-First

La diferencia no es solo ideológica, es de arquitectura.

| Aspecto | Nube Corporativa (Vendor Lock-in) | Stack Local-First (HIOS) |
| :--- | :--- | :--- |
| **Toma de decisiones** | Modelo de caja negra remoto. | Lógica de control en el microcontrolador o gateway local. |
| **Latencia** | Depende del RTT a internet y carga del modelo. | Milisegundos. Ejecución determinista a pelo. |
| **Disponibilidad** | Si te cortan la API, tu hardware es un pisapapeles. | Offline por diseño. Sigue andando aunque se caiga el ISP. |
| **Auditoría** | "Confiá en nosotros". | Firmware auditable. Compilás vos mismo el `.bin`. |

## Código: Ejecución determinista sin depender de la nube

Si vas a armar algo crítico, el enemigo son los loops que esperan girando (polling) o los requests HTTP bloqueantes a una IA para tomar una decisión. En un sistema embebido como el ESP32 con FreeRTOS, todo tiene que ser asíncrono y local.

Acá un ejemplo básico de cómo procesar un comando local por cola, sin bloquear el micro si la red se pone lenta o si el servidor externo (o gateway) no responde.

```c
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

// Definimos la cola para comandos locales
QueueHandle_t localCommandQueue;

typedef struct {
    uint8_t command_id;
    uint32_t payload;
} LocalCommand;

// Tarea que procesa los comandos offline. Nunca bloquea el main loop.
void vCommandTask(void *pvParameters) {
    LocalCommand cmd;
    for(;;) {
        // Esperamos un comando en la cola (portMAX_DELAY es seguro acá porque es una tarea dedicada)
        if (xQueueReceive(localCommandQueue, &cmd, portMAX_DELAY) == pdPASS) {
            // Ejecución determinista offline
            if (cmd.command_id == 1) {
                // Activar relé, sin preguntar a ningún LLM
                printf("Ejecutando comando crítico localmente: %lu\n", cmd.payload);
            }
        }
    }
}

void setup() {
    localCommandQueue = xQueueCreate(10, sizeof(LocalCommand));
    
    // Asignamos core 1 para la lógica local y core 0 para el stack de red
    xTaskCreatePinnedToCore(
        vCommandTask,
        "CommandTask",
        2048,
        NULL,
        1,
        NULL,
        1
    );
}

void loop() {
    // El main loop queda libre. Te comés un reset si ponés un delay() largo acá.
    vTaskDelay(pdMS_TO_TICKS(1000)); 
}
```

## Trampas comunes

- **Bloquear el micro por un request HTTP:** Nunca pongas la toma de decisión crítica atada a un timeout de red. Usá FreeRTOS, colas y tareas separadas.
- **Creer que el vendor lock-in no te va a tocar:** "Es solo una API de 2 centavos". Ojo: cuando te cambien los Terms of Service, tus placas se apagan.
- **Confundir inteligencia con control:** Que un chatbot genere texto lindo no significa que tenga permisos en el backend bancario. Es solo un proxy.

## Chuleta: Soberanía de datos

| Necesidad | Enfoque corporativo | Enfoque Open/Local |
| :--- | :--- | :--- |
| Atención al cliente | Chatbot sin permisos reales | Canales con operadores humanos |
| Automatización de hardware | API en la nube (AWS/Tuya) | MQTT local + Home Assistant + ESP32 |
| Ejecución de inferencias | APIs de pago por token | Modelos locales cuantizados / LLMs en gateways locales |
