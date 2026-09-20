---
title: "Denial of Wallet: ética, asimetría y la ingeniería de los ataques a LLMs"
date: "2026-09-21"
lang: "es"
summary: "Qué es un Denial of Wallet, la complejidad O(N^2) de los Transformers y por qué las defensas tradicionales no alcanzan para frenarlos."
tags: ["ia", "seguridad", "ética", "opinión"]
category: "referencia"
---

Cuando te chocás contra un bot corporativo inoperante, la tentación técnica es fuerte: devolverles la frustración atacando donde les duele. En la era de la IA, el ataque DDoS clásico para tirar un servidor migró al *Denial of Wallet* (DoW): agotar los recursos financieros asociados al consumo de una API facturada por tokens.

La mecánica detrás de esto no es mandar un millón de pings. Es aprovechar la matemática intrínseca de los modelos de lenguaje.

## La mecánica técnica de un DoW

Los LLMs basados en la arquitectura Transformer sufren de un problema fundamental en su mecanismo de *atención*: la complejidad computacional crece cuadráticamente con la longitud del contexto, $O(N^2)$. 

Si vos mandás un prompt corto, cuesta centavos. Si enviás un payload masivo de 100K tokens, lleno de ruido entrópico para forzar al modelo a procesar y no poder aprovechar el *Prompt Caching*, el costo de cómputo y de facturación se dispara. Y si a eso le sumás *tool-calling* (hacer que el bot ejecute funciones internas, consulte bases de datos o haga peticiones HTTP), podés forzar al sistema a entrar en loops de pensamiento infinito.

Cada segundo que el LLM del banco procesa un prompt ofuscado, está gastando su saldo de OpenAI/Anthropic/AWS. 

## Por qué no podés fundir a un banco (y cómo se defienden)

A nivel presupuestario, gastar su API es como intentar vaciar el océano a cucharadas. Pero a nivel técnico, es un vector de ataque gravísimo para startups o proyectos open source (como la infraestructura cloud opcional de HIOS). Por eso, hay que saber cómo se mitigan estos ataques. No basta con un simple límite de rate.

| Vector de Ataque | Mecánica | Mitigación Arquitectónica |
| :--- | :--- | :--- |
| **Context Exhaustion** | Mandar el límite máximo de tokens repetidamente. | **Spend Caps (Hard limits)** por usuario y **Prompt Caching** estricto. |
| **Tool-calling Loops** | Forzar al bot a usar herramientas que fallan o iteran. | Límite máximo de iteraciones de herramientas (ej. Max 3 steps). |
| **Cache Busting** | Alterar un bit al principio del prompt para evitar el caché de prefijo. | **Semantic WAF** para agrupar queries similares y bloquear ruido. |

## Código: Token Bucket Rate Limiting en C (FreeRTOS)

Si armás un gateway local o exponés una pequeña API en un ESP32 que hace requests a un LLM en la red, tenés que implementar defensas *a pelo*. Las rate limits por IP a nivel de nginx no te sirven si corrés directo en el fierro.

Acá un algoritmo de *Token Bucket* simple implementado para un microcontrolador usando el timer de FreeRTOS. 

```c
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#define BUCKET_CAPACITY 5
#define REFILL_RATE_MS  2000

volatile int current_tokens = BUCKET_CAPACITY;
TickType_t last_refill_time = 0;

// Función para verificar si podemos procesar el request al modelo
bool allow_llm_request() {
    TickType_t now = xTaskGetTickCount();
    
    // Reposición de tokens basada en el tiempo transcurrido
    int tokens_to_add = (now - last_refill_time) / pdMS_TO_TICKS(REFILL_RATE_MS);
    if (tokens_to_add > 0) {
        current_tokens += tokens_to_add;
        if (current_tokens > BUCKET_CAPACITY) {
            current_tokens = BUCKET_CAPACITY;
        }
        last_refill_time = now;
    }

    // Verificamos si hay capacidad
    if (current_tokens > 0) {
        current_tokens--;
        return true; // Se permite el request
    }
    
    return false; // Denial of Wallet mitigado localmente
}

void process_client_task(void *pvParameters) {
    last_refill_time = xTaskGetTickCount();
    
    for(;;) {
        // Simulamos la llegada de un request al bot
        if (/* llego_request_http */ true) {
            if (allow_llm_request()) {
                printf("Procesando request al LLM. Tokens restantes: %d\n", current_tokens);
                // ejecutar_inferencia();
            } else {
                printf("Rate limit excedido (Protección DoW). HTTP 429.\n");
            }
        }
        vTaskDelay(pdMS_TO_TICKS(100)); // Yield
    }
}
```

## Trampas comunes

- **Ignorar el costo cuadrático ($O(N^2)$):** Nunca expongas un input de texto sin sanitizar la longitud máxima absoluta de caracteres. 
- **Confiar solo en el WAF tradicional:** Un WAF de capa 7 protege contra inyecciones SQL, no contra *Cache Busting* o prompts ofuscados carísimos. Necesitás controlar el gasto desde la capa de aplicación.
- **Loops de tools infinitos:** Si tu LLM tiene acceso a herramientas, asegurate de pasarle por código un límite absoluto de cuántas veces seguidas puede llamar a funciones antes de devolver error al usuario.

## Chuleta: Defensas contra DoW

| Riesgo | Solución Rápida |
| :--- | :--- |
| Picos repentinos de costo | Hard caps a nivel proveedor (budget limit) |
| Usuario abusivo | Rate limit (Token Bucket algoritm) por API Key/IP |
| Prompts gigantes inútiles | Truncar inputs y limitar max_tokens de salida |
| Loop de herramientas | Límite forzado de iteraciones en la lógica del backend |
