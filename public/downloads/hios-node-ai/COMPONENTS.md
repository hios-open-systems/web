# HIOS Node AI — Especificaciones de Componentes y BOM

Este documento detalla la lista de materiales (Bill of Materials - BOM) y las especificaciones técnicas de cada módulo seleccionado para el nodo de escritorio HIOS AI.

---

## Lista de Materiales (BOM)

| Módulo / Componente | Especificaciones Clave | Cantidad | Función Principal | Precio Estimado (USD) |
|---------------------|------------------------|----------|-------------------|-----------------------|
| **ESP32-S3-DevKitC-1 (N16R8)** | Dual Core LX7 240MHz, 16MB Flash, 8MB PSRAM OPI, USB-C dual | 1 | Microcontrolador principal & Inferencia SIMD | $5.50 |
| **INMP441** | Micrófono MEMS I2S omnidireccional, SNR 61 dBA, 24-bit PCM | 1 | Captura de audio de voz | $1.80 |
| **MAX98357A** | Amplificador Mono I2S Clase D, 3.2W en 4Ω, DAC integrado | 1 | Reproducción de audio/respuestas sintetizadas | $1.50 |
| **OLED 0.96" SSD1306** | 128x64 pixels, interfaz I2C (0x3C), monocromo azul/blanco | 1 | Pantalla de estado y respuesta de IA | $2.20 |
| **Botonera Omron 6x6** | Pulsador momentáneo con tapa capuchón | 1 | Botón de disparo / PTT (Push To Talk) | $0.20 |
| **LED 3mm Difuso** | Color verde/azul (con resistencia 330Ω) | 1 | Indicador de estado "Pensando" | $0.10 |
| **Parlante Mini 4Ω 3W** | Diámetro 40mm, respuesta 200Hz - 15kHz | 1 | Salida acústica | $1.50 |
| **Cargador Li-Ion TP4056** | Módulo USB-C con protección de sobrecarga | 1 | Gestión de carga de batería | $0.60 |
| **Batería 18650** | Li-Ion 3.7V 2600mAh | 1 | Alimentación autónoma | $3.50 |

---

## Razones de Selección de Arquitectura

### 1. ESP32-S3 N16R8 sobre ESP32 Clásico
- **Instrucciones PIE (Vector Extension)**: El chip ESP32-S3 incluye instrucciones vectoriales aceleradas que multiplican por 4 la velocidad de operaciones matriciales necesarias para TinyML (TFLite Micro) y procesamiento espectral (FFT / MFCC).
- **8MB PSRAM Octal (OPI)**: Permite almacenar buffers de audio amplios y estructuras de modelos cuantizados de forma fluida.

### 2. Audio Digital I2S (INMP441 + MAX98357A) vs. Analógico ADC/DAC
- El uso de la interfaz I2S elimina el ruido electromagnético de alta frecuencia generado por la radio WiFi/Bluetooth dentro del microcontrolador. La conversión A/D y D/A ocurre directamente dentro de los chips dedicados.

### 3. Display I2C SSD1306
- El bus I2C a 400kHz consume solo 2 pines del ESP32-S3 (SDA/SCL), dejando los buses SPI libres para tarjetas SD o periféricos de almacenamiento.
