# HIOS BTDAC
**Descripción General:** Receptor de audio Bluetooth portátil de alta fidelidad con DAC PCM5102 y procesador ESP32.

---

## 1. Microcontrolador / Procesador
**Producto:** ESP32 Development Board (38 Pines) - ESP-WROOM-32

**Descripción:**  
Placa de desarrollo de alto rendimiento basada en el módulo ESP-WROOM-32. Integra conectividad Wi-Fi y Bluetooth (Dual Mode) en un solo chip. La versión de 38 pines proporciona acceso extendido a los pines GPIO del microcontrolador, facilitando la conexión de múltiples periféricos sin multiplexado.

**Especificaciones:**
- **Microcontrolador:** ESP32-D0WDQ6 Dual Core
- **Frecuencia de Reloj:** Ajustable entre 80MHz y 240MHz
- **Memoria Flash:** 4MB
- **Memoria SRAM:** 520KB
- **Conectividad:** Wi-Fi 802.11 b/g/n + Bluetooth v4.2 BR/EDR y BLE
- **Interfaz:** I2S, I2C, SPI, UART, ADC, DAC
- **Tensión de Entrada:** 5V (vía Micro USB o Pin VIN)
- **Tensión Lógica:** 3.3V
- **Cantidad de Pines:** 38 Pines

---

## 2. Fuente de Alimentación
**Producto:** Convertidor DC-DC Step Down LM2596S con Display

**Descripción:**  
Fuente de alimentación conmutada basada en el regulador step-down LM2596. Incluye un display LED para visualizar la tensión y un preset multivuelta de alta precisión para el ajuste. Permite convertir una tensión de entrada (ej. batería en serie) a una salida regulada (ej. 5V) con alta eficiencia.

**Especificaciones:**
- **Tensión de entrada:** 4V a 40V
- **Tensión de salida:** Ajustable 1.25V a 37V
- **Corriente de salida Máxima:** 3A (con disipador) / 1A (sin disipador)
- **Potencia de salida:** 50-70W (con disipador)
- **Frecuencia de Trabajo:** 150KHz
- **Eficiencia:** Aprox. 95%
- **Protecciones:** Cortocircuito y Sobre temperatura
- **Interfaz:** Display LED con botón de operación
- **Dimensiones:** 48mm x 25mm x 14mm

---

## 3. Almacenamiento de Energía (Celdas)
**Producto:** Porta Batería X2 18650 (Modificado para Serie)

**Descripción:**  
Soporte para dos celdas de litio tipo 18650. *Nota: El producto original es paralelo (SKU 1880), este componente se encuentra modificado eléctricamente para conectar las celdas en serie y obtener mayor voltaje (7.4V nominal).*

**Especificaciones:**
- **Configuración:** Modificado a SERIE (Originalmente Paralelo)
- **Tensión Nominal Resultante:** 7.4V (3.7V x 2)
- **Compatibilidad:** Baterías de Litio 18650
- **Diseño:** Abierto (sin tapa)
- **Conexión:** Cables integrados

---

## 4. Sistema de Carga
**Producto:** Módulo Cargador BMS 2S USB-C (Modelo 4A)

**Descripción:**  
Módulo de gestión de carga para dos baterías de Litio en serie (2S) con puerto USB-C. Integra funciones de balanceo y protección BMS (Battery Management System). Permite cargar el pack de baterías de forma segura desde una fuente USB estándar.

**Especificaciones:**
- **Configuración de Carga:** 2S (2 celdas en serie)
- **Tensión de Plena Carga:** 8.4V
- **Corriente de Carga:** 2.2A (Configurable)
- **Corriente de Entrada Requerida:** 4A
- **Tensión de Entrada:** 3V a 6V (USB-C estándar)
- **Protecciones:** Sobredescarga, Sobretensión y Cortocircuito
- **Indicadores:** LED SMD de estado
- **Dimensiones:** 37mm x 17mm x 10mm

---

## 5. Conversor de Audio Digital-Analógico (DAC)
**Producto:** Módulo DAC PCM5102 (LAB1 Tech)

**Descripción:**  
Módulo de conversión de audio de alta fidelidad diseñado para interfaces I2S. Ofrece una salida de audio analógica estéreo de línea (RCA/Jack) con bajo ruido y alta dinámica, superior a la salida DAC interna de los microcontroladores estándar.

**Especificaciones:**
- **Chip:** Texas Instruments PCM5102A
- **Interfaz de Datos:** I2S (Inter-IC Sound)
- **Resolución:** hasta 32-bit
- **Frecuencia de Muestreo:** hasta 384kHz
- **Relación Señal/Ruido (SNR):** 112dB
- **Salida:** 2.1V RMS (Nivel de línea estándar)
- **Alimentación:** 3.3V - 5V
- **Características:** Baja distorsión, Rango dinámico amplio
