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
  rev: '—',
  mcu: 'ESP32-S3-DevKitC-1 (N16R8)',
  source: 'projects/hios-node-ai/PINOUT.md (firmware: src/main.cpp)',
  status: 'draft',
  warnings: [
    'NO ARMABLE TODAVÍA: PINOUT.md y src/main.cpp ponen OLED SCL en GPIO22, que no existe en el ESP32-S3 (GPIO 0–21 y 26–48). Hay que elegir otro pin y actualizar ambos.',
    'src/main.cpp solo usa botón (4), LED (2) e I2C (21/22). El micrófono INMP441 y el MAX98357A están documentados pero el firmware todavía no los usa.',
    'No está documentado cómo se obtiene el riel 5V desde una sola 18650 + TP4056 (3.0–4.2V). Falta definir regulación/boost.',
  ],
  modules: [
    { id: 'power', name: 'Energía', power: '18650 + TP4056 (USB-C) · el camino a 5V no está documentado' },
    { id: 'mic', name: 'Micrófono INMP441 (I2S)', power: 'VDD → 3V3 · GND → GND · L/R → GND (canal izquierdo)' },
    { id: 'amp', name: 'MAX98357A (I2S)', power: 'VIN → 5V · GND → GND · GAIN → GND', load: 'Parlante 4Ω 3W' },
    { id: 'oled', name: 'OLED SSD1306 0.96" (I2C 0x3C)', power: 'VCC → 3V3 · GND → GND' },
    { id: 'ui', name: 'Botón PTT + LED de estado', power: 'botón a GND · LED vía 330Ω a GND' },
  ],
  pins: [
    { gpio: 42, signal: 'I2S Mic SCK', module: 'mic', to: '→ SCK/BCLK del INMP441' },
    { gpio: 41, signal: 'I2S Mic WS', module: 'mic', to: '→ WS/LRC del INMP441' },
    { gpio: 40, signal: 'I2S Mic SD', module: 'mic', to: '← SD/DOUT del INMP441' },
    { gpio: 15, signal: 'I2S Amp BCLK', module: 'amp', to: '→ BCLK del MAX98357A' },
    { gpio: 16, signal: 'I2S Amp LRC', module: 'amp', to: '→ LRC del MAX98357A' },
    { gpio: 17, signal: 'I2S Amp DIN', module: 'amp', to: '→ DIN del MAX98357A' },
    { gpio: 21, signal: 'I2C SDA', module: 'oled', to: '→ SDA del OLED' },
    { gpio: 22, signal: 'I2C SCL', module: 'oled', to: '→ SCL del OLED', note: 'GPIO22 no existe en el ESP32-S3' },
    { gpio: 4, signal: 'Botón PTT', module: 'ui', to: '→ pulsador → GND (INPUT_PULLUP)' },
    { gpio: 2, signal: 'LED estado', module: 'ui', to: '→ 330Ω → LED → GND' },
  ],
  rails: [
    { name: '5V', connects: 'MAX98357A VIN · 220µF cerca del ampli' },
    { name: '3V3', connects: 'INMP441 VDD · OLED VCC' },
    { name: 'GND común', connects: 'todos los módulos' },
  ],
  checks: [
    'Resolver el pin de SCL (GPIO22 no existe en el S3) antes de soldar',
    'Definir y medir el riel 5V antes de conectar el MAX98357A',
    'Sin cortocircuito entre 5V y GND, y entre 3V3 y GND',
  ],
  sections: [],
};

export const HARDWARE_DESIGNS: HwDesign[] = [
  fromWiringGuide('btdac', BTDAC_WIRING),
  fromWiringGuide('speaker', SPEAKER_WIRING, [
    'El divisor de VBAT del firmware (100k/100k) NO es apto para 2S: a 8.4V entrega 4.2V sobre GPIO34. Rediseñalo y recalibrá antes de conectarlo.',
    'El canal L/R de cada MAX98357 lo elige su pin SD: medilo con la calculadora de SD, no lo asumas.',
  ]),
  fromWiringGuide('pad', PAD_WIRING),
  SPEAKER_TEST,
  NODE_AI,
];
