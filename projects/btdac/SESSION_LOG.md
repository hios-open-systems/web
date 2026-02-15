# Registro de Sesión: Evolución a Arquitectura Híbrida

**Fecha:** 15 Feb 2026
**Proyecto:** HIOS BTDAC v2

## Resumen Ejecutivo

En esta sesión transformamos el BTDAC de un "Receptor Bluetooth tonto" a un **Dispositivo Híbrido Inteligente**. Logramos que el ESP32 mantenga el audio de alta calidad (Classic BT) mientras acepta comandos de control desde una nueva App Android (BLE).

---

## 1. Lo que logramos (Done)

### A. Firmware (ESP32)

- **Implementación Dual Mode:**
  - Configuramos `min_spiffs.csv` para tener espacio para ambos stacks Bluetooth.
  - Integramos `BluetoothA2DPSink` y `BLEDevice` en el mismo sketch.
  - Solucionamos el conflicto de inicialización (orden correcto: A2DP Sink -> BLE Init).
- **DSP / Tone Generator:**
  - Creamos un generador de ondas senoidales por software.
  - Inyección directa al buffer I2S (`i2s_write`) bypasseando la librería A2DP cuando se solicita un tono.
- **Protocolo de Comandos:**
  - Definimos un servicio BLE custom (`4faf...`).
  - Implementamos parser de comandos simples (`tone:FREQ`).

### B. App Android (Control)

- **Base sólida:**
  - Proyecto Kotlin + Jetpack Compose desde cero.
  - Arquitectura MVVM limpia (`BleManager` separado de la UI).
- **Funcionalidad:**
  - Scanner BLE que filtra solo dispositivos HIOS.
  - UI de "Dashboard" para conexión.
  - UI de "Herramientas" con slider de frecuencia funcional.

---

## 2. Ideas que surgieron (Backlog de Innovación)

Estas son las ideas que discutimos para diferenciar el producto:

- **Modo "WiFi Streamer":**
  - Idea: Usar la App para pasarle las credenciales WiFi al ESP32.
  - Objetivo: Reproducción Lossless (FLAC) real, superando al Bluetooth.
  - _Desafío Técnico:_ Coexistencia de radio (WiFi + BT tartamudean).
  - _Solución Propuesta:_ "Modos Exclusivos" conmutables desde la App.
- **Herramientas de Audio Pro:**
  - **Ruido Rosa:** Para calibración de salas/EQ.
  - **Sweep:** Barrido automático 20Hz-20kHz para testing de drivers.
  - **Medidor de Latencia:** La App emite un sonido, el ESP32 lo escucha (requiere micrófono, HW v3) o viceversa para medir retardo de la cadena.
- **Ecosistema:**
  - App de Wear OS para controlar volumen desde el reloj.
  - Integración con Home Assistant (MQTT en modo WiFi).

---

## 3. Próximos Pasos (To-Do)

### Prioridad Alta (Para completar el MVP v2)

1.  [ ] **Feedback en App:** Que el ESP32 notifique a la App cuando termina de tocar el tono.
2.  [ ] **Control de Volumen:** Sincronizar el volumen del hardware (DAC) con un slider en la App.
3.  [ ] **Persistencia:** Guardar el último dispositivo conectado en la App para reconexión automática real.

### Prioridad Media (Hardware v2)

4.  [ ] **Lectura de Batería:** Implementar divisor resistivo en PCB y enviar lectura por BLE (Notification).
5.  [ ] **Manejo de Energía:** Deep sleep si no hay conexión por 10 min.

### Prioridad Baja (Investigación)

6.  [ ] Probar librería `ESP32-audioI2S` para el modo WiFi.
7.  [ ] Diseñar carcasa 3D con botón de "Pairing" físico.
