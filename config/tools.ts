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
    recommended?: boolean;
}

export const tools: Tool[] = [
    // Software
    {
        name: 'KiCad',
        logo: '/images/tools/kicad.svg',
        description: 'Suite EDA open source para esquematicos y diseno PCB profesional.',
        category: 'software',
        usedFor: 'Esquematicos y PCBs',
        projectsUsing: 2,
        url: 'https://www.kicad.org/',
        recommended: true,
    },
    {
        name: 'FreeCAD',
        logo: '/images/tools/freecad.svg',
        description: 'Modelado 3D parametrico para carcasas, soportes y mecanica.',
        category: 'software',
        usedFor: 'Diseno mecanico de piezas',
        projectsUsing: 1,
        url: 'https://www.freecad.org/',
        recommended: true,
    },
    {
        name: 'VS Code + PlatformIO',
        logo: '/images/tools/platformio.svg',
        description: 'Entorno principal para firmware embebido con toolchains reproducibles.',
        category: 'software',
        usedFor: 'Desarrollo de firmware ESP32',
        projectsUsing: 2,
        url: 'https://platformio.org/',
        recommended: true,
    },
    {
        name: 'Next.js + TypeScript',
        logo: '/images/tools/nextjs.svg',
        description: 'Base de la plataforma web HIOS y herramientas del workbench.',
        category: 'software',
        usedFor: 'Esta plataforma web',
        projectsUsing: 1,
        url: 'https://nextjs.org/',
        recommended: true,
    },
    {
        name: 'Jetpack Compose',
        logo: '/images/tools/jetpack-compose.svg',
        description: 'Toolkit declarativo para interfaces nativas Android.',
        category: 'software',
        usedFor: 'App de gestión Android',
        projectsUsing: 1,
        url: 'https://developer.android.com/jetpack/compose',
        recommended: true,
    },
    {
        name: 'Ant Design',
        logo: '/images/tools/antd.svg',
        description: 'Sistema de componentes UI para React con alto nivel de consistencia.',
        category: 'software',
        usedFor: 'Componentes UI de esta web',
        projectsUsing: 1,
        url: 'https://ant.design/',
        recommended: true,
    },
    {
        name: 'Audacity',
        description: 'Editor de audio multi-pista libre para pruebas, cortes y analisis rapido.',
        category: 'software',
        usedFor: 'Edicion y analisis de audio',
        projectsUsing: 1,
        url: 'https://www.audacityteam.org/download/',
        recommended: true,
    },
    {
        name: 'GIMP',
        description: 'Editor de imagen open source para recursos visuales y documentacion.',
        category: 'software',
        usedFor: 'Edicion grafica de recursos',
        projectsUsing: 1,
        url: 'https://www.gimp.org/downloads/',
        recommended: true,
    },
    {
        name: 'Krita',
        description: 'Ilustracion y pintura digital para assets e interfaces de proyecto.',
        category: 'software',
        usedFor: 'Ilustraciones y arte tecnico',
        projectsUsing: 0,
        url: 'https://krita.org/en/download/',
        recommended: true,
    },
    {
        name: 'Wireshark',
        description: 'Inspeccion de trafico de red para depurar protocolos y conectividad.',
        category: 'software',
        usedFor: 'Diagnostico de red',
        projectsUsing: 1,
        url: 'https://www.wireshark.org/download.html',
        recommended: true,
    },
    {
        name: 'Packet Tracer',
        description: 'Simulador de redes de Cisco para validar topologias y escenarios.',
        category: 'software',
        usedFor: 'Simulaciones de red',
        projectsUsing: 0,
        url: 'https://www.netacad.com/courses/packet-tracer',
        recommended: true,
    },
    {
        name: 'Adobe Acrobat Reader',
        description: 'Lector PDF oficial para revisar documentacion tecnica y manuales.',
        category: 'software',
        usedFor: 'Lectura y revision de PDFs',
        projectsUsing: 1,
        url: 'https://get.adobe.com/reader/',
        recommended: true,
    },
    {
        name: 'ESP Web Tools',
        logo: '/images/tools/espwebtools.svg',
        description: 'Flasheo de ESP32 directo desde el navegador sin instalar utilidades extra.',
        category: 'hardware',
        usedFor: 'Programación sin cables',
        projectsUsing: 1,
        url: 'https://esphome.github.io/esp-web-tools/',
        recommended: true,
    },
    {
        name: 'ESPConnect',
        logo: '/images/tools/espconnect.svg',
        description: 'Herramienta web para configurar WiFi en ESP32/ESP8266.',
        category: 'hardware',
        usedFor: 'Configuración WiFi sin código',
        projectsUsing: 2,
        url: 'https://thelastoutpostworkshop.github.io/ESPConnect/',
        recommended: true,
    },
];

export type FilterType = 'all' | 'software' | 'hardware';
