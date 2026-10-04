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
        tagline: "Receptor de audio Bluetooth",
        description: "Receptor de audio Bluetooth con ESP32 y DAC PCM5102. Entrega audio estéreo por salida de línea y permite solicitar tonos de prueba desde una app Android.",
        status: 'prototype',
        image: '/images/btdac/build/20260125_180730.jpg',
        learnings: ["Audio I2S","Bluetooth A2DP","Control por BLE"],
        stats: {
            tutorials: 3,
            files: 12,
        },
    },
    {
        slug: 'pad',
        name: 'HIOS PAD',
        description: "Control programable con teclas, encoder, joystick y pantalla. Permite organizar atajos en capas, usar teclado y mouse por USB o Bluetooth y editar la configuración desde una interfaz web.",
        status: 'prototype',
        image: '/images/pad/pad-1-overview.jpg',
        learnings: ["ESP32-S3","USB y Bluetooth HID","Editor web","Companion para PC"],
    },
    {
        slug: 'speaker',
        name: 'WiFi Speaker',
        description: "Proyecto de parlante con ESP32, recepción de audio por WiFi y Bluetooth, amplificación I2S y control desde una interfaz web. En desarrollo.",
        status: 'wip',
        image: '/images/speaker/modules/Max98357.png',
        learnings: ["Audio I2S","WiFi","Bluetooth A2DP","Control web"],
        stats: {
            tutorials: 5,
            files: 8,
        },
    },
    {
        slug: 'hios-node-ai',
        name: 'HIOS Node AI',
        tagline: "Consultas a IA desde un ESP32-S3",
        description: "Prototipo con ESP32-S3 que envía una consulta de texto a Ollama al pulsar un botón y muestra la respuesta en una pantalla OLED. Requiere un servidor en la red local.",
        status: 'prototype',
        image: '/images/pad/pad-1-overview.jpg',
        learnings: ["ESP32-S3","Ollama por HTTP","Pantalla OLED","FreeRTOS"],
        stats: {
            tutorials: 2,
            files: 6,
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
