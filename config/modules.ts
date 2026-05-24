/**
 * Configuración de módulos y pinouts disponibles
 *
 * Inspirado en el trabajo de Luis Llamas (https://www.luisllamas.es/)
 * Referencia: https://www.luisllamas.es/en/esp32-hardware-details-pinout/
 */

export type ModuleCategory = 'microcontroller' | 'audio' | 'power' | 'amplifier';
export type ModuleCategoryFilter = 'all' | ModuleCategory;

export interface ModuleSpecs {
  voltage?: string;
  resolution?: string;
  features?: string[];
  interface?: string;
  package?: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  image?: string;
  htmlPath: string;
  datasheetUrl?: string;
  specs?: ModuleSpecs;
}

export const MODULES: Module[] = [
  {
    id: 'esp32-wroom-32',
    name: 'ESP32-WROOM-32',
    description: 'Microcontrolador 38 pines con WiFi, Bluetooth, ADC, DAC y Touch',
    category: 'microcontroller',
    image: '/esp32wroom.avif',
    htmlPath: '/pinouts/modules/esp32-wroom-32.html',
    datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf',
    specs: {
      voltage: '3.3V (5V vía USB)',
      features: ['WiFi 802.11 b/g/n', 'Bluetooth 4.2 BLE', 'Dual-core 240MHz', '520KB SRAM', '10 Touch', '18 ADC', '2 DAC'],
      interface: 'UART, SPI, I2C, I2S, PWM, ADC, DAC, Touch',
      package: 'DevKit 38-pin',
    },
  },
  {
    id: 'esp32s3',
    name: 'ESP32-S3 DevKitC',
    description: 'Microcontrolador con USB OTG nativo, WiFi 6, BLE 5 y aceleración AI',
    category: 'microcontroller',
    htmlPath: '/pinouts/modules/esp32s3.html',
    datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf',
    specs: {
      voltage: '3.3V',
      features: ['WiFi 6', 'Bluetooth 5 BLE', 'USB OTG nativo', 'Dual-core 240MHz', 'Vector AI', '14 Touch'],
      interface: 'USB OTG, UART, SPI, I2C, I2S, LCD, Camera',
      package: 'DevKitC-1 44-pin',
    },
  },
  {
    id: 'pcm5102',
    name: 'PCM5102 DAC',
    description: 'Convertidor Digital a Analógico de 32-bit/192kHz para audio de alta calidad',
    category: 'audio',
    htmlPath: '/pinouts/modules/pcm5102.html',
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/pcm5102.pdf',
    specs: {
      voltage: '3.3V - 5V',
      resolution: '32-bit / 192kHz',
      features: ['SNR 112dB', 'THD -93dB', 'Filtro digital integrado', 'Bajo consumo'],
      interface: 'I2S',
      package: 'TSSOP-20',
    },
  },
  {
    id: 'max98357',
    name: 'MAX98357 Amplifier',
    description: 'Amplificador I2S monofónico 3.2W con eficiencia >90%',
    category: 'amplifier',
    htmlPath: '/pinouts/modules/max98357.html',
    datasheetUrl: 'https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357A-MAX98357B.pdf',
    specs: {
      voltage: '2.5V - 5.5V',
      features: ['3.2W @ 4Ω', 'Eficiencia >90%', 'Sin componentes externos', 'Protección térmica'],
      interface: 'I2S',
      package: 'QFN-16',
    },
  },
  {
    id: 'lm2596',
    name: 'LM2596 Buck Converter',
    description: 'Regulador de voltaje step-down ajustable 3A',
    category: 'power',
    htmlPath: '/pinouts/modules/lm2596.html',
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/lm2596.pdf',
    specs: {
      voltage: '4.5V - 40V entrada, 1.2V - 37V salida',
      features: ['3A continuo', 'Eficiencia 73%', 'Frecuencia 150kHz', 'Protección térmica'],
      interface: 'DC-DC',
      package: 'TO-220 / TO-263',
    },
  },
];

export const CATEGORIES: Record<ModuleCategory, { label: string; color: string }> = {
  microcontroller: { label: 'Microcontrolador', color: '#3b82f6' },
  audio: { label: 'Audio DAC', color: '#10b981' },
  amplifier: { label: 'Amplificador', color: '#f59e0b' },
  power: { label: 'Alimentación', color: '#ef4444' },
};

export const MODULE_CATEGORIES = Object.keys(CATEGORIES) as ModuleCategory[];

/**
 * Helper para obtener módulos por categoría
 */
export const getModulesByCategory = (category: ModuleCategory): Module[] =>
  MODULES.filter((m) => m.category === category);

export const getModuleCategoryCounts = (modules: Module[] = MODULES) =>
  MODULE_CATEGORIES.reduce<Record<ModuleCategoryFilter, number>>(
    (counts, category) => ({
      ...counts,
      [category]: modules.filter((module) => module.category === category).length,
    }),
    { all: modules.length, microcontroller: 0, audio: 0, power: 0, amplifier: 0 },
  );

/**
 * Helper para buscar módulos por texto
 */
export const searchModules = (query: string): Module[] => {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return MODULES;

  return MODULES.filter(
    (m) =>
      m.name.toLowerCase().includes(normalizedQuery) ||
      m.description.toLowerCase().includes(normalizedQuery) ||
      m.id.toLowerCase().includes(normalizedQuery)
  );
};

export const filterModules = (
  modules: Module[],
  query: string,
  category: ModuleCategoryFilter,
): Module[] => {
  const normalizedQuery = query.toLowerCase().trim();

  return modules.filter((module) => {
    const matchesCategory = category === 'all' || module.category === category;
    const matchesQuery =
      !normalizedQuery ||
      module.name.toLowerCase().includes(normalizedQuery) ||
      module.description.toLowerCase().includes(normalizedQuery) ||
      module.id.toLowerCase().includes(normalizedQuery) ||
      module.specs?.interface?.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
};

/**
 * Atribución
 */
export const PINOUTS_ATTRIBUTION = {
  source: 'Luis Llamas',
  url: 'https://www.luisllamas.es/en/esp32-hardware-details-pinout/',
  description: 'Inspirado en los recursos de pinout de luisllamas.es',
};
