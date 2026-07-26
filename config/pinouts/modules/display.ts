import type { Breakout } from './breakout';

export const DISPLAY_BREAKOUTS: Breakout[] = [
  {
    id: 'ili9488',
    name: 'TFT ILI9488 4" (SPI)',
    kind: 'display',
    summary: 'Pantalla 480×320 18-bit por SPI. Trae regulador y level-shifter (VCC a 5V).',
    form: 'módulo 4" SPI',
    iface: 'SPI',
    voltage: '5V (VCC) / lógica 3.3V',
    usedBy: ['pad'],
    datasheetUrl: 'https://www.buydisplay.com/download/ic/ILI9488.pdf',
    pins: [
      { name: 'VCC', role: 'pwr5', to: '5V (regulador + level-shifter a bordo)' },
      { name: 'GND', role: 'gnd', to: 'masa común' },
      { name: 'CS', role: 'spi', to: 'chip-select' },
      { name: 'RESET', role: 'io', to: 'reset' },
      { name: 'DC', role: 'io', alt: 'RS', to: 'data/command' },
      { name: 'SDI', role: 'spi', alt: 'MOSI', to: 'datos MCU → TFT' },
      { name: 'SCK', role: 'spi', alt: 'SCL', to: 'clock SPI' },
      { name: 'LED', role: 'pwm', to: 'backlight (PWM; la corriente sale de VCC)' },
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
        body: 'MISO (SDO) queda sin conectar (`TFT_MISO=-1`). El backlight LED se controla por PWM (LEDC).',
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
        body: 'Backpack PCF8574: dirección **0x27** (a veces 0x3F). Si no aparece, escaneá el bus.',
      },
      { title: 'Contraste', body: 'Potenciómetro azul en la cara de atrás del backpack.' },
    ],
  },
];
