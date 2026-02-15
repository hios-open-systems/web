# HIOS BTDAC Controller - Android App

Esta aplicación es el "Control Remoto Inteligente" para el HIOS BTDAC. Permite gestionar funciones avanzadas del dispositivo mediante Bluetooth Low Energy (BLE) sin interrumpir el streaming de audio A2DP.

## Características Implementadas (v0.5)

### 1. Conectividad Inteligente

- **Escaneo Filtrado:** Solo detecta dispositivos HIOS (UUID `4faf...`).
- **Auto-Connect:** Gestión de conexión BLE transparente al usuario.
- **Estado en Tiempo Real:** Feedback visual de conexión/desconexión.

### 2. Audio Tools (DSP)

- **Generador de Tonos:**
  - Control de frecuencia variable (20Hz - 20kHz).
  - Envío de comandos en tiempo real.
  - Útil para prueba de altavoces, crossovers y acústica de sala.

## Stack Tecnológico

- **Lenguaje:** Kotlin
- **UI:** Jetpack Compose (Material Design 3)
- **Arquitectura:** MVVM (Model-View-ViewModel) + Clean Architecture
  - `ui/`: Pantallas y componentes visuales.
  - `viewmodel/`: Lógica de presentación y estado (`MainViewModel`).
  - `data/ble/`: Capa de datos y gestión de hardware Bluetooth (`BleManager`).

## Cómo compilar

### Requisitos

- Android Studio Iguana o superior.
- JDK 17.
- Dispositivo Android físico (BLE no funciona bien en emuladores).

### Pasos

1. Abrir la carpeta `android` en Android Studio.
2. Esperar sincronización de Gradle.
3. Conectar dispositivo USB (con Depuración USB activa).
4. Ejecutar **Run 'app'**.

## Protocolo de Comunicación

La app se comunica con el ESP32 enviando cadenas de texto plano a la característica de escritura:

| Feature      | Comando enviado | Respuesta ESP32               |
| ------------ | --------------- | ----------------------------- |
| Play Tone    | `tone:1000`     | `[Tone] Iniciando 1000 Hz...` |
| (Futuro) Vol | `vol:80`        | `OK`                          |
| (Futuro) EQ  | `eq:bass:3`     | `OK`                          |

## Roadmap

- [ ] **Monitor de Batería:** Leer característica de notificación de voltaje.
- [ ] **WiFi Provisioning:** Enviar SSID/Pass al ESP32 para modo WiFi.
- [ ] **OTA Update:** Subir binario compilado desde el celular.
