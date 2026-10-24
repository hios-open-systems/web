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
| **LED 3mm Difuso** | Color verde/azul (resistencia 330Ω en la fila de resistencias) | 1 | Indicador de estado "Pensando" | $0.10 |
| **Parlante Mini 4Ω 3W** | Diámetro 40mm, respuesta 200Hz - 15kHz | 1 | Salida acústica | $1.50 |
| **Cargador TP4056 USB-C con protección** | DW01A + FS8205A, carga 4.2V, corte por descarga 2.4V, sobrecorriente ~3A; pines B+/B−/OUT+/OUT− | 1 | Carga y protección de la celda | — |
| **Batería 18650 + portapilas 1S** | Li-Ion 3.7V nominal (3.0–4.2V) | 1 | Alimentación autónoma | — |
| **Pololu U3V40F5** | Step-up a 5V ±4%, arranca con ≥2.7V, hasta 4A de entrada, pin EN para corte por baja tensión | 1 | Riel 5V para el DevKit y el ampli | $9.95 (pololu.com/product/4012) |
| **Diodo Schottky SS34** | 3A, 40V | 1 | Boost → pin 5V del DevKit, evita conflicto con el USB | — |
| **Interruptor deslizante** | ≥3A | 1 | Encendido | — |
| **Resistencias** | 2× 100kΩ (divisor VBAT), 1× 22kΩ (EN del boost), 1× 330Ω (LED) | 4 | Medición, corte y LED | — |
| **Capacitores** | 220µF (VIN del ampli), 100nF (ADC) | 2 | Reserva y filtro | — |

---

## Razones de Selección de Arquitectura

### 1. ESP32-S3 N16R8 sobre ESP32 Clásico
- **Instrucciones PIE (Vector Extension)**: El chip ESP32-S3 incluye instrucciones vectoriales aceleradas que multiplican por 4 la velocidad de operaciones matriciales necesarias para TinyML (TFLite Micro) y procesamiento espectral (FFT / MFCC).
- **8MB PSRAM Octal (OPI)**: Permite almacenar buffers de audio amplios y estructuras de modelos cuantizados de forma fluida.

### 2. Audio Digital I2S (INMP441 + MAX98357A) vs. Analógico ADC/DAC
- El uso de la interfaz I2S elimina el ruido electromagnético de alta frecuencia generado por la radio WiFi/Bluetooth dentro del microcontrolador. La conversión A/D y D/A ocurre directamente dentro de los chips dedicados.

### 3. Display I2C SSD1306
- El bus I2C a 400kHz consume solo 2 pines del ESP32-S3 (SDA/SCL), dejando los buses SPI libres para tarjetas SD o periféricos de almacenamiento.

### 4. Energía: TP4056 + Pololu U3V40F5
- Una sola 18650 da 3.0–4.2V; el ampli rinde 3.2W en 4Ω recién a 5V y el DevKit espera 5V en su pin 5V. Un step-up es lo mínimo.
- El U3V40F5 está documentado (corriente, EN, comportamiento con VIN bajo) y su pin EN permite cortar a ≈3.06V con una sola resistencia, antes de que la celda llegue al corte de 2.4V del DW01A.
- Alternativa más barata: módulos MT3608. No los recomiendo sin medirlos: la corriente real de los módulos genéricos varía y no hay una ficha única confiable.
