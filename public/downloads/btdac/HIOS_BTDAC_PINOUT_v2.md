# HIOS BTDAC - Guía Completa de Conexiones y Pinout

**Versión:** 2.0  
**Fecha:** Enero 2026  
**Proyecto:** HI Open Systems - Bluetooth DAC para monitores de estudio

---

## Índice

1. [Especificaciones Generales](#1-especificaciones-generales)
2. [Módulo de Alimentación](#2-módulo-de-alimentación)
3. [Módulo ESP32 DevKit (38 pines)](#3-módulo-esp32-devkit-38-pines)
4. [Módulo DAC PCM5102](#4-módulo-dac-pcm5102)
5. [Módulo LED RGB KY-009](#5-módulo-led-rgb-ky-009)
6. [Componentes Adicionales Recomendados](#6-componentes-adicionales-recomendados)
7. [Lista Completa de Cableado](#7-lista-completa-de-cableado)

---

## 1. Especificaciones Generales

| Parámetro            | Valor                   |
| :------------------- | :---------------------- |
| Tensión de operación | 5.0V DC regulados       |
| Tensión de baterías  | 7.4V - 8.4V (2S Li-Ion) |
| Protocolo de audio   | I2S (Philips Standard)  |
| Sample Rate          | 44.1kHz (A2DP estándar) |
| Bit Depth            | 16-bit                  |
| Bluetooth            | A2DP Sink (receptor)    |

---

## 2. Módulo de Alimentación

### 2.1 Componentes

| Componente      | Especificación                  | Cantidad |
| :-------------- | :------------------------------ | :------- |
| Batería 18650   | 3.7V Li-Ion, 2000-3500mAh       | 2        |
| BMS 2S          | 7.4V, 20A (o según necesidad)   | 1        |
| DC-DC Step Down | Entrada 7-28V, Salida ajustable | 1        |

### 2.2 Configuración del BMS 2S

```
    [BAT 1 +] -----> B+
    [BAT 1 -]---+
                +--> BM (Punto medio ~3.7V)
    [BAT 2 +]---+
    [BAT 2 -] -----> B-

    Salidas: P+ (protegida), P- (protegida)
```

### 2.3 Configuración del DC-DC Step Down

⚠️ **CRÍTICO: Ajustar la salida a 5.0V ANTES de conectar cualquier módulo.**

| Terminal | Conexión                       |
| :------- | :----------------------------- |
| IN+      | BMS P+                         |
| IN-      | BMS P-                         |
| OUT+     | Bus de 5V (VIN de ESP32 y DAC) |
| OUT-     | Bus de GND (masa común)        |

### 2.4 Conexiones del Módulo de Alimentación

| Origen            | Destino   | Color Sugerido | Calibre   |
| :---------------- | :-------- | :------------- | :-------- |
| Batería 1 (+)     | BMS B+    | Rojo           | 18-20 AWG |
| Batería 2 (-)     | BMS B-    | Negro          | 18-20 AWG |
| Bat1(-) / Bat2(+) | BMS BM    | Blanco         | 20-22 AWG |
| BMS P+            | DC-DC IN+ | Rojo           | 20-22 AWG |
| BMS P-            | DC-DC IN- | Negro          | 20-22 AWG |
| DC-DC OUT+        | Bus 5V    | Rojo           | 22 AWG    |
| DC-DC OUT-        | Bus GND   | Negro          | 22 AWG    |

---

## 3. Módulo ESP32 DevKit (38 pines)

### 3.1 Especificaciones

| Parámetro                  | Valor                               |
| :------------------------- | :---------------------------------- |
| Modelo                     | ESP32-WROOM-32 DevKit V1 (38 pines) |
| Tensión de entrada VIN     | 5V (desde DC-DC)                    |
| Tensión lógica             | 3.3V (interno)                      |
| Corriente típica BT activo | ~130mA                              |

### 3.2 Asignación de Pines

| GPIO | Función         | Dirección | Notas                       |
| :--- | :-------------- | :-------- | :-------------------------- |
| VIN  | Alimentación 5V | Entrada   | Desde DC-DC OUT+            |
| GND  | Masa común      | -         | Conectar a bus GND          |
| 26   | I2S BCK         | Salida    | Bit Clock hacia DAC         |
| 25   | I2S LRCK        | Salida    | Word Select (L/R) hacia DAC |
| 22   | I2S DIN         | Salida    | Data hacia DAC              |
| 4    | LED Rojo        | Salida    | PWM capable, safe boot      |
| 16   | LED Verde       | Salida    | UART2 RX reasignado         |
| 17   | LED Azul        | Salida    | UART2 TX reasignado         |

### 3.3 GPIOs a Evitar

| GPIO | Razón                             |
| :--- | :-------------------------------- |
| 0    | Modo boot (tiene pull-up interno) |
| 2    | LED onboard en algunos modelos    |
| 6-11 | Flash SPI interno - NO USAR       |
| 12   | Modo boot - nivel afecta arranque |
| 15   | Modo boot - pull-up afecta logs   |

### 3.4 Conexiones del ESP32

| Pin ESP32 | Destino               | Notas                            |
| :-------- | :-------------------- | :------------------------------- |
| VIN       | DC-DC OUT+ (5V)       | Alimentación principal           |
| GND       | Bus GND               | Al menos 1 conexión a masa común |
| GPIO 26   | PCM5102 BCK           | Cable corto, directo             |
| GPIO 25   | PCM5102 LRCK          | Cable corto, directo             |
| GPIO 22   | PCM5102 DIN           | Cable corto, directo             |
| GPIO 4    | Resistor 330Ω → LED R | Con resistencia en serie         |
| GPIO 16   | Resistor 330Ω → LED G | Con resistencia en serie         |
| GPIO 17   | Resistor 330Ω → LED B | Con resistencia en serie         |

---

## 4. Módulo DAC PCM5102

### 4.1 Especificaciones

| Parámetro    | Valor                       |
| :----------- | :-------------------------- |
| Chip         | TI PCM5102A                 |
| Resolución   | 32-bit (usamos 16-bit)      |
| SNR          | 112dB                       |
| Alimentación | 5V (regulador 3.3V interno) |
| Salida       | Line Level, estéreo         |

### 4.2 Configuración de Jumpers (Parte Trasera)

⚠️ **CRÍTICO: Configurar ANTES de alimentar el módulo.**

| Jumper   | Posición     | Efecto                                   |
| :------- | :----------- | :--------------------------------------- |
| **FLT**  | **L** (Low)  | Filtro de respuesta normal/baja latencia |
| **DEMP** | **L** (Low)  | De-emphasis desactivado                  |
| **XSMT** | **H** (High) | Auto-mute DESACTIVADO (sonido ON)        |
| **FMT**  | **L** (Low)  | Formato I2S estándar                     |

```
Parte trasera del módulo PCM5102:

  [L]  [H]      [L]  [H]      [L]  [H]      [L]  [H]
   ●────○        ●────○        ○────●        ●────○
   FLT           DEMP          XSMT          FMT

   ● = Soldado/Conectado
```

### 4.3 Descripción de Pines del Conector

| Pin | Nombre | Función          | Conexión            |
| :-- | :----- | :--------------- | :------------------ |
| 1   | VIN    | Alimentación 5V  | DC-DC OUT+ (Bus 5V) |
| 2   | GND    | Masa             | Bus GND             |
| 3   | SCK    | System Clock     | **CONECTAR A GND**  |
| 4   | BCK    | Bit Clock        | ESP32 GPIO 26       |
| 5   | DIN    | Data In          | ESP32 GPIO 22       |
| 6   | LRCK   | Word Select      | ESP32 GPIO 25       |
| 7   | 3.3V   | Salida regulador | **NO CONECTAR**     |

### 4.4 Nota sobre SCK

El pin SCK conectado a GND fuerza al PCM5102 a usar su PLL interno para generar el System Clock a partir del BCK. Esto simplifica el diseño al no requerir un oscilador externo.

### 4.5 Conexiones del PCM5102

| Pin PCM5102 | Destino         | Notas              |
| :---------- | :-------------- | :----------------- |
| VIN         | DC-DC OUT+ (5V) | Paralelo con ESP32 |
| GND         | Bus GND         | Masa común         |
| SCK         | Bus GND         | **Puente a masa**  |
| BCK         | ESP32 GPIO 26   | Bit Clock          |
| DIN         | ESP32 GPIO 22   | Audio Data         |
| LRCK        | ESP32 GPIO 25   | Left/Right Clock   |
| 3.3V        | Sin conexión    | Dejar al aire      |

---

## 5. Módulo LED RGB KY-009

### 5.1 Especificaciones

| Parámetro               | Valor                        |
| :---------------------- | :--------------------------- |
| Tipo                    | LED RGB 5mm, cátodo común    |
| Corriente máx por color | 20mA                         |
| Resistencia requerida   | 330Ω por canal (3.3V lógica) |

⚠️ **ADVERTENCIA: El módulo KY-009 NO incluye resistencias limitadoras. Conectar directamente QUEMARÁ el LED y puede dañar el GPIO del ESP32.**

### 5.2 Cálculo de Resistencias

```
R = (Vgpio - Vled) / I
R = (3.3V - 2.0V) / 10mA = 130Ω mínimo

Usamos 330Ω para mayor seguridad y menor consumo.
Corriente resultante: ~4mA por canal (suficiente brillo)
```

### 5.3 Descripción de Pines

| Pin KY-009 | Función      | Conexión                      |
| :--------- | :----------- | :---------------------------- |
| - (Menos)  | Cátodo común | Bus GND                       |
| R          | Ánodo Rojo   | Resistor 330Ω → ESP32 GPIO 4  |
| G          | Ánodo Verde  | Resistor 330Ω → ESP32 GPIO 16 |
| B          | Ánodo Azul   | Resistor 330Ω → ESP32 GPIO 17 |

### 5.4 Esquema de Colores de Estado

| Estado                | Color             | GPIOs Activos |
| :-------------------- | :---------------- | :------------ |
| Esperando conexión BT | Azul parpadeante  | GPIO 17 (PWM) |
| Conectado             | Verde fijo        | GPIO 16       |
| Reproduciendo         | Verde parpadeante | GPIO 16 (PWM) |
| Batería baja          | Rojo fijo         | GPIO 4        |
| Error                 | Rojo parpadeante  | GPIO 4 (PWM)  |

### 5.5 Conexiones del LED RGB

| Elemento         | Destino                  | Notas        |
| :--------------- | :----------------------- | :----------- |
| KY-009 (-)       | Bus GND                  | Cátodo común |
| Resistor 330Ω #1 | Entre GPIO 4 y KY-009 R  | En serie     |
| Resistor 330Ω #2 | Entre GPIO 16 y KY-009 G | En serie     |
| Resistor 330Ω #3 | Entre GPIO 17 y KY-009 B | En serie     |

---

## 6. Componentes Adicionales Recomendados

### 6.1 Condensadores de Desacople (Muy Recomendado)

Para reducir ruido en la alimentación y mejorar calidad de audio:

| Ubicación            | Capacitor | Tipo          | Función                |
| :------------------- | :-------- | :------------ | :--------------------- |
| Cerca de ESP32 VIN   | 100µF     | Electrolítico | Filtro baja frecuencia |
| Cerca de ESP32 VIN   | 100nF     | Cerámico      | Filtro alta frecuencia |
| Cerca de PCM5102 VIN | 10µF      | Electrolítico | Filtro baja frecuencia |
| Cerca de PCM5102 VIN | 100nF     | Cerámico      | Filtro alta frecuencia |

### 6.2 Lista de Materiales (BOM) Completa

| Componente               | Cantidad | Notas                 |
| :----------------------- | :------- | :-------------------- |
| ESP32 DevKit 38 pines    | 1        | WROOM-32              |
| PCM5102 Módulo           | 1        | Versión roja o negra  |
| KY-009 LED RGB           | 1        | Cátodo común          |
| Resistor 330Ω 1/4W       | 3        | Para LED RGB          |
| BMS 2S                   | 1        | 7.4V, mín 10A         |
| DC-DC Step Down          | 1        | Ajustable, eficiente  |
| Batería 18650            | 2        | Protegidas preferible |
| Portapilas 2x18650 serie | 1        | O soldar directo      |
| Capacitor 100µF 10V      | 2        | Electrolítico         |
| Capacitor 10µF 10V       | 1        | Electrolítico         |
| Capacitor 100nF          | 3        | Cerámico              |
| Cable 22 AWG             | varios   | Rojo, negro, colores  |

---

## 7. Lista Completa de Cableado

### Conexiones Planas (para seguir al soldar)

```
═══════════════════════════════════════════════════════════════
                    ALIMENTACIÓN
═══════════════════════════════════════════════════════════════
BAT1-POS ─────────────────────────────────────────────► BMS-B+
BAT2-NEG ─────────────────────────────────────────────► BMS-B-
BAT1-NEG / BAT2-POS ──────────────────────────────────► BMS-BM
BMS-P+ ───────────────────────────────────────────────► DCDC-IN+
BMS-P- ───────────────────────────────────────────────► DCDC-IN-
DCDC-OUT+ ────────────────────────────────────────────► BUS-5V
DCDC-OUT- ────────────────────────────────────────────► BUS-GND

═══════════════════════════════════════════════════════════════
                    ESP32
═══════════════════════════════════════════════════════════════
ESP32-VIN ────────────────────────────────────────────► BUS-5V
ESP32-GND ────────────────────────────────────────────► BUS-GND
ESP32-GPIO26 ─────────────────────────────────────────► PCM-BCK
ESP32-GPIO25 ─────────────────────────────────────────► PCM-LRCK
ESP32-GPIO22 ─────────────────────────────────────────► PCM-DIN
ESP32-GPIO4 ──────────────────────────────────────────► R330-A (LED Rojo)
ESP32-GPIO16 ─────────────────────────────────────────► R330-B (LED Verde)
ESP32-GPIO17 ─────────────────────────────────────────► R330-C (LED Azul)

═══════════════════════════════════════════════════════════════
                    PCM5102
═══════════════════════════════════════════════════════════════
PCM-VIN ──────────────────────────────────────────────► BUS-5V
PCM-GND ──────────────────────────────────────────────► BUS-GND
PCM-SCK ──────────────────────────────────────────────► BUS-GND
PCM-BCK ──────────────────────────────────────────────► ESP32-GPIO26
PCM-LRCK ─────────────────────────────────────────────► ESP32-GPIO25
PCM-DIN ──────────────────────────────────────────────► ESP32-GPIO22
PCM-3.3V ─────────────────────────────────────────────► (SIN CONEXIÓN)

═══════════════════════════════════════════════════════════════
                    LED RGB (KY-009)
═══════════════════════════════════════════════════════════════
LED-GND (cátodo) ─────────────────────────────────────► BUS-GND
LED-R ────────────────────────────────────────────────► R330-A (otro extremo)
LED-G ────────────────────────────────────────────────► R330-B (otro extremo)
LED-B ────────────────────────────────────────────────► R330-C (otro extremo)

═══════════════════════════════════════════════════════════════
                    RESISTENCIAS (330Ω)
═══════════════════════════════════════════════════════════════
R330-A: ESP32-GPIO4  ◄────[330Ω]────► LED-R
R330-B: ESP32-GPIO16 ◄────[330Ω]────► LED-G
R330-C: ESP32-GPIO17 ◄────[330Ω]────► LED-B

═══════════════════════════════════════════════════════════════
                    CAPACITORES (Opcional pero recomendado)
═══════════════════════════════════════════════════════════════
C1-100µF: BUS-5V ◄────[100µF]────► BUS-GND  (cerca ESP32)
C2-100nF: BUS-5V ◄────[100nF]────► BUS-GND  (cerca ESP32)
C3-10µF:  BUS-5V ◄────[10µF]─────► BUS-GND  (cerca PCM5102)
C4-100nF: BUS-5V ◄────[100nF]────► BUS-GND  (cerca PCM5102)
```

### Tabla Resumen de Conexiones (Ordenada por Destino)

| #   | Desde         | Hacia          | Tipo     | Verificado |
| :-- | :------------ | :------------- | :------- | :--------- |
| 1   | BAT1+         | BMS B+         | Potencia | ☐          |
| 2   | BAT2-         | BMS B-         | Potencia | ☐          |
| 3   | BAT1- / BAT2+ | BMS BM         | Balance  | ☐          |
| 4   | BMS P+        | DC-DC IN+      | Potencia | ☐          |
| 5   | BMS P-        | DC-DC IN-      | Potencia | ☐          |
| 6   | DC-DC OUT+    | BUS 5V         | Potencia | ☐          |
| 7   | DC-DC OUT-    | BUS GND        | Potencia | ☐          |
| 8   | BUS 5V        | ESP32 VIN      | Potencia | ☐          |
| 9   | BUS GND       | ESP32 GND      | Potencia | ☐          |
| 10  | BUS 5V        | PCM5102 VIN    | Potencia | ☐          |
| 11  | BUS GND       | PCM5102 GND    | Potencia | ☐          |
| 12  | BUS GND       | PCM5102 SCK    | Señal    | ☐          |
| 13  | ESP32 GPIO26  | PCM5102 BCK    | I2S      | ☐          |
| 14  | ESP32 GPIO25  | PCM5102 LRCK   | I2S      | ☐          |
| 15  | ESP32 GPIO22  | PCM5102 DIN    | I2S      | ☐          |
| 16  | BUS GND       | LED (-) Cátodo | LED      | ☐          |
| 17  | ESP32 GPIO4   | R330 → LED R   | LED      | ☐          |
| 18  | ESP32 GPIO16  | R330 → LED G   | LED      | ☐          |
| 19  | ESP32 GPIO17  | R330 → LED B   | LED      | ☐          |

**Total: 19 conexiones principales**

---

## Checklist Pre-Soldadura

- [ ] DC-DC ajustado a 5.0V (medir con multímetro)
- [ ] Jumpers del PCM5102 configurados (FLT-L, DEMP-L, XSMT-H, FMT-L)
- [ ] Resistencias 330Ω verificadas (medir con multímetro)
- [ ] Polaridad de baterías verificada
- [ ] Celdas 18650 con voltaje similar (diferencia < 0.1V)

## Checklist Post-Soldadura

- [ ] Continuidad de GND en todos los módulos
- [ ] Sin cortocircuito entre 5V y GND
- [ ] Voltaje en ESP32 VIN = 5.0V ± 0.1V
- [ ] Voltaje en PCM5102 VIN = 5.0V ± 0.1V
- [ ] LED enciende en cada color individualmente
- [ ] ESP32 arranca (LED onboard parpadea)

---

_Documento generado para HIOS BTDAC - HI Open Systems_
