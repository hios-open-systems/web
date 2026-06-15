/**
 * Per-module pinout data. Pin maps verified against the existing module HTML
 * and the standard DevKit silkscreens. `primary` marks the canonical label
 * (rendered closest to the chip, larger).
 */

const C = {
  power: { key: 'power', label: 'Power', color: '#ef4444' },
  gnd: { key: 'gnd', label: 'GND', color: '#525252' },
  gpio: { key: 'gpio', label: 'GPIO', color: '#22c55e' },
  adc: { key: 'adc', label: 'ADC', color: '#ec4899' },
  touch: { key: 'touch', label: 'Touch', color: '#a855f7' },
  spi: { key: 'spi', label: 'SPI', color: '#06b6d4' },
  i2c: { key: 'i2c', label: 'I2C', color: '#8b5cf6' },
  i2s: { key: 'i2s', label: 'I2S', color: '#3b82f6' },
  uart: { key: 'uart', label: 'UART', color: '#eab308' },
  dac: { key: 'dac', label: 'DAC', color: '#f59e0b' },
  usb: { key: 'usb', label: 'USB', color: '#f97316' },
  boot: { key: 'boot', label: 'Boot/Strap', color: '#f97316' },
  strapping: { key: 'strapping', label: 'Strapping', color: '#f97316' },
  rgb: { key: 'rgb', label: 'RGB', color: '#14b8a6' },
  in: { key: 'in', label: 'Input-only', color: '#6b7280' },
  audio: { key: 'audio', label: 'Audio', color: '#10b981' },
  spkr: { key: 'spkr', label: 'Speaker', color: '#f59e0b' },
  vin: { key: 'vin', label: 'V-In', color: '#ef4444' },
  vout: { key: 'vout', label: 'V-Out', color: '#22c55e' },
  tip: { key: 'tip', label: 'Tip', color: '#38bdf8' },
  ring: { key: 'ring', label: 'Ring', color: '#8b5cf6' },
  sleeve: { key: 'sleeve', label: 'Sleeve', color: '#64748b' },
  mic: { key: 'mic', label: 'Mic', color: '#ec4899' },
  detect: { key: 'detect', label: 'Detect', color: '#f97316' },
};

const L = (text, type, primary = false) => ({ text, type, primary });
const P = (num, ...labels) => ({ num, labels });

/* ---------------- ESP32-WROOM-32 (38-pin DevKit) ---------------- */
const wroom = {
  id: 'esp32-wroom-32',
  title: 'ESP32-WROOM-32',
  badge: 'DevKit 38p',
  subtitle: '38 pines • Dual-core 240MHz • WiFi + BT 4.2 • 520KB SRAM • 18 ADC · 2 DAC · 10 Touch',
  chip: { type: 'mcu', name: 'ESP32', sub: 'WROOM-32', image: '/esp32wroom.avif' },
  categories: [C.power, C.gnd, C.gpio, C.adc, C.touch, C.spi, C.i2c, C.uart, C.dac, C.boot, C.in],
  left: [
    P(1, L('3V3', 'power', true)),
    P(2, L('EN', 'boot', true)),
    P(3, L('IN', 'in'), L('ADC1_0', 'adc'), L('IO36', 'gpio', true)),
    P(4, L('IN', 'in'), L('ADC1_3', 'adc'), L('IO39', 'gpio', true)),
    P(5, L('IN', 'in'), L('ADC1_6', 'adc'), L('IO34', 'gpio', true)),
    P(6, L('IN', 'in'), L('ADC1_7', 'adc'), L('IO35', 'gpio', true)),
    P(7, L('T9', 'touch'), L('ADC1_4', 'adc'), L('IO32', 'gpio', true)),
    P(8, L('T8', 'touch'), L('ADC1_5', 'adc'), L('IO33', 'gpio', true)),
    P(9, L('DAC1', 'dac'), L('ADC2_8', 'adc'), L('IO25', 'gpio', true)),
    P(10, L('DAC2', 'dac'), L('ADC2_9', 'adc'), L('IO26', 'gpio', true)),
    P(11, L('T7', 'touch'), L('ADC2_7', 'adc'), L('IO27', 'gpio', true)),
    P(12, L('HSPI_CLK', 'spi'), L('T6', 'touch'), L('IO14', 'gpio', true)),
    P(13, L('BOOT', 'boot'), L('HSPI_Q', 'spi'), L('IO12', 'gpio', true)),
    P(14, L('GND', 'gnd', true)),
    P(15, L('HSPI_D', 'spi'), L('T4', 'touch'), L('IO13', 'gpio', true)),
    P(16, L('Flash D2', 'nc', true)),
    P(17, L('Flash D3', 'nc', true)),
    P(18, L('Flash CMD', 'nc', true)),
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
    P(10, L('IO5', 'gpio', true), L('VSPI_CS', 'spi'), L('BOOT', 'boot')),
    P(11, L('IO17', 'gpio', true), L('TX2', 'uart')),
    P(12, L('IO16', 'gpio', true), L('RX2', 'uart')),
    P(13, L('IO4', 'gpio', true), L('ADC2_0', 'adc'), L('T0', 'touch')),
    P(14, L('IO0', 'gpio', true), L('T1', 'touch'), L('BOOT', 'boot')),
    P(15, L('IO2', 'gpio', true), L('ADC2_2', 'adc'), L('T2', 'touch')),
    P(16, L('IO15', 'gpio', true), L('HSPI_CS', 'spi'), L('T3', 'touch')),
    P(17, L('Flash D1', 'nc', true)),
    P(18, L('Flash D0', 'nc', true)),
    P(19, L('Flash CLK', 'nc', true)),
  ],
  info: [
    { color: C.in.color, title: 'Pines solo-entrada', html: '<code>IO34</code> <code>IO35</code> <code>IO36</code> <code>IO39</code> no tienen pull-up/down internos ni pueden ser salida.' },
    { color: C.boot.color, title: 'Strapping / Boot', html: '<code>IO0</code>, <code>IO2</code>, <code>IO12</code>, <code>IO15</code> definen el arranque. <code>IO0</code> a GND = modo flasheo.' },
    { color: C.dac.color, title: 'DAC', html: '<code>IO25</code> (DAC1) y <code>IO26</code> (DAC2): salida analógica real de 8-bit.' },
    { color: C.adc.color, title: 'ADC2 y WiFi', html: 'Los pines <code>ADC2</code> no se pueden leer mientras el WiFi está activo. Usá <code>ADC1</code> si necesitás ADC con WiFi.' },
  ],
};

/* ---------------- ESP32-S3 DevKitC-1 (44-pin) ---------------- */
const s3 = {
  id: 'esp32s3',
  title: 'ESP32-S3 DevKitC-1',
  badge: 'USB OTG',
  subtitle: '44 pines • Dual-core 240MHz • WiFi 6 + BLE 5 • 512KB SRAM • Vector AI',
  chip: { type: 'mcu', name: 'ESP32-S3', sub: 'WROOM-1' },
  categories: [C.power, C.gnd, C.gpio, C.adc, C.touch, C.spi, C.i2c, C.i2s, C.uart, C.usb, C.strapping, C.rgb],
  left: [
    P(1, L('3V3', 'power', true)),
    P(2, L('3V3', 'power', true)),
    P(3, L('RST', 'nc', true)),
    P(4, L('T4', 'touch'), L('ADC1_3', 'adc'), L('IO4', 'gpio', true)),
    P(5, L('T5', 'touch'), L('ADC1_4', 'adc'), L('IO5', 'gpio', true)),
    P(6, L('T6', 'touch'), L('ADC1_5', 'adc'), L('IO6', 'gpio', true)),
    P(7, L('T7', 'touch'), L('ADC1_6', 'adc'), L('IO7', 'gpio', true)),
    P(8, L('ADC1_7', 'adc'), L('IO15', 'gpio', true)),
    P(9, L('ADC2_5', 'adc'), L('IO16', 'gpio', true)),
    P(10, L('ADC2_6', 'adc'), L('IO17', 'gpio', true)),
    P(11, L('ADC2_7', 'adc'), L('IO18', 'gpio', true)),
    P(12, L('I2S', 'i2s'), L('T8', 'touch'), L('IO8', 'gpio', true)),
    P(13, L('USB D-', 'usb'), L('IO19', 'gpio', true)),
    P(14, L('USB D+', 'usb'), L('IO20', 'gpio', true)),
    P(15, L('I2S', 'i2s'), L('T3', 'touch'), L('IO3', 'gpio', true)),
    P(16, L('STRAP', 'strapping'), L('IO46', 'gpio', true)),
    P(17, L('BCLK', 'i2s'), L('T9', 'touch'), L('IO9', 'gpio', true)),
    P(18, L('WS', 'i2s'), L('T10', 'touch'), L('IO10', 'gpio', true)),
    P(19, L('DOUT', 'i2s'), L('T11', 'touch'), L('IO11', 'gpio', true)),
    P(20, L('DIN', 'i2s'), L('T12', 'touch'), L('IO12', 'gpio', true)),
    P(21, L('MCK', 'i2s'), L('T13', 'touch'), L('IO13', 'gpio', true)),
    P(22, L('T14', 'touch'), L('ADC2_3', 'adc'), L('IO14', 'gpio', true)),
  ],
  right: [
    P(1, L('GND', 'gnd', true)),
    P(2, L('IO43', 'gpio', true), L('TX0', 'uart')),
    P(3, L('IO44', 'gpio', true), L('RX0', 'uart')),
    P(4, L('IO1', 'gpio', true), L('ADC1_0', 'adc'), L('T1', 'touch')),
    P(5, L('IO2', 'gpio', true), L('ADC1_1', 'adc'), L('T2', 'touch')),
    P(6, L('IO42', 'gpio', true), L('MTMS', 'spi')),
    P(7, L('IO41', 'gpio', true), L('MTDI', 'spi')),
    P(8, L('IO40', 'gpio', true), L('MTDO', 'spi')),
    P(9, L('IO39', 'gpio', true), L('MTCK', 'spi')),
    P(10, L('IO38', 'gpio', true), L('FSPIWP', 'spi')),
    P(11, L('IO37', 'gpio', true), L('FSPIQ', 'spi')),
    P(12, L('IO36', 'gpio', true), L('FSPICLK', 'spi')),
    P(13, L('IO35', 'gpio', true), L('FSPID', 'spi')),
    P(14, L('IO0', 'gpio', true), L('BOOT', 'strapping')),
    P(15, L('IO45', 'gpio', true), L('STRAP', 'strapping')),
    P(16, L('IO48', 'gpio', true), L('RGB', 'rgb')),
    P(17, L('IO47', 'gpio', true)),
    P(18, L('IO21', 'gpio', true), L('SDA', 'i2c')),
    P(19, L('GND', 'gnd', true)),
    P(20, L('5V', 'power', true)),
    P(21, L('GND', 'gnd', true)),
    P(22, L('5V USB', 'power', true)),
  ],
  info: [
    { color: C.usb.color, title: 'USB OTG nativo', html: '<code>IO19</code> (D-) y <code>IO20</code> (D+) son USB nativo. No requiere chip USB externo.' },
    { color: C.i2s.color, title: 'I2S para audio', html: 'Recomendado: <code>IO9</code> BCLK, <code>IO10</code> WS, <code>IO11</code> DOUT, <code>IO12</code> DIN.' },
    { color: C.rgb.color, title: 'LED RGB integrado', html: '<code>IO48</code> controla el WS2812 del DevKit. Usar FastLED o NeoPixel.' },
    { color: C.strapping.color, title: 'Strapping', html: '<code>IO0</code> (boot), <code>IO45</code>, <code>IO46</code>. IO0 bajo = modo descarga.' },
  ],
};

/* ---------------- PCM5102 I2S DAC ---------------- */
const pcm5102 = {
  id: 'pcm5102',
  title: 'PCM5102 I2S DAC',
  badge: 'DAC 32-bit',
  subtitle: 'Conversor D/A 32-bit/384kHz • SNR 112dB • Filtro digital integrado',
  chip: { type: 'ic', name: 'PCM5102A', sub: 'TSSOP-20' },
  categories: [C.i2s, C.gnd, C.power, C.audio],
  left: [
    P(1, L('DIN', 'i2s', true)),
    P(2, L('BCK', 'i2s', true)),
    P(3, L('LRCK', 'i2s', true)),
    P(4, L('GND', 'gnd', true)),
    P(5, L('FLT', 'nc', true)),
    P(6, L('DEMP', 'nc', true)),
    P(7, L('XO', 'nc', true)),
    P(8, L('XI', 'nc', true)),
  ],
  right: [
    P(9, L('GND', 'gnd', true)),
    P(10, L('VREF', 'power', true)),
    P(11, L('OUTR', 'audio', true)),
    P(12, L('OUTL', 'audio', true)),
    P(13, L('GND', 'gnd', true)),
    P(14, L('AVDD', 'power', true)),
    P(15, L('DVDD', 'power', true)),
    P(16, L('GND', 'gnd', true)),
  ],
  info: [
    { color: C.i2s.color, title: 'Conexión I2S', html: '<code>DIN</code>=datos, <code>BCK</code>=bit clock, <code>LRCK</code>=word clock desde el MCU.' },
    { color: C.power.color, title: 'Alimentación', html: '<code>AVDD</code> y <code>DVDD</code> a 3.3V–5V. <code>VREF</code> con su capacitor de desacople.' },
    { color: '#333', title: 'Pines de config (FLT/DEMP/XO/XI)', html: 'Típicamente a GND. En breakouts suelen venir ya puenteados.' },
    { color: C.audio.color, title: 'Salida analógica', html: '<code>OUTL</code> / <code>OUTR</code>: línea analógica al amplificador o jack.' },
  ],
};

/* ---------------- MAX98357 I2S Amplifier ---------------- */
const max98357 = {
  id: 'max98357',
  title: 'MAX98357 I2S Amp',
  badge: '3.2W Class-D',
  subtitle: 'Amplificador Class-D I2S monofónico • 3.2W @ 4Ω • Eficiencia >90%',
  chip: { type: 'ic', name: 'MAX98357A', sub: 'QFN-16' },
  categories: [C.i2s, C.adc, C.gpio, C.gnd, C.power, C.spkr],
  left: [
    P(1, L('GAIN', 'adc', true)),
    P(2, L('DIN', 'i2s', true)),
    P(3, L('BCLK', 'i2s', true)),
    P(4, L('LRCLK', 'i2s', true)),
    P(5, L('SD', 'gpio', true)),
  ],
  right: [
    P(6, L('GND', 'gnd', true)),
    P(7, L('Vin', 'power', true)),
    P(8, L('OUT-', 'spkr', true)),
    P(9, L('OUT+', 'spkr', true)),
  ],
  info: [
    { color: C.power.color, title: 'Alimentación', html: '<code>Vin</code> de 2.5V a 5.5V. A 5V entrega los 3.2W nominales.' },
    { color: C.adc.color, title: 'GAIN', html: 'Sin conectar = 9dB. A GND = 12dB, a Vin = 15dB, vía resistor = 3/6dB.' },
    { color: C.gpio.color, title: 'SD (modo)', html: '<code>SD</code> también selecciona canal: izquierdo, derecho o (L+R)/2. Bajo = shutdown.' },
    { color: C.spkr.color, title: 'Salida de parlante', html: '<code>OUT+</code>/<code>OUT-</code> directo al parlante (4–8Ω). Salida en puente, no llevar a GND.' },
  ],
};

/* ---------------- LM2596 Buck Converter ---------------- */
const lm2596 = {
  id: 'lm2596',
  title: 'LM2596 Buck',
  badge: 'Step-Down 3A',
  subtitle: 'Regulador DC-DC reductor ajustable • 4.5–40V in • 1.2–37V out • 3A',
  chip: { type: 'buck', name: 'LM2596', sub: 'Step-Down' },
  categories: [C.vin, C.vout, C.gnd],
  left: [
    P(1, L('IN+', 'vin', true)),
    P(2, L('IN-', 'gnd', true)),
  ],
  right: [
    P(1, L('OUT+', 'vout', true)),
    P(2, L('OUT-', 'gnd', true)),
  ],
  info: [
    { color: C.vin.color, title: 'Entrada', html: '<code>IN+</code> 4.5V–40V DC. La entrada debe superar la salida deseada en ~1.5V.' },
    { color: C.vout.color, title: 'Salida ajustable', html: '<code>OUT+</code> 1.2V–37V vía potenciómetro. <strong>Ajustar y medir con multímetro ANTES de conectar carga.</strong>' },
    { color: C.gnd.color, title: 'Masa común', html: '<code>IN-</code> y <code>OUT-</code> son la misma masa. No aísla entrada de salida.' },
    { color: '#10b981', title: 'Eficiencia', html: 'Hasta ~92% a 150kHz. Térmica + sobrecorriente protegidas; añadir disipador a alta corriente.' },
  ],
};

/* ---------------- 3.5mm TRS Audio Jack ---------------- */
const trsJack = {
  id: 'audio-jack-trs',
  title: '3.5mm TRS Audio Jack',
  badge: 'Stereo',
  subtitle: 'Conector hembra estéreo • Tip=L • Ring=R • Sleeve=GND',
  chip: {
    type: 'connector',
    name: '3.5mm',
    sub: 'TRS Jack',
    segments: [
      { label: 'T', color: C.tip.color },
      { label: 'R', color: C.ring.color },
      { label: 'S', color: C.sleeve.color },
    ],
  },
  categories: [C.tip, C.ring, C.sleeve, C.audio, C.gnd, C.detect],
  left: [
    P(1, L('TIP', 'tip', true), L('Left', 'audio')),
    P(2, L('RING', 'ring', true), L('Right', 'audio')),
  ],
  right: [
    P(3, L('SLEEVE', 'sleeve', true), L('GND', 'gnd')),
    P(4, L('SW', 'detect', true), L('Detect', 'detect')),
  ],
  info: [
    { color: C.tip.color, title: 'Tip', html: 'Punta del conector. En audio estéreo suele llevar el canal izquierdo (<code>L</code>).' },
    { color: C.ring.color, title: 'Ring', html: 'Primer anillo. En TRS estéreo suele llevar el canal derecho (<code>R</code>).' },
    { color: C.sleeve.color, title: 'Sleeve', html: 'Cuerpo del conector. Referencia de masa o blindaje (<code>GND</code>).' },
    { color: C.detect.color, title: 'Switch opcional', html: 'Algunos jacks agregan un contacto de detección que abre/cierra al insertar el plug. No está presente en todos los modelos.' },
  ],
};

/* ---------------- 3.5mm TRRS CTIA Audio Plug ---------------- */
const trrsPlug = {
  id: 'audio-plug-trrs',
  title: '3.5mm TRRS Audio Plug',
  badge: 'CTIA',
  subtitle: 'Conector macho TRRS • Tip=L • Ring1=R • Ring2=GND • Sleeve=MIC',
  chip: {
    type: 'connector',
    name: '3.5mm',
    sub: 'TRRS Plug',
    segments: [
      { label: 'T', color: C.tip.color },
      { label: 'R1', color: C.ring.color },
      { label: 'R2', color: C.gnd.color },
      { label: 'S', color: C.mic.color },
    ],
  },
  categories: [C.tip, C.ring, C.sleeve, C.audio, C.gnd, C.mic],
  left: [
    P(1, L('TIP', 'tip', true), L('Left', 'audio')),
    P(2, L('RING 1', 'ring', true), L('Right', 'audio')),
  ],
  right: [
    P(3, L('RING 2', 'ring', true), L('GND', 'gnd')),
    P(4, L('SLEEVE', 'sleeve', true), L('MIC', 'mic')),
  ],
  info: [
    { color: C.tip.color, title: 'Tip / Ring 1', html: '<code>Tip</code> = canal izquierdo, <code>Ring 1</code> = canal derecho.' },
    { color: C.gnd.color, title: 'CTIA', html: 'En CTIA, <code>Ring 2</code> es masa y <code>Sleeve</code> es micrófono. Es el estándar común en celulares modernos.' },
    { color: C.mic.color, title: 'Micrófono', html: 'La línea <code>MIC</code> normalmente usa polarización desde el dispositivo. No conectar directo a una entrada de línea sin adaptar.' },
    { color: C.ring.color, title: 'OMTP', html: 'En OMTP se invierten <code>GND</code> y <code>MIC</code>. Si el micrófono no funciona, puede ser una diferencia de estándar.' },
  ],
};

export const MODULES = [wroom, s3, pcm5102, max98357, lm2596, trsJack, trrsPlug];
