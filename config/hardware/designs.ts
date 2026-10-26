import { BTDAC_WIRING } from '../pinouts/btdac.ts';
import { PAD_WIRING } from '../pinouts/pad.ts';
import { SPEAKER_WIRING } from '../pinouts/speaker.ts';
import { fromWiringGuide } from '../../lib/hardware/model.ts';
import type { HwDesign } from '../../lib/hardware/model.ts';

/**
 * Diseños publicados como esquema + netlist + BOM en `projects/<slug>/hardware/`.
 *
 * btdac, speaker y pad salen de su guía de cableado, que `test:wiring` ya
 * verifica contra el firmware. speaker-test y hios-node-ai no tienen guía:
 * sus pines se transcriben acá y `test:hardware` los compara contra el código.
 * Nada de esto se completa a mano con valores "razonables": si una fuente no
 * lo dice, va como advertencia.
 */
const SPEAKER_TEST: HwDesign = {
  slug: 'speaker-test',
  title: 'Speaker Test',
  rev: '—',
  mcu: 'ESP32 (clásico, con Bluetooth Classic)',
  source: 'projects/speaker-test/src/tone_test.cpp + song.cpp',
  status: 'verified',
  warnings: [
    'Banco de pruebas: usa pines I2S distintos al Speaker final (BCLK=26, LRC=25, DIN=22 acá; 26/27/25 en el Speaker).',
    'Los valores de las resistencias de SD (100kΩ izquierdo, 220kΩ derecho) dependen del breakout: el README pide ajustarlas al probar.',
  ],
  modules: [
    { id: 'power', name: 'Energía', power: '5V (VIN/VBUS) del ESP32 → Vin de ambos amplis' },
    { id: 'audio', name: '2× MAX98357A (I2S)', power: 'Vin → 5V · GND → GND', load: '1 parlante por ampli, a sus bornes + / −' },
  ],
  pins: [
    { gpio: 22, signal: 'I2S DIN', module: 'audio', to: '→ DIN de AMBOS MAX98357A' },
    { gpio: 25, signal: 'I2S LRC', module: 'audio', to: '→ LRC de AMBOS MAX98357A' },
    { gpio: 26, signal: 'I2S BCLK', module: 'audio', to: '→ BCLK de AMBOS MAX98357A' },
  ],
  rails: [
    { name: '5V', connects: 'ESP32 VIN · Vin de los dos MAX98357A (no 3V3)' },
    { name: 'GND común', connects: 'ESP32 · los dos MAX98357A' },
  ],
  checks: [
    'Amplis alimentados desde 5V (VIN), no desde 3V3',
    'I2S en paralelo a los dos amplis: BCLK=26, LRC=25, DIN=22',
    'Amp izquierdo: 100kΩ entre SD y Vin · amp derecho: 220kΩ entre SD y Vin (ajustar según breakout)',
    'Cada parlante a los bornes + / − de su propio ampli',
  ],
  sections: [],
};

const NODE_AI: HwDesign = {
  slug: 'hios-node-ai',
  title: 'HIOS Node AI',
  rev: '1.0',
  mcu: 'ESP32-S3-DevKitC-1 (N16R8)',
  source: 'projects/hios-node-ai/src/main.cpp',
  status: 'verified',
  warnings: [
    'Diseño completo pero todavía no armado ni compilado: probalo módulo por módulo con la checklist antes de cerrar la caja.',
    'El micrófono queda cableado y reservado (GPIO40–42); el firmware aún no lo lee. Para voz hace falta además un servidor de transcripción en la PC: Ollama solo recibe texto.',
  ],
  modules: [
    { id: 'power', name: 'Energía 1S → 5V', power: '18650 → TP4056 con protección → SW1 → Pololu U3V40F5 (5V) → SS34 → pin 5V del DevKit · 5V del boost → MAX98357A' },
    { id: 'vbat', name: 'Medición de batería', power: 'divisor 100k/100k desde la salida del switch + 100nF a GND' },
    { id: 'mic', name: 'Micrófono INMP441 (I2S)', power: 'VDD → 3V3 · GND → GND · L/R → GND (canal izquierdo)' },
    { id: 'amp', name: 'MAX98357A (I2S)', power: 'VIN → 5V del boost · GND → GND · GAIN → GND (12 dB) · SD → VIN', load: 'Parlante 4Ω 3W a OUT+ / OUT− (ningún borne a GND)' },
    { id: 'oled', name: 'OLED SSD1306 0.96" (I2C 0x3C)', power: 'VCC → 3V3 · GND → GND' },
    { id: 'ui', name: 'Botón PTT + LED de estado', power: 'botón a GND · LED vía 330Ω a GND' },
  ],
  pins: [
    { gpio: 1, signal: 'VBAT ADC', module: 'vbat', to: '← punto medio del divisor 100k/100k (4.2V → 2.1V)' },
    { gpio: 42, signal: 'I2S Mic SCK', module: 'mic', to: '→ SCK del INMP441' },
    { gpio: 41, signal: 'I2S Mic WS', module: 'mic', to: '→ WS del INMP441' },
    { gpio: 40, signal: 'I2S Mic SD', module: 'mic', to: '← SD del INMP441' },
    { gpio: 15, signal: 'I2S Amp BCLK', module: 'amp', to: '→ BCLK del MAX98357A' },
    { gpio: 16, signal: 'I2S Amp LRC', module: 'amp', to: '→ LRC del MAX98357A' },
    { gpio: 17, signal: 'I2S Amp DIN', module: 'amp', to: '→ DIN del MAX98357A' },
    { gpio: 8, signal: 'I2C SDA', module: 'oled', to: '→ SDA del OLED' },
    { gpio: 9, signal: 'I2C SCL', module: 'oled', to: '→ SCL del OLED' },
    { gpio: 4, signal: 'Botón PTT', module: 'ui', to: '→ pulsador → GND (INPUT_PULLUP)' },
    { gpio: 2, signal: 'LED estado', module: 'ui', to: '→ 330Ω → ánodo del LED; cátodo → GND' },
  ],
  rails: [
    { name: 'BAT (3.0–4.2V)', connects: 'TP4056 OUT+ → SW1 → U3V40F5 VIN · divisor VBAT' },
    { name: '5V', connects: 'U3V40F5 VOUT → MAX98357A VIN + 220µF · U3V40F5 VOUT → SS34 → DevKit 5V (J1 pin 21)' },
    { name: '3V3', connects: 'LDO del DevKit (J1 pin 1) → INMP441 VDD · OLED VCC' },
    { name: 'GND común', connects: 'TP4056 OUT− · U3V40F5 GND · DevKit G · todos los módulos' },
  ],
  checks: [
    'Celda en B+/B− del TP4056 con la polaridad medida; nada conectado a OUT todavía',
    'U3V40F5 solo, con SW1 encendido: 5.0V ±4% en VOUT antes de conectar cargas',
    'R de 22kΩ entre EN y GND del U3V40F5 (corte ~3.06V)',
    'SS34 con el cátodo (raya) hacia el pin 5V del DevKit',
    'Sin cortocircuito entre 5V, 3V3, BAT y GND',
    'OLED en SDA=8 / SCL=9 y 3V3; aparece en 0x3C con un escáner I2C',
    'MAX98357A: VIN al 5V del boost, SD a VIN, GAIN a GND, parlante solo entre OUT+ y OUT−',
    'INMP441: L/R a GND, VDD a 3V3 (nunca a 5V)',
    'Tensión en GPIO1 ≈ mitad de la batería (≤2.1V)',
    'Para flashear por USB podés dejar SW1 encendido: el SS34 evita que el USB alimente el boost',
  ],
  powerChain: ['18650 (1S)', 'TP4056 + DW01A', 'SW1', 'U3V40F5 5V', 'SS34', 'DevKit 5V → LDO 3V3'],
  sections: [
    {
      title: 'Pines elegidos',
      tip: 'I2C en GPIO8/9: son los pines por defecto de Wire para el ESP32-S3 en Arduino (variants/esp32s3/pins_arduino.h). GPIO22 no existe en el S3 y GPIO26–37 los ocupa la flash/PSRAM octal del N16R8. Se evitan los pines de arranque 0, 3, 45 y 46, el USB (19/20), el UART0 (43/44) y GPIO38 (LED RGB de la placa v1.1). GPIO1 es ADC1: sigue midiendo con el WiFi encendido.',
      rows: [],
    },
    {
      title: 'Energía: carga, corte y boost',
      tip: 'Espressif documenta las fuentes del DevKit (USB, pin 5V, pin 3V3) como mutuamente excluyentes. El SS34 en serie hace que el boost y el USB no se peleen: con USB conectado, el diodo queda en inversa. El boost no corta la carga: si se deshabilita, la batería pasa directo a la salida (≤4.2V, seguro para el LDO y el ampli).',
      rows: [
        { pin: 'B+ / B−', name: 'TP4056', to: '← 18650 (+ / −) en portapilas' },
        { pin: 'OUT+', name: 'TP4056', to: '→ SW1 → VIN del U3V40F5 y arriba del divisor VBAT' },
        { pin: 'OUT−', name: 'TP4056', to: '→ GND común' },
        { pin: 'EN', name: 'U3V40F5', to: '→ 22kΩ → GND', note: 'R = 36.9 / (Vcorte − 1.38) kΩ: 22kΩ ≈ 3.06V' },
        { pin: 'VOUT', name: 'U3V40F5', to: '→ MAX98357A VIN y → ánodo SS34; cátodo → DevKit 5V' },
        { pin: 'GND', name: 'U3V40F5', to: '→ GND común' },
      ],
    },
    {
      title: 'Audio: MAX98357A',
      tip: 'GAIN a GND = 12 dB. SD a VIN deja el ampli encendido en canal izquierdo; el firmware manda el mismo sample en los dos slots, así suena con cualquier ajuste de SD. A 5V entrega hasta 3.2W en 4Ω: el parlante es de 3W, el firmware usa volumen moderado.',
      rows: [
        { pin: 'GAIN', name: 'Ganancia', to: '→ GND (12 dB)' },
        { pin: 'SD', name: 'Encendido / canal', to: '→ VIN' },
        { pin: '220µF', name: 'Reserva', to: 'entre VIN y GND, pegado al módulo' },
      ],
    },
  ],
};

export const HARDWARE_DESIGNS: HwDesign[] = [
  fromWiringGuide('btdac', BTDAC_WIRING),
  fromWiringGuide('speaker', SPEAKER_WIRING, [
    'El canal L/R de cada MAX98357 lo elige su pin SD: medilo con la calculadora de SD, no lo asumas.',
  ]),
  fromWiringGuide('pad', PAD_WIRING),
  SPEAKER_TEST,
  NODE_AI,
];
