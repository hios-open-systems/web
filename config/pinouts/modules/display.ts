import type { Breakout } from './breakout';

export const DISPLAY_BREAKOUTS: Breakout[] = [
  {
    id: 'ili9488',
    name: 'TFT ILI9488 4" (SPI)',
    kind: 'display',
    summary: 'Pantalla 480×320 por SPI. Alimentación, backlight y adaptación de niveles dependen de la variante del módulo.',
    form: 'módulo 4" SPI',
    iface: 'SPI',
    voltage: 'VCC según variante / lógica ESP32 3.3V',
    usedBy: ['pad'],
    datasheetUrl: 'https://www.buydisplay.com/download/ic/ILI9488.pdf',
    pins: [
      { name: 'VCC', role: 'pwr5', to: '5V en la variante del PAD con regulador; confirmar el rango de tu módulo antes de conectar' },
      { name: 'GND', role: 'gnd', to: 'masa común' },
      { name: 'CS', role: 'spi', to: 'chip-select' },
      { name: 'RESET', role: 'io', to: 'reset' },
      { name: 'DC', role: 'io', alt: 'RS', to: 'data/command' },
      { name: 'SDI', role: 'spi', alt: 'MOSI', to: 'datos MCU → TFT' },
      { name: 'SCK', role: 'spi', alt: 'SCL', to: 'clock SPI' },
      { name: 'LED', role: 'pwm', to: 'backlight / control de brillo (según módulo; ver nota)' },
      { name: 'SDO', role: 'nc', alt: 'MISO', to: 'NC (solo escribimos)', req: false },
      { name: 'T_CLK', role: 'spi', to: 'touch: clock (no usado en el pad)', req: false },
      { name: 'T_CS', role: 'spi', to: 'touch: chip-select (no usado en el pad)', req: false },
      { name: 'T_DIN', role: 'spi', to: 'touch: MOSI (no usado en el pad)', req: false },
      { name: 'T_DO', role: 'spi', to: 'touch: MISO (no usado en el pad)', req: false },
      { name: 'T_IRQ', role: 'io', to: 'touch: IRQ (no usado en el pad)', req: false },
    ],
    notes: [
      {
        title: 'Solo escritura',
        body: 'En el PAD, MISO (SDO) queda sin conectar (`TFT_MISO=-1`). El pin LED puede ser control lógico o alimentación del backlight según la placa: verificá el esquema y usá un driver si lleva corriente de carga. No alimentar el backlight directamente desde un GPIO.',
      },
      {
        title: 'Touch',
        body: 'El controlador de touch (T_CLK/T_CS/T_DIN/T_DO/T_IRQ) viene en el mismo header pero el pad no lo usa. Algunas unidades traen además ranura microSD en pines aparte.',
      },
    ],
  },
  {
    id: 'lcd1602-i2c',
    name: 'LCD 16×2 I2C (HD44780 + PCF8574)',
    kind: 'display',
    summary: 'Display de caracteres 16×2 con backpack I2C: solo 2 pines de datos.',
    form: 'LCD 1602 + backpack',
    iface: 'I2C',
    voltage: '5V',
    usedBy: ['speaker'],
    datasheetUrl: 'https://www.sparkfun.com/datasheets/LCD/HD44780.pdf',
    pins: [
      { name: 'VCC', role: 'pwr5', to: '5V', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      { name: 'SDA', role: 'i2c', to: 'datos I2C del MCU', side: 'left' },
      { name: 'SCL', role: 'i2c', to: 'clock I2C del MCU', side: 'left' },
    ],
    notes: [
      {
        title: 'Dirección I2C',
        body: 'PCF8574: **0x20–0x27**; PCF8574A: **0x38–0x3F**. A0/A1/A2 fijan la dirección. Escaneá el bus en vez de asumir 0x27.',
      },
      { title: 'Contraste', body: 'Potenciómetro azul en la cara de atrás del backpack.' },
      {
        title: 'I2C con ESP32',
        body: 'Muchos backpacks tienen pull-ups de SDA/SCL a **5V**. Usá un adaptador de nivel bidireccional entre el backpack de 5V y el ESP32 de 3.3V. No conectes líneas con pull-ups a 5V directamente al MCU.',
        warn: true,
      },
    ],
  },
];
