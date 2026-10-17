# HIOS Node AI — Guía de Ensamblaje Paso a Paso

Esta guía describe el procedimiento de armado, soldadura y verificación de componentes para el nodo HIOS AI.

---

## Herramientas Necesarias

- Soldador de estaño (temperatura regulable ~350°C).
- Estaño con alma de resina 60/40 o 99/1 (lead-free).
- Malla desoldadora y flux en pasta/pen.
- Alicate de corte al ras.
- Multímetro digital con continuidad acústica.
- Cable de prototipado AWG24 o AWG26.

---

## Pasos de Armado

### Paso 1: Soldadura de Headers en ESP32-S3
Soldar las tiras de pines macho (headers) a la placa ESP32-S3-DevKitC-1. Asegurar que queden perfectamente perpendiculares al PCB utilizando una protoboard como guía durante la soldadura.

### Paso 2: Configuración del Micrófono INMP441
1. Soldar la tira de 6 pines al micrófono INMP441.
2. Hacer un puente directo entre el pin `L/R` y `GND` con una gota de estaño o cable corto. Esto configura el canal de audio primario en Izquierdo.

### Paso 3: Conexión del Bus I2C de la Pantalla OLED
Conectar los pines `VCC`, `GND`, `SDA` (GPIO 21) y `SCL` (GPIO 22) de la pantalla OLED SSD1306.

### Paso 4: Ensamble del Amplificador I2S MAX98357A y Parlante
1. Soldar los dos cables del parlante de 4Ω 3W a los bornes de salida `OUT+` y `OUT-` del módulo MAX98357A.
2. Conectar las líneas I2S de control: BCLK (GPIO 15), LRC (GPIO 16) y DIN (GPIO 17).

### Paso 5: Verificación Electrónica Previa a la Batería
Antes de conectar la batería Li-Ion 18650 o alimentar por USB:
1. Conectar el multímetro en modo **Continuidad**.
2. Medir entre la línea de `3V3` y `GND`. No debe haber pitido (resistencia > 1kΩ).
3. Medir entre la línea de `5V` y `GND`. No debe haber pitido.
