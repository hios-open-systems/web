/**
 * Tools configuration
 * Central source of truth for tech stack data
 */

import React from 'react';

export type ToolCategory = 'software' | 'hardware';

export interface Tool {
    name: string;
    logo?: string;
    icon?: React.ReactNode;
    description: string;
    category: ToolCategory;
    usedFor: string;
    projectsUsing: number;
    url: string;
}

export const tools: Tool[] = [
    // Software
    {
        name: 'VS Code + PlatformIO',
        logo: '/images/tools/platformio.svg',
        description: 'IDE completo para desarrollo de firmware embebido.',
        category: 'software',
        usedFor: 'Desarrollo de firmware ESP32',
        projectsUsing: 2,
        url: 'https://platformio.org/',
    },
    {
        name: 'Next.js + TypeScript',
        logo: '/images/tools/nextjs.svg',
        description: 'Framework React para aplicaciones web modernas.',
        category: 'software',
        usedFor: 'Esta plataforma web',
        projectsUsing: 1,
        url: 'https://nextjs.org/',
    },
    {
        name: 'Jetpack Compose',
        logo: '/images/tools/jetpack-compose.svg',
        description: 'UI toolkit declarativo para Android.',
        category: 'software',
        usedFor: 'App de gestión Android',
        projectsUsing: 1,
        url: 'https://developer.android.com/jetpack/compose',
    },
    // Hardware
    {
        name: 'KiCad',
        logo: '/images/tools/kicad.svg',
        description: 'Suite de diseño electrónico open source.',
        category: 'hardware',
        usedFor: 'Esquemáticos y diseño de PCBs',
        projectsUsing: 2,
        url: 'https://www.kicad.org/',
    },
    {
        name: 'FreeCAD',
        logo: '/images/tools/freecad.svg',
        description: 'Modelado 3D paramétrico open source.',
        category: 'hardware',
        usedFor: 'Cases y partes mecánicas',
        projectsUsing: 1,
        url: 'https://www.freecad.org/',
    },
    {
        name: 'ESP Web Tools',
        logo: '/images/tools/espwebtools.svg',
        description: 'Flasheo de ESP32 directo desde el navegador.',
        category: 'hardware',
        usedFor: 'Programación sin cables',
        projectsUsing: 1,
        url: 'https://esphome.github.io/esp-web-tools/',
    },
    {
        name: 'ESPConnect',
        logo: '/images/tools/espconnect.svg',
        description: 'Herramienta web para configurar WiFi en ESP32/ESP8266.',
        category: 'hardware',
        usedFor: 'Configuración WiFi sin código',
        projectsUsing: 2,
        url: 'https://thelastoutpostworkshop.github.io/ESPConnect/',
    },
    {
        name: 'Ant Design',
        logo: '/images/tools/antd.svg',
        description: 'Sistema de diseño UI empresarial para React.',
        category: 'software',
        usedFor: 'Componentes UI de esta web',
        projectsUsing: 1,
        url: 'https://ant.design/',
    },
];

export type FilterType = 'all' | 'software' | 'hardware';
