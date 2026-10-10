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
        description: 'Diseño de esquemas electrónicos y placas de circuito impreso.',
        category: 'software',
        usedFor: 'Esquemas y PCB',
        projectsUsing: 2,
        url: 'https://www.kicad.org/',
        recommended: true,
    },
    {
        name: 'FreeCAD',
        logo: '/images/tools/freecad.svg',
        description: 'Modelado 3D paramétrico de carcasas, soportes y piezas mecánicas.',
        category: 'software',
        usedFor: 'Diseño mecánico de piezas',
        projectsUsing: 1,
        url: 'https://www.freecad.org/',
        recommended: true,
    },
    {
        name: 'VS Code + PlatformIO',
        logo: '/images/tools/platformio.svg',
        description: 'Editor y herramientas para compilar, cargar y depurar firmware.',
        category: 'software',
        usedFor: 'Desarrollo de firmware ESP32',
        projectsUsing: 2,
        url: 'https://platformio.org/',
        recommended: true,
    },
    {
        name: 'Next.js + TypeScript',
        logo: '/images/tools/nextjs.svg',
        description: 'Framework y lenguaje utilizados para desarrollar la web de HIOS.',
        category: 'software',
        usedFor: 'Esta plataforma web',
        projectsUsing: 1,
        url: 'https://nextjs.org/',
        recommended: true,
    },
    {
        name: 'Jetpack Compose',
        logo: '/images/tools/jetpack-compose.svg',
        description: 'Biblioteca para desarrollar interfaces nativas de Android.',
        category: 'software',
        usedFor: 'App de gestión Android',
        projectsUsing: 1,
        url: 'https://developer.android.com/jetpack/compose',
        recommended: true,
    },
    {
        name: 'Ant Design',
        logo: '/images/tools/antd.svg',
        description: 'Componentes de interfaz para React: formularios, tablas, menús y botones.',
        category: 'software',
        usedFor: 'Interfaz de esta web',
        projectsUsing: 1,
        url: 'https://ant.design/',
        recommended: true,
    },
    {
        name: 'Audacity',
        description: 'Editor de audio multipista para grabar, recortar y analizar sonido.',
        category: 'software',
        usedFor: 'Edición y análisis de audio',
        projectsUsing: 1,
        url: 'https://www.audacityteam.org/download/',
        recommended: true,
    },
    {
        name: 'GIMP',
        description: 'Editor de imágenes para fotografías, gráficos y documentación.',
        category: 'software',
        usedFor: 'Edición de imágenes',
        projectsUsing: 1,
        url: 'https://www.gimp.org/downloads/',
        recommended: true,
    },
    {
        name: 'Krita',
        description: 'Ilustración y pintura digital para crear recursos gráficos.',
        category: 'software',
        usedFor: 'Ilustraciones y arte técnico',
        projectsUsing: 0,
        url: 'https://krita.org/en/download/',
        recommended: true,
    },
    {
        name: 'Wireshark',
        description: 'Captura e inspección del tráfico de red para revisar protocolos y conexiones.',
        category: 'software',
        usedFor: 'Diagnóstico de red',
        projectsUsing: 1,
        url: 'https://www.wireshark.org/download.html',
        recommended: true,
    },
    {
        name: 'Packet Tracer',
        description: 'Simulador de redes de Cisco para probar topologías y configuraciones.',
        category: 'software',
        usedFor: 'Simulaciones de red',
        projectsUsing: 0,
        url: 'https://www.netacad.com/courses/packet-tracer',
        recommended: true,
    },
    {
        name: 'Adobe Acrobat Reader',
        description: 'Lector de archivos PDF para consultar documentación y manuales.',
        category: 'software',
        usedFor: 'Lectura y revisión de PDF',
        projectsUsing: 1,
        url: 'https://get.adobe.com/reader/',
        recommended: true,
    },
    {
        name: 'ESP Web Tools',
        logo: '/images/tools/espwebtools.svg',
        description: 'Instalación de firmware en dispositivos ESP desde un navegador compatible con Web Serial.',
        category: 'hardware',
        usedFor: 'Carga de firmware por puerto serie',
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
    {
        name: 'UltiMaker Cura',
        description: 'Laminador para preparar modelos y generar instrucciones de impresión FDM.',
        category: 'software',
        usedFor: 'Laminado para impresión 3D',
        projectsUsing: 0,
        url: 'https://ultimaker.com/software/ultimaker-cura/',
        recommended: true,
    },
    {
        name: 'PrusaSlicer',
        description: 'Laminador para preparar modelos para impresión FDM y resina.',
        category: 'software',
        usedFor: 'Laminado para impresión 3D',
        projectsUsing: 0,
        url: 'https://www.prusa3d.com/page/prusaslicer_424/',
        recommended: true,
    },
    {
        name: 'OrcaSlicer',
        description: 'Laminador con herramientas de calibración y perfiles para impresoras 3D.',
        category: 'software',
        usedFor: 'Laminado y calibración 3D',
        projectsUsing: 0,
        url: 'https://github.com/SoftFever/OrcaSlicer',
        recommended: true,
    },
];

export type FilterType = 'all' | 'software' | 'hardware';
