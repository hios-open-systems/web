import type { Breakout, BoardPin, BoardPinout, PinFunc } from './breakout';

const L = (text: string, func: PinFunc, primary = false) => ({ text, func, primary });
const P = (pos: number, ...labels: ReturnType<typeof L>[]): BoardPin => ({ pos, labels });

/**
 * ESP32-S3 DevKitC-1 — 44 pines (2 headers de 22: J1 izquierda, J3 derecha).
 *
 * Orden físico REAL del header, contando desde el borde del USB. Verificado contra
 * la tabla oficial de Espressif (esp-dev-kits, user_guide_v1.1, "Pin Layout").
 *
 * ⚠️ NO reordenar de memoria. Los GPIO no salen en orden numérico y la tentación de
 * "ordenarlos" rompe el único uso real de esta tabla: contar pines con la placa en
 * la mano. Si tocás esto, `npm run test:breakouts` compara contra la tabla oficial.
 *
 * Trampas que ya nos comimos una vez:
 *   · IO19/IO20 (USB) van en J3 abajo, NO en J1 — dibujarlos en J1 corre todo +2.
 *   · J1 termina en 5V + GND. J3 termina en GND + GND (no hay 5V en J3).
 *   · ADC1 = GPIO1–10 y NADA MÁS (es el único ADC usable con WiFi/BLE prendido).
 *     GPIO15–18 son ADC2, no ADC1.
 */
export const ESP32_S3_BOARD: BoardPinout = {
  usb: 'USB-C ×2 (UART + OTG nativo)',
  left: [
    P(1, L('3V3', 'power', true)),
    P(2, L('3V3', 'power', true)),
    P(3, L('RST', 'nc', true)),
    P(4, L('IO4', 'gpio', true), L('ADC1_3', 'adc'), L('T4', 'touch')),
    P(5, L('IO5', 'gpio', true), L('ADC1_4', 'adc'), L('T5', 'touch')),
    P(6, L('IO6', 'gpio', true), L('ADC1_5', 'adc'), L('T6', 'touch')),
    P(7, L('IO7', 'gpio', true), L('ADC1_6', 'adc'), L('T7', 'touch')),
    P(8, L('IO15', 'gpio', true), L('ADC2_4', 'adc')),
    P(9, L('IO16', 'gpio', true), L('ADC2_5', 'adc')),
    P(10, L('IO17', 'gpio', true), L('ADC2_6', 'adc')),
    P(11, L('IO18', 'gpio', true), L('ADC2_7', 'adc')),
    P(12, L('IO8', 'gpio', true), L('ADC1_7', 'adc'), L('T8', 'touch')),
    P(13, L('IO3', 'gpio', true), L('ADC1_2', 'adc'), L('T3', 'touch'), L('STRAP', 'strap')),
    P(14, L('IO46', 'gpio', true), L('STRAP', 'strap')),
    P(15, L('IO9', 'gpio', true), L('ADC1_8', 'adc'), L('T9', 'touch')),
    P(16, L('IO10', 'gpio', true), L('ADC1_9', 'adc'), L('T10', 'touch')),
    P(17, L('IO11', 'gpio', true), L('ADC2_0', 'adc'), L('T11', 'touch')),
    P(18, L('IO12', 'gpio', true), L('ADC2_1', 'adc'), L('T12', 'touch')),
    P(19, L('IO13', 'gpio', true), L('ADC2_2', 'adc'), L('T13', 'touch')),
    P(20, L('IO14', 'gpio', true), L('ADC2_3', 'adc'), L('T14', 'touch')),
    P(21, L('5V', 'power', true)),
    P(22, L('GND', 'gnd', true)),
  ],
  right: [
    P(1, L('GND', 'gnd', true)),
    P(2, L('IO43', 'gpio', true), L('TX0', 'uart')),
    P(3, L('IO44', 'gpio', true), L('RX0', 'uart')),
    P(4, L('IO1', 'gpio', true), L('ADC1_0', 'adc'), L('T1', 'touch')),
    P(5, L('IO2', 'gpio', true), L('ADC1_1', 'adc'), L('T2', 'touch')),
    P(6, L('IO42', 'gpio', true)),
    P(7, L('IO41', 'gpio', true)),
    P(8, L('IO40', 'gpio', true)),
    P(9, L('IO39', 'gpio', true)),
    P(10, L('IO38', 'gpio', true), L('RGB v1.1', 'rgb')),
    P(11, L('IO37', 'nc', true), L('PSRAM', 'nc')),
    P(12, L('IO36', 'nc', true), L('PSRAM', 'nc')),
    P(13, L('IO35', 'nc', true), L('PSRAM', 'nc')),
    P(14, L('IO0', 'gpio', true), L('BOOT', 'strap')),
    P(15, L('IO45', 'gpio', true), L('STRAP', 'strap')),
    P(16, L('IO48', 'gpio', true), L('RGB v1.0', 'rgb')),
    P(17, L('IO47', 'gpio', true)),
    P(18, L('IO21', 'gpio', true)),
    P(19, L('IO20', 'gpio', true), L('USB D+', 'usb')),
    P(20, L('IO19', 'gpio', true), L('USB D−', 'usb')),
    P(21, L('GND', 'gnd', true)),
    P(22, L('GND', 'gnd', true)),
  ],
};

/**
 * ESP32-WROOM-32 DevKit — 38 pines (2 headers de 19).
 */
export const ESP32_WROOM_BOARD: BoardPinout = {
  usb: 'micro-USB (CP2102 / CH340)',
  left: [
    P(1, L('3V3', 'power', true)),
    P(2, L('EN', 'strap', true)),
    P(3, L('IO36', 'gpio', true), L('ADC1_0', 'adc'), L('IN', 'in')),
    P(4, L('IO39', 'gpio', true), L('ADC1_3', 'adc'), L('IN', 'in')),
    P(5, L('IO34', 'gpio', true), L('ADC1_6', 'adc'), L('IN', 'in')),
    P(6, L('IO35', 'gpio', true), L('ADC1_7', 'adc'), L('IN', 'in')),
    P(7, L('IO32', 'gpio', true), L('ADC1_4', 'adc'), L('T9', 'touch')),
    P(8, L('IO33', 'gpio', true), L('ADC1_5', 'adc'), L('T8', 'touch')),
    P(9, L('IO25', 'gpio', true), L('DAC1', 'dac'), L('ADC2_8', 'adc')),
    P(10, L('IO26', 'gpio', true), L('DAC2', 'dac'), L('ADC2_9', 'adc')),
    P(11, L('IO27', 'gpio', true), L('ADC2_7', 'adc'), L('T7', 'touch')),
    P(12, L('IO14', 'gpio', true), L('HSPI_CLK', 'spi'), L('T6', 'touch')),
    P(13, L('IO12', 'gpio', true), L('HSPI_Q', 'spi'), L('BOOT', 'strap')),
    P(14, L('GND', 'gnd', true)),
    P(15, L('IO13', 'gpio', true), L('HSPI_D', 'spi'), L('T4', 'touch')),
    P(16, L('SD2', 'nc', true), L('flash', 'nc')),
    P(17, L('SD3', 'nc', true), L('flash', 'nc')),
    P(18, L('CMD', 'nc', true), L('flash', 'nc')),
    P(19, L('5V', 'power', true)),
  ],
  right: [
    P(1, L('GND', 'gnd', true)),
    P(2, L('IO23', 'gpio', true), L('VSPI_D', 'spi')),
    P(3, L('IO22', 'gpio', true), L('SCL', 'i2c')),
    P(4, L('IO1', 'gpio', true), L('TX0', 'uart')),
    P(5, L('IO3', 'gpio', true), L('RX0', 'uart')),
    P(6, L('IO21', 'gpio', true), L('SDA', 'i2c')),
    P(7, L('GND', 'gnd', true)),
    P(8, L('IO19', 'gpio', true), L('VSPI_Q', 'spi')),
    P(9, L('IO18', 'gpio', true), L('VSPI_CLK', 'spi')),
    P(10, L('IO5', 'gpio', true), L('VSPI_CS', 'spi'), L('STRAP', 'strap')),
    P(11, L('IO17', 'gpio', true), L('TX2', 'uart')),
    P(12, L('IO16', 'gpio', true), L('RX2', 'uart')),
    P(13, L('IO4', 'gpio', true), L('ADC2_0', 'adc'), L('T0', 'touch')),
    P(14, L('IO0', 'gpio', true), L('BOOT', 'strap'), L('T1', 'touch')),
    P(15, L('IO2', 'gpio', true), L('ADC2_2', 'adc'), L('T2', 'touch')),
    P(16, L('IO15', 'gpio', true), L('HSPI_CS', 'spi'), L('T3', 'touch')),
    P(17, L('SD1', 'nc', true), L('flash', 'nc')),
    P(18, L('SD0', 'nc', true), L('flash', 'nc')),
    P(19, L('CLK', 'nc', true), L('flash', 'nc')),
  ],
};


export const MCU_BREAKOUTS: Breakout[] = [
  {
    id: 'esp32-s3-devkitc-1',
    board: ESP32_S3_BOARD,
    name: 'ESP32-S3 DevKitC-1',
    kind: 'mcu',
    summary: 'MCU con USB OTG nativo, WiFi 6, BLE 5. Header 2×22. Referencia rápida + gotchas.',
    form: 'DevKitC-1 44-pin (N16R8)',
    iface: 'USB · UART · SPI · I2C · I2S · LCD',
    voltage: '3.3V lógica (5V por USB/pin 5V)',
    usedBy: ['pad'],
    datasheetUrl:
      'https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf',
    pins: [
      { name: '3V3', role: 'pwr33', to: 'salida del LDO a bordo (SGM2212-3.3, 800mA) — NO inyectar de afuera', side: 'left' },
      { name: '5V', role: 'pwr5', to: 'entrada de alimentación (VBUS o buck externo) → LDO → 3V3', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      { name: 'IO1–IO10', role: 'adc', to: 'ADC1 — el único ADC usable con WiFi/BLE encendido', side: 'left' },
      {
        name: 'IO38 o IO48',
        role: 'neo',
        to: 'LED RGB WS2812 integrado — **depende de la revisión**',
        side: 'left',
        note: 'v1.1 → IO38 · v1.0 → IO48. NUNCA es el IO39. Mirá la serigrafía de tu placa antes de usar cualquiera de los dos.',
      },
      {
        name: 'IO26–IO32',
        role: 'nc',
        to: 'flash SPI en-package — **NO usar**',
        side: 'right',
        note: 'reservados por la flash interna',
      },
      {
        name: 'IO33–IO37',
        role: 'nc',
        to: 'PSRAM octal (N16R8) — **NO usar**',
        side: 'right',
        note: 'en módulos con sufijo R8 la PSRAM se los come',
      },
      { name: 'IO19 / IO20', role: 'dim', to: 'USB nativo D−/D+ (HID) — reservado', side: 'right' },
      { name: 'IO43 / IO44', role: 'dim', to: 'UART0 TX/RX (serial + flasheo por cable)', side: 'right' },
      { name: 'IO0 / IO3 / IO45 / IO46', role: 'dim', to: 'strapping (boot) — evitar o usar con cuidado', side: 'right' },
      { name: 'demás IOxx', role: 'io', to: 'GPIO libre — I2C/SPI/I2S van por matriz flexible', side: 'right' },
    ],
    notes: [
      {
        title: 'PSRAM / flash no usables',
        body: 'En el **N16R8** la flash se queda con los GPIO **26–32** y la PSRAM octal con los **33–37**: no son usables. El datasheet genérico del S3 igual los lista.',
        warn: true,
      },
      {
        title: 'I2S/SPI/I2C son flexibles',
        body: 'El S3 tiene matriz de GPIO: **cualquier** pin libre sirve para I2S/SPI/I2C. No hay "el pin de I2S". Para ver cómo está cableado el pad, mirá su guía de build.',
      },
    ],
  },
  {
    id: 'esp32-wroom-32',
    board: ESP32_WROOM_BOARD,
    name: 'ESP32-WROOM-32 DevKit',
    kind: 'mcu',
    summary: 'MCU WiFi + BT 4.2, header 2×19 (38 pines). Referencia rápida + gotchas.',
    form: 'DevKit 38-pin',
    iface: 'UART · SPI · I2C · I2S · ADC · DAC',
    voltage: '3.3V lógica (5V por VIN/USB)',
    usedBy: ['btdac', 'speaker'],
    datasheetUrl:
      'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf',
    pins: [
      { name: '3V3', role: 'pwr33', to: 'salida del regulador', side: 'left' },
      { name: '5V / VIN', role: 'pwr5', to: 'entrada de alimentación', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      {
        name: 'IO34 / IO35 / IO36 / IO39',
        role: 'adc',
        to: '**solo entrada**: ni salida ni pull interno',
        side: 'left',
        note: 'input-only',
      },
      { name: 'IO25 / IO26', role: 'dac', to: 'DAC1 / DAC2 (salida analógica real 8-bit)', side: 'left' },
      { name: 'IO21 / IO22', role: 'i2c', to: 'SDA / SCL típicos', side: 'left' },
      { name: 'IO1 / IO3', role: 'dim', to: 'UART0 TX/RX (serial + flasheo)', side: 'right' },
      { name: 'IO6–IO11', role: 'nc', to: 'flash SPI en-package — **NO usar**', side: 'right' },
      { name: 'IO0 / IO2 / IO12 / IO15', role: 'dim', to: 'strapping — definen el boot', side: 'right' },
      { name: 'ADC2', role: 'adc', to: 'no se puede leer con WiFi activo (usá ADC1)', side: 'right' },
      { name: 'demás IOxx', role: 'io', to: 'GPIO libre', side: 'right' },
    ],
    notes: [
      {
        title: 'Pines solo-entrada',
        body: 'IO34/35/36/39 no tienen pull interno ni pueden ser salida. Útiles para leer sensores/ADC, no para manejar nada.',
        warn: true,
      },
      {
        title: 'ADC2 y WiFi',
        body: 'Los ADC2 no funcionan con WiFi encendido. Si necesitás ADC con WiFi, usá **ADC1** (IO32–39).',
      },
    ],
  },
];
