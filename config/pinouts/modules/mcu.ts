import type { Breakout } from './breakout';

export const MCU_BREAKOUTS: Breakout[] = [
  {
    id: 'esp32-s3-devkitc-1',
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
      { name: '3V3', role: 'pwr33', to: 'salida del regulador a bordo (NO inyectar de afuera)', side: 'left' },
      { name: '5V', role: 'pwr5', to: 'entrada de alimentación (VBUS interno → AMS1117)', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      { name: 'IO1–IO10', role: 'adc', to: 'ADC1 — el único ADC usable con WiFi/BLE encendido', side: 'left' },
      { name: 'IO48', role: 'neo', to: 'LED RGB WS2812 integrado del DevKit', side: 'left' },
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
