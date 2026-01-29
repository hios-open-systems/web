# HIOS BTDAC Controller - Android (Draft)

## Overview
Base de código para la aplicación Android de gestión del HIOS BTDAC. 
La aplicación permitirá el control total del dispositivo mediante Bluetooth Low Energy (BLE) y, en futuras versiones, mediante WiFi.

## Technical Stack
- **Language:** Kotlin
- **UI Framework:** Jetpack Compose (Modern, declarative UI)
- **Networking:** 
  - BLE for local control (Volume, EQ, Status)
  - HTTP/WebSockets for WiFi control (Streaming management)
- **Architecture:** MVVM (Model-View-ViewModel)

## Roadmap & Features

### v1.0 (BLE - Basic Control)
- [ ] Escaneo y emparejamiento con HIOS BTDAC
- [ ] Visualización de nivel de batería (vía divisor resistivo en v2 del HW)
- [ ] Control de volumen maestro
- [ ] Visualización de metadata del track actual (Artist, Title)

### v2.0 (WiFi & Streaming)
- [ ] Configuración de credenciales WiFi (Provisioning via BLE)
- [ ] Streaming directo (Spotify Connect / YouTube Music API wrapper)
- [ ] Selector de entrada (BT / WiFi / Aux)
- [ ] Update de Firmware OTA (Over-the-Air)

### v3.0 (Ecosystem)
- [ ] Wear OS Companion app
- [ ] Garmin Data Field for battery monitoring

## Project Structure (Planned)
```
app/
├── src/main/java/dev/hios/btdac/
│   ├── ui/             # Compose Screens & Components
│   ├── ble/            # BLE Connection logic
│   ├── network/        # WiFi/Streaming logic
│   └── model/          # Data classes
└── proto/              # Shared communication protocol
```

---
*Este proyecto es parte del ecosistema HIOS — Hardware que entendés, armás y mejorás.*
