/**
 * Project configuration
 * Central source of truth for project data
 */

export interface ProjectStats {
    tutorials?: number;
    commits?: number;
    files?: number;
}

export interface Project {
    slug: string;
    name: string;
    description: string;
    tagline?: string;
    status: 'prototype' | 'concept' | 'wip';
    image: string;
    learnings?: string[];
    breakthrough?: string;
    stats?: ProjectStats;
}

export const projects: Project[] = [
    {
        slug: 'btdac',
        name: 'BTDAC',
        tagline: 'Cuando finalmente sonó, grité a las 2am.',
        description: 'Bluetooth audio receiver con DAC PCM5102 y ESP32. Funciona. Suena bien. Tardé 3 semanas.',
        status: 'prototype',
        image: '/images/btdac/build/20260125_180730.jpg',
        learnings: ['I2S audio', 'Fuente partida', 'ESP32 Bluetooth A2DP'],
        breakthrough: 'El momento en que salió sonido limpio en lugar de ruido fue increíble.',
        stats: {
            tutorials: 3,
            files: 12,
        },
    },
    {
        slug: 'pad',
        name: 'HIOS PAD',
        description: 'Macropad ESP32-S3 con pantalla, encoder y joystick: teclado/mouse/multimedia HID por USB, BLE y WiFi, con capas por contexto navegables desde la pantalla.',
        status: 'prototype',
        image: '/images/pad/build/hero.jpg',
        learnings: ['BLE HID (NimBLE)', 'TinyUSB HID', 'FreeRTOS dual-core', 'UI con TFT_eSprite'],
    },
    {
        slug: 'speaker',
        name: 'WiFi Speaker',
        description: 'Parlante WiFi con ESP32, amplificador I2S MAX98357 y control via web.',
        status: 'wip',
        image: '/images/speaker/modules/Max98357.png',
        learnings: ['I2S audio', 'WiFi streaming', 'Web server ESP32'],
        stats: {
            tutorials: 5,
            files: 8,
        },
    },
];

export const statusConfig = {
    prototype: {
        color: 'green',
        glow: true,
    },
    concept: {
        color: 'blue',
        glow: false,
    },
    wip: {
        color: 'orange',
        glow: false,
    },
} as const;

export type ProjectStatus = keyof typeof statusConfig;
