import { MAX_SD_RIGHT_RESISTOR } from '../../lib/electronics/max98357.ts';
import type { BomItem } from '../../lib/hardware/model.ts';

/**
 * Listas de materiales transcritas de los README/guías de cada proyecto. Cada
 * fila nombra su fuente. Lo que ninguna fuente dice (part number exacto,
 * proveedor, precio, cantidad) queda vacío o en `null`: no se completa.
 */
const BTDAC_SRC = 'projects/btdac/README.md';
const SPK_SRC = 'projects/speaker/README.md';
const SPK_GUIDE = 'config/pinouts/speaker.ts';
const PAD_SRC = 'projects/pad/README.md';
const PAD_GUIDE = 'config/pinouts/pad.ts';
const NODE_SRC = 'projects/hios-node-ai/COMPONENTS.md';

const item = (qty: number | null, part: string, role: string, notes: string, source: string): BomItem => ({
  qty, part, role, notes, source,
});

export const HARDWARE_BOMS: Record<string, BomItem[]> = {
  btdac: [
    item(1, 'ESP32-WROOM-32 DevKit (38 pines)', 'MCU + BT/BLE/WiFi', 'dual-core, BT 4.2, 4MB flash', BTDAC_SRC),
    item(1, 'PCM5102A breakout (GY-PCM5102)', 'DAC I2S', 'SCK→GND (PLL interno); jumpers FLT=L DEMP=L XSMT=H FMT=L; pin 3.3V sin conectar', BTDAC_SRC),
    item(1, 'LM2596S con display', 'Regulador a 5.0V', 'ajustar a 5.0V antes de conectar', BTDAC_SRC),
    item(1, 'KY-009', 'LED RGB de estado', 'cátodo común, sin resistencias integradas', BTDAC_SRC),
    item(3, 'Resistencia 330Ω', 'Serie de cada color del LED', '', BTDAC_SRC),
    item(1, 'Cargador BMS 2S USB-C', 'Carga y protección del pack', 'BM al punto medio entre celdas', BTDAC_SRC),
    item(2, 'Celda 18650', 'Batería 2S', 'celdas con tensión similar (dif < 0.1V)', BTDAC_SRC),
    item(1, 'Portapilas 2× 18650 en serie', 'Soporte del pack', 'verificar configuración serie', BTDAC_SRC),
    item(1, 'Capacitor 100µF', 'Desacople cerca del VIN del ESP32', '', BTDAC_SRC),
    item(1, 'Capacitor 10µF', 'Desacople cerca del VIN del PCM5102', '', BTDAC_SRC),
    item(2, 'Capacitor 100nF', 'Desacople (uno por módulo)', 'cerca del ESP32 y del PCM5102', BTDAC_SRC),
    item(3, 'Piezas impresas 3D', 'Gabinete base, tapa, bandeja PCM5102', 'STL en public/downloads/btdac/', 'config/prints/btdacPrints.ts'),
  ],
  speaker: [
    item(1, 'ESP32 DevKit (WROOM-32)', 'Control, WiFi y Bluetooth', 'WiFi 2.4GHz', SPK_SRC),
    item(2, 'MAX98357 breakout', 'Amplificador I2S, uno por canal', 'canal elegido por SD: medir', SPK_SRC),
    item(2, 'Parlante 4–8Ω', 'Salida L y R', 'directo a los bornes del ampli (filterless)', SPK_SRC),
    item(1, 'LCD 16×2 + backpack I2C (PCF8574)', 'Estado, volumen y título', 'dirección 0x27 en el firmware; verificar niveles I2C', SPK_SRC),
    item(1, 'LM2596S con display', 'Regulador a 5.0V', 'buck ≥2–3A por los parlantes', SPK_GUIDE),
    item(1, 'Cargador y protección 2S USB-C', 'Carga del pack', '', SPK_SRC),
    item(2, 'Celda 18650', 'Batería 2S en serie', '', SPK_SRC),
    item(1, 'Portapilas 2× 18650 en serie', 'Soporte del pack', '', SPK_SRC),
    item(null, 'Resistencias divisor VBAT', 'Medición de batería en GPIO34', 'PENDIENTE: el 100k/100k del firmware no es apto para 2S; valores a definir', SPK_GUIDE),
    item(null, 'Resistencias de SD', 'Selección de canal L/R', 'valor según calculadora de SD y breakout', SPK_SRC),
    item(3, 'Piezas impresas 3D', 'Gabinete, bafle frontal, tapa posterior', 'STL en public/downloads/speaker/', 'config/prints/speakerPrints.ts'),
  ],
  pad: [
    item(1, 'ESP32-S3-DevKitC-1 N16R8', 'MCU', '16MB flash + 8MB PSRAM octal', PAD_SRC),
    item(1, 'Pantalla ILI9488 4" SPI 480×320', 'Display', 'si trae buffer 74HC245, VCC a 3V3', PAD_GUIDE),
    item(1, 'Encoder KY-040', 'Navegación', 'a 3V3', PAD_SRC),
    item(1, 'Joystick HW-504', 'Mouse / navegación', 'a 3V3 aunque el silk diga +5V', PAD_SRC),
    item(12, 'Pulsador NA', '10 teclas de acción + 2 ALT', '', PAD_SRC),
    item(10, 'Diodo 1N4148', 'Matriz 2×5 (uno por tecla)', 'cátodo hacia la FILA', PAD_SRC),
    item(2, 'MAX98357A breakout', 'Audio estéreo I2S', 'bus compartido', PAD_SRC),
    item(1, `Resistencia ${MAX_SD_RIGHT_RESISTOR / 1000}kΩ`, 'SD del ampli derecho → Vin', 'ejemplo a 5V sin pull-up en la placa; recalcular si el breakout trae uno', PAD_GUIDE),
    item(2, 'Parlante 4–8Ω', 'Salida L y R', 'ningún borne a GND', PAD_GUIDE),
    item(2, 'Placa WS2812B ×4 LEDs', 'Iluminación (8 píxeles)', 'encadenadas en GPIO9', PAD_SRC),
    item(1, 'Resistencia 330Ω', 'Serie en DIN de NeoPixel', '', PAD_SRC),
    item(1, 'Diodo 1N400x', 'Serie en VCC de NeoPixel (nivel lógico)', 'alternativa: 74AHCT125', PAD_GUIDE),
    item(1, 'Cargador BMS 2S USB-C', 'Carga y protección', '', PAD_SRC),
    item(2, 'Celda 18650', 'Batería 2S', '', PAD_SRC),
    item(1, 'LM2596S con display', 'Regulador a 5.0V', 'buck ≥3A', PAD_GUIDE),
    item(1, 'Interruptor SW-CELDAS', 'Corte general BAT+ → buck', '≥3A', PAD_GUIDE),
    item(1, 'Interruptor SW-PANTALLA', 'Corte del backlight (GPIO21 → LED)', 'nunca en el VCC de la pantalla', PAD_GUIDE),
    item(1, 'Capacitor 470–1000µF', 'Bulk en el riel 5V', '', PAD_GUIDE),
    item(1, 'Capacitor 1000µF', 'Reserva cerca de los amplis', '', PAD_GUIDE),
    item(7, 'Piezas impresas 3D', 'Carcasa, tapa, placa, marcos y soportes', 'STL en public/downloads/pad/', 'config/prints/padPrints.ts'),
  ],
  'speaker-test': [
    item(1, 'ESP32 clásico (no S3)', 'Sink Bluetooth A2DP', 'el S3 no tiene Bluetooth Classic', 'projects/speaker-test/README.md'),
    item(2, 'MAX98357A breakout', 'Amplificador I2S L y R', '', 'projects/speaker-test/README.md'),
    item(2, 'Parlante', 'Bajo prueba', '', 'projects/speaker-test/README.md'),
    item(1, 'Resistencia 100kΩ', 'SD → Vin del amp izquierdo', 'ajustar según breakout', 'projects/speaker-test/README.md'),
    item(1, 'Resistencia 220kΩ', 'SD → Vin del amp derecho', 'ajustar según breakout', 'projects/speaker-test/README.md'),
  ],
  'hios-node-ai': [
    item(1, 'ESP32-S3-DevKitC-1 (N16R8)', 'MCU', '', NODE_SRC),
    item(1, 'INMP441', 'Micrófono MEMS I2S', 'firmware aún no lo usa', NODE_SRC),
    item(1, 'MAX98357A', 'Amplificador I2S mono', 'firmware aún no lo usa', NODE_SRC),
    item(1, 'OLED 0.96" SSD1306 (I2C 0x3C)', 'Pantalla de estado', '', NODE_SRC),
    item(1, 'Pulsador 6×6', 'Botón PTT', '', NODE_SRC),
    item(1, 'LED 3mm difuso', 'Indicador de estado', '', NODE_SRC),
    item(1, 'Resistencia 330Ω', 'Serie del LED', '', NODE_SRC),
    item(1, 'Parlante 4Ω 3W (40mm)', 'Salida acústica', '', NODE_SRC),
    item(1, 'Cargador TP4056 USB-C', 'Carga de batería', '', NODE_SRC),
    item(1, 'Celda 18650', 'Alimentación', 'falta definir cómo se obtiene 5V', NODE_SRC),
    item(1, 'Capacitor 220µF', 'Desacople 5V cerca del MAX98357A', '', 'projects/hios-node-ai/PINOUT.md'),
  ],
};
