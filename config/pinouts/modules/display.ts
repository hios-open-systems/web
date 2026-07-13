import type { Breakout } from './breakout';

export const DISPLAY_BREAKOUTS: Breakout[] = [
  {
    id: 'ili9488',
    name: 'TFT ILI9488 3.5" (SPI)',
    kind: 'display',
    summary: 'Pantalla 480×320 18-bit por SPI. Trae regulador y level-shifter (VCC a 5V).',
    form: 'módulo 3.5" SPI',
    iface: 'SPI',
    voltage: '5V (VCC) / lógica 3.3V',
    usedBy: ['pad'],
    datasheetUrl: 'https://www.buydisplay.com/download/ic/ILI9488.pdf',
    pins: [
      { name: 'VCC', role: 'pwr5', to: '5V (regulador + level-shifter a bordo)', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      { name: 'CS', role: 'spi', to: 'chip-select', side: 'left' },
      { name: 'RESET', role: 'io', to: 'reset', side: 'left' },
      { name: 'DC', role: 'io', alt: 'RS', to: 'data/command', side: 'left' },
      { name: 'SDI', role: 'spi', alt: 'MOSI', to: 'datos MCU → TFT', side: 'right' },
      { name: 'SCK', role: 'spi', alt: 'SCL', to: 'clock SPI', side: 'right' },
      { name: 'LED', role: 'pwm', to: 'backlight (PWM; la corriente sale de VCC)', side: 'right' },
      { name: 'SDO', role: 'nc', alt: 'MISO', to: 'NC (solo escribimos)', side: 'right', req: false },
    ],
    notes: [
      {
        title: 'Solo escritura',
        body: 'MISO (SDO) queda sin conectar (`TFT_MISO=-1`). El backlight LED se controla por PWM (LEDC).',
      },
      {
        title: 'Touch y microSD',
        body: 'El módulo suele traer también touch (T_CLK/T_CS/T_DIN/T_DO/T_IRQ) y ranura microSD en otro header — no se usan en el pad.',
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
