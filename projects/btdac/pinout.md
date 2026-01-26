# HIOS BTDAC - Guía de Conexiones y Pinout

Este documento detalla el conexionado eléctrico entre los módulos del sistema HIOS BTDAC.

---

## 1. Sistema de Alimentación

El sistema opera con una tensión principal de **5V** regulada, proveniente del banco de baterías.

### Flujo de Energía

1. **Almacenamiento:** 2x Baterías 18650 en SERIE (7.4V a 8.4V).
2. **Carga y Protección:** Módulo BMS 2S conectado a las baterías.
3. **Regulación:** La salida del BMS alimenta la entrada del **DC-DC Step Down**.
4. **Distribución:** La salida del DC-DC se ajusta a **5.0V** y alimenta al ESP32 y al DAC.

| Origen                 | Destino         | Cable          | Nota                                     |
| :--------------------- | :-------------- | :------------- | :--------------------------------------- |
| **Batería +**          | **BMS B+**      | Rojo (Grueso)  | Conexión directa a celdas                |
| **Batería -**          | **BMS B-**      | Negro (Grueso) | Conexión directa a celdas                |
| **Punto Medio (3.7V)** | **BMS BM**      | Blanco/Otro    | Entre las dos baterías                   |
| **BMS P+**             | **DC-DC IN+**   | Rojo           | Salida protegida de batería              |
| **BMS P-**             | **DC-DC IN-**   | Negro          | Retorno protegido                        |
| **DC-DC OUT+**         | **ESP32 VIN**   | Rojo           | **Ajustar DC-DC a 5V antes de conectar** |
| **DC-DC OUT+**         | **DAC VIN**     | Rojo           | Alimentación paralela al DAC             |
| **DC-DC OUT-**         | **GND (Común)** | Negro          | Masa común para todo el sistema          |

---

## 2. Audio Digital (I2S) - ESP32 a PCM5102

Conexión mediante protocolo I2S estándar. El ESP32 actúa como maestro de datos, pero el DAC genera su propio reloj de sistema (SCK) a partir del reloj de bit (BCK).

### Tabla de Conexión

| Pin ESP32 (GPIO) | Pin Módulo PCM5102 | Función                                            |
| :--------------- | :----------------- | :------------------------------------------------- |
| **GND**          | **GND**            | Masa Común                                         |
| **VIN (5V)**     | **VIN**            | Alimentación (Misma que ESP32)                     |
| **GPIO 26**      | **BCK**            | Bit Clock (Reloj de Bit)                           |
| **GPIO 25**      | **LRCK**           | Word Select (Canal I/D)                            |
| **GPIO 22**      | **DIN**            | Data In (Datos de Audio)                           |
| **GND**          | **SCK**            | **IMPORTANTE:** Puente a Masa                      |
| -                | **3.3V**           | No conectar (Salida del regulador interno del DAC) |

### Consideraciones del Módulo PCM5102

Para el correcto funcionamiento en este modo (Internal PLL), se deben configurar los puentes (jumpers de soldadura) en la parte trasera del módulo amarillo/negro estándar:

1.  **Puentes del lado trasero (Solder Pads):**
    - **1. FLT (Filter):** Soldar a **L** (Low) -> Latencia Normal / Filtro de baja latencia.
    - **2. DEMP (De-emphasis):** Soldar a **L** (Low) -> Desactivado.
    - **3. XSMT (Mute):** Soldar a **H** (High) -> Unmute (Sonido activado).
    - **4. FMT (Format):** Soldar a **L** (Low) -> Formato I2S.

2.  **Configuración de Reloj (SCK):**
    - Conectar el pin **SCK** del conector frontal directamente a **GND**. Esto fuerza al chip a generar su propio reloj interno (System Clock) a partir del BCK.

---

## 3. Interfaz de Usuario (LED de Estado)

Se recomienda la inclusión del módulo **LED RGB KY-009** para indicar estados (e.g., "Esperando Conexión", "Conectado", "Batería Baja").

**¡ATENCIÓN!** El módulo KY-009 usualmente **NO TIENE resistencias** limitadoras. Es obligatorio agregar resistencias de 220Ω o 330Ω en serie con los pines R, G y B para no quemar el LED ni el pin del ESP32.

### Conexión LED RGB (Cátodo Común)

| Pin ESP32   | Componente Extra | Pin KY-009    | Función                               |
| :---------- | :--------------- | :------------ | :------------------------------------ |
| **GND**     | -                | **- (Menos)** | Cátodo Común / Masa                   |
| **GPIO 4**  | Resist. 330Ω     | **R**         | Canal Rojo (Batería Baja/Error)       |
| **GPIO 16** | Resist. 330Ω     | **G**         | Canal Verde (Conectado/Reproduciendo) |
| **GPIO 17** | Resist. 330Ω     | **B**         | Canal Azul (Esperando Bluetooth)      |

_Nota: Se eligieron GPIOs que no interfieren con el arranque (boot) ni con el I2S._

---

## 4. Resumen de Pines ESP32 (38 Pines)

| GPIO    | Función Asignada | Notas         |
| :------ | :--------------- | :------------ |
| **VIN** | Entrada 5V       | Desde DC-DC   |
| **GND** | Masa             | Común         |
| **22**  | Audio Data (DIN) | Protocolo I2S |
| **25**  | Audio LRCK       | Protocolo I2S |
| **26**  | Audio BCK        | Protocolo I2S |
| **4**   | LED Rojo         | Status        |
| **16**  | LED Verde        | Status        |
| **17**  | LED Azul         | Status        |

_El resto de los pines quedan libres para futuras expansiones (botones de volumen, play/pause, etc)._
