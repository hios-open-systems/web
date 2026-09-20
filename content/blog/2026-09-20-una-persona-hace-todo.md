---
title: "Una persona hace todo: la paradoja de la democratización"
date: "2026-09-20"
lang: "es"
summary: "Antes un proyecto web y de hardware requería 7 roles. Hoy la hago solo. Pero la IA junior te llena de deuda técnica y alucinaciones en C."
tags: ["ia", "opinión", "democratización", "web", "trabajo"]
category: "referencia"
---

Esta plataforma (HIOS) tiene internacionalización, guías interactivas, workbench embebido, auth y proyectos de hardware. Hace diez años, esto requería 7 personas: UX, frontend, backend, DevOps, QA, content y project manager. 

Hoy la hago yo solo. Herramientas democratizadas, frameworks modernos y modelos de lenguaje que te escupen código a demanda. Pero la realidad técnica del "solo dev" usando IA no es un camino de rosas. El verdadero lado B no es la filosofía sobre los puestos de trabajo perdidos; es la montaña de deuda técnica y el agotamiento cognitivo de ser el revisor permanente de un programador junior infinito que, además, es un mentiroso compulsivo en C.

## El costo real: Fatiga cognitiva y alucinaciones

Cuando le pedís a un LLM que te haga un componente de React, zafa. Cuando le pedís que te arme una tarea en FreeRTOS para un ESP32 interactuando con un sensor I2C, te tira métodos que no existen. 

El modelo te inventa APIs de ESP-IDF con una confianza absoluta. Y vos terminás perdiendo tres horas debugeando por qué `i2c_master_transmit_dma()` no compila, hasta que te das cuenta de que el LLM lo alucinó porque leyó mucha documentación de STM32 y la mezcló. El modelo no entiende la arquitectura de memoria del ESP32. Te va a proponer arrays estáticos de 100KB y te comés un stack overflow en tiempo de ejecución.

## Código: Cómo no caer en las mentiras del LLM

El error clásico es aceptar código bloqueante o llamadas a APIs inexistentes. Acá un ejemplo de lo que un LLM te suele sugerir para leer un sensor, y cómo debería ser realmente en un entorno embedded decente.

```c
// ❌ LO QUE TE ESCUPE EL LLM (Peligro de Stack Overflow y Watchdog Reset)
void read_sensor_llm() {
    // Alucina un buffer gigante en el stack de la tarea (el stack de FreeRTOS por default es chico)
    uint8_t buffer[8192]; 
    // Alucina una API de ESP-IDF que no existe
    i2c_read_bytes_blocking(I2C_NUM_0, 0x68, buffer, 8192, 1000); 
    // Bloquea el procesador
    delay(500); 
}

// ✅ LO QUE TENÉS QUE ESCRIBIR VOS (O corregirle al LLM)
#include "driver/i2c.h"
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

void read_sensor_real(void *pvParameters) {
    // Memoria dinámica en el heap si el buffer es grande, o estático global.
    // Usamos la API real de ESP-IDF para I2C
    uint8_t data[16]; 
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (0x68 << 1) | I2C_MASTER_READ, true);
    i2c_master_read(cmd, data, sizeof(data), I2C_MASTER_LAST_NACK);
    i2c_master_stop(cmd);
    
    for(;;) {
        // Ejecución no bloqueante
        esp_err_t ret = i2c_master_cmd_begin(I2C_NUM_0, cmd, pdMS_TO_TICKS(1000));
        if (ret == ESP_OK) {
            printf("Sensor leído correctamente\n");
        }
        // Yield a otras tareas. El watchdog te lo agradece.
        vTaskDelay(pdMS_TO_TICKS(500));
    }
    i2c_cmd_link_delete(cmd);
}
```

## Estructurar el workflow para no ahogarse

Si querés armar un sistema completo como HIOS siendo uno solo, el secreto es encapsular al LLM. No le pidas "armá el sistema de telemetría". Pedile: "escribí un parser en C puro para este paquete binario de 8 bytes, y dame los tests de unidad en Unity". 

La fatiga cognitiva de revisar código malo de un LLM es peor que escribirlo desde cero. Acotá el scope de la IA a funciones puras sin side-effects.

## Trampas comunes

- **Creerle al LLM con APIs de hardware:** Los modelos son malísimos con ESP-IDF, STM32 HAL y Zephyr. Siempre validá contra los headers locales (`grep` es tu amigo).
- **Fatiga de review:** Leer código generado cansa más rápido que escribirlo. Si la respuesta supera las 50 líneas y no es un boilerplate tonto, descartala.
- **Stack Overflows en RTOS:** Los LLMs programan en C asumiendo que están en un Linux de escritorio con gigas de RAM. En FreeRTOS el stack por tarea es mínimo (2KB a 8KB). Ojo con los arrays locales.

## Chuleta: Flujo de trabajo para Solo-Devs con IA

| Tipo de tarea | Uso de IA recomendado | Riesgo |
| :--- | :--- | :--- |
| Boilerplate React/Next.js | Generación directa, copy-paste iterativo | Bajo (te avisa el linter y Typescript) |
| Lógica de negocio (Backend) | Pair programming, generación de tests | Medio (errores de lógica, edge cases) |
| Firmware (ESP-IDF, FreeRTOS) | Solo snippets de funciones puras, regex | **Crítico** (Watchdog resets, memory leaks, APIs inventadas) |
