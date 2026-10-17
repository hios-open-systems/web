import fs from 'fs';
import path from 'path';
import { projects as projectCatalog } from '../config/projects.ts';

export interface FirmwareSnippet {
    path: string;
    title: string;
    role: string;
    language: string;
    lines: number;
    code: string;
    githubUrl: string;
}

export interface ProjectMeta {
    slug: string;
    name: string;
    description: string;
    status: 'prototype' | 'concept' | 'wip';
    images: string[];
    readme: string;
    files: {
        name: string;
        path: string;
        type: 'pdf' | 'md' | 'code' | 'other';
    }[];
    technicalAssets: {
        name: string;
        path: string | null;
        githubUrl: string | null;
        ext: string;
        kind: '3d' | 'cad' | 'pcb' | 'doc' | 'firmware' | 'data' | 'other';
        source: 'project' | 'download';
    }[];
    firmwareFiles: FirmwareSnippet[];
    docs: string[];
}

const projectsDir = path.join(process.cwd(), 'projects');
const publicDir = path.join(process.cwd(), 'public');
const GITHUB_BLOB_BASE = 'https://github.com/hios-open-systems/web/blob/main/projects';

const SKIP_DIRS = new Set(['pics', 'node_modules', '.git', '.pio', 'dist', 'build', '.gradle', 'res', 'backup']);
const SKIP_FILES = new Set([
    'package-lock.json',
    '.gitignore',
    'tsconfig.json',
    'proyect..md',
    'print.md',
    'settings.gradle.kts',
    'build.gradle.kts',
]);

function walkFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) {
                files.push(...walkFiles(path.join(dir, entry.name)));
            }
            continue;
        }
        if (!SKIP_FILES.has(entry.name)) {
            files.push(path.join(dir, entry.name));
        }
    }
    return files;
}

function classifyAsset(ext: string): ProjectMeta['technicalAssets'][number]['kind'] {
    const normalized = ext.toLowerCase();
    if (['stl', 'obj', 'step', 'stp', '3mf', 'gltf', 'glb'].includes(normalized)) return '3d';
    if (['fcstd', 'iges', 'igs', 'dwg', 'dxf'].includes(normalized)) return 'cad';
    if (['kicad_pcb', 'kicad_sch', 'kicad_pro', 'sch', 'brd'].includes(normalized)) return 'pcb';
    if (['md', 'pdf', 'txt', 'doc', 'docx'].includes(normalized)) return 'doc';
    if (['ino', 'c', 'cpp', 'h', 'hpp', 'py', 'json', 'yaml', 'yml', 'ini', 'ts', 'kt', 'sh', 'mjs', 'ahk', 'ps1'].includes(normalized)) return 'firmware';
    if (['csv', 'log'].includes(normalized)) return 'data';
    return 'other';
}

const FIRMWARE_HIGHLIGHTS: Record<string, { path: string; title: string; role: string; language: string }[]> = {
    pad: [
        { path: 'src/ui/Skins.cpp', title: 'Skins.cpp', role: 'Dashboard RGB565: header, grilla 2×5 con pozos de icono y barra inferior de 4 cajas', language: 'cpp' },
        { path: 'src/ui/IconKit.h', title: 'IconKit.h', role: 'Motor de glifos vectoriales aditivos (~18 px) para las 16 capas y menús', language: 'cpp' },
        { path: 'src/ui/Layout.h', title: 'Layout.h', role: 'Geometría 480×320: grilla 2×5 (84×100 px) y 4 segmentos inferiores (ENC, COMP, STICK, VOL)', language: 'cpp' },
        { path: 'src/ui/Menu.cpp', title: 'Menu.cpp', role: 'Centro de Control a pantalla completa (6 grupos × 9 tiles + selector de tema y acento)', language: 'cpp' },
        { path: 'src/ui/monitor.cpp', title: 'monitor.cpp', role: '4 vistas de telemetría de PC (General, Red, Núcleos, Disco) con sparklines de 56 muestras', language: 'cpp' },
        { path: 'src/main.cpp', title: 'main.cpp', role: 'Bucle principal: matriz 2×5 + ALT, joystick HW-504, encoder KY-040 y dispatcher HID/WiZ', language: 'cpp' },
        { path: 'src/storage/DefaultConfig.cpp', title: 'DefaultConfig.cpp', role: 'Definición de las 16 capas por defecto, macros multi-paso y textos rápidos', language: 'cpp' },
        { path: 'platformio.ini', title: 'platformio.ini', role: 'Configuración ESP32-S3 N16R8 (16 MB Flash, PSRAM OPI, TFT_eSPI ILI9488 27 MHz)', language: 'ini' },
        { path: 'flash-ota.sh', title: 'flash-ota.sh', role: 'Actualización OTA autenticada con soporte nativo para Linux y puente WSL2', language: 'bash' },
    ],
    btdac: [
        { path: 'src/HIOS_BTDAC.ino', title: 'HIOS_BTDAC.ino', role: 'Firmware completo ESP32: receptor Bluetooth A2DP (I2S 32-bit a PCM5102), servidor GATT BLE (tone:) y LED RGB', language: 'cpp' },
        { path: 'platformio.ini', title: 'platformio.ini', role: 'Configuración ESP32-WROOM-32 con partición huge_app.csv y librería ESP32-A2DP', language: 'ini' },
        { path: 'android/app/src/main/java/dev/hios/btdac/data/ble/BleManager.kt', title: 'BleManager.kt', role: 'Cliente BLE Android (Kotlin): escaneo filtrado por UUID, conexión GATT y escritura de comandos tone:', language: 'kotlin' },
        { path: 'android/app/src/main/java/dev/hios/btdac/ui/ToolsScreen.kt', title: 'ToolsScreen.kt', role: 'UI Jetpack Compose del generador de tonos DSP (20 Hz – 20 kHz y frecuencias de referencia)', language: 'kotlin' },
        { path: 'android/app/src/main/java/dev/hios/btdac/viewmodel/MainViewModel.kt', title: 'MainViewModel.kt', role: 'ViewModel MVVM de estado de conexión Bluetooth y control de pruebas de audio', language: 'kotlin' },
        { path: 'tests/HIOS_BTDAC_minimal_test.ino', title: 'HIOS_BTDAC_minimal_test.ino', role: 'Firmware mínimo de validación de hardware y bus I2S', language: 'cpp' },
    ],
    speaker: [
        { path: 'src/main.ino', title: 'main.ino', role: 'Firmware multimodo ESP32: Radio WiFi, Streaming HTTP, Bluetooth A2DP, Web Server y LCD 16×2 I2C', language: 'cpp' },
        { path: 'platformio.ini', title: 'platformio.ini', role: 'Configuración de compilación y librerías I2S (ESP32-audioI2S, ESP32-A2DP, ESPAsyncWebServer)', language: 'ini' },
        { path: 'testbench/firmware/01_power_i2s_smoke.ino', title: '01_power_i2s_smoke.ino', role: 'Diagnóstico DMA I2S directo a MAX98357A a 44.1 kHz sin librerías externas', language: 'cpp' },
        { path: 'testbench/firmware/02_channel_check_lr.ino', title: '02_channel_check_lr.ino', role: 'Comprobación de balance y separación estéreo L/R (440 Hz canal izquierdo / 660 Hz derecho)', language: 'cpp' },
        { path: 'tests/test_basic.ino', title: 'test_basic.ino', role: 'Prueba de diagnóstico de amplificadores MAX98357A y pantalla LCD I2C', language: 'cpp' },
    ],
    'hios-node-ai': [
        { path: 'src/main.cpp', title: 'main.cpp', role: 'Firmware FreeRTOS Dual-Core ESP32-S3: tarea HTTP hacia /api/chat de Ollama + pantalla OLED SSD1306', language: 'cpp' },
        { path: 'platformio.ini', title: 'platformio.ini', role: 'Configuración ESP32-S3-DevKitC-1 con ArduinoJson 7 y Adafruit SSD1306', language: 'ini' },
    ],
};

function loadFirmwareSnippets(slug: string, projectPath: string): FirmwareSnippet[] {
    const specs = FIRMWARE_HIGHLIGHTS[slug] ?? [];
    const snippets: FirmwareSnippet[] = [];
    for (const item of specs) {
        const abs = path.join(projectPath, item.path);
        if (!fs.existsSync(abs)) continue;
        const raw = fs.readFileSync(abs, 'utf-8');
        const allLines = raw.split(/\r?\n/);
        const preview = allLines.slice(0, 140).join('\n');
        snippets.push({
            path: item.path,
            title: item.title,
            role: item.role,
            language: item.language,
            lines: allLines.length,
            code: allLines.length > 140 ? `${preview}\n\n// ... (${allLines.length - 140} líneas adicionales en el archivo completo)` : preview,
            githubUrl: `${GITHUB_BLOB_BASE}/${slug}/${item.path}`,
        });
    }
    return snippets;
}

function loadProjectImages(slug: string, projectPath: string): string[] {
    const picsPath = path.join(projectPath, 'pics');
    const images: string[] = [];
    if (!fs.existsSync(picsPath)) return images;

    const buildPath = path.join(picsPath, 'build');
    if (fs.existsSync(buildPath)) {
        fs.readdirSync(buildPath)
            .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .forEach((pic) => images.push(`/images/${slug}/build/${pic}`));
    }
    const rootPics = fs.readdirSync(picsPath).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (slug === 'pad') {
        const preferredOrder = [
            'pad-5-rev09-top.jpg',
            'pad-3-ui-edit.jpg',
            'pad-4-control-center.jpg',
            'pad-6-internals.jpg',
            'pad-7-power-detail.jpg',
            'pad-1-overview.jpg',
            'pad-2-board.jpg',
        ];
        preferredOrder
            .filter((p) => rootPics.includes(p))
            .forEach((pic) => images.push(`/images/pad/${pic}`));
        images.push('/images/pad/companion-mirror-demo.png', '/images/pad/companion-editor-demo.png');
    } else {
        rootPics.forEach((pic) => images.push(`/images/${slug}/${pic}`));
    }
    const modulesPath = path.join(picsPath, 'modules');
    if (fs.existsSync(modulesPath)) {
        fs.readdirSync(modulesPath)
            .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .forEach((pic) => images.push(`/images/${slug}/modules/${pic}`));
    }
    return images;
}

const NON_SHOWCASE = new Set(['speaker-test']);

export function getProjectSlugs(): string[] {
    if (!fs.existsSync(projectsDir)) return [];
    return fs.readdirSync(projectsDir).filter((name) => {
        if (NON_SHOWCASE.has(name)) return false;
        return fs.statSync(path.join(projectsDir, name)).isDirectory();
    });
}

export function getProjectBySlug(slug: string, locale = 'es'): ProjectMeta | null {
    const projectPath = path.join(projectsDir, slug);
    if (!fs.existsSync(projectPath)) return null;

    const translatedReadme = ['en', 'de', 'it'].includes(locale)
        ? path.join(process.cwd(), 'content', 'projects', locale, `${slug}.md`)
        : null;
    const readmePath = translatedReadme && fs.existsSync(translatedReadme)
        ? translatedReadme
        : path.join(projectPath, 'README.md');
    const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : '';

    const images = loadProjectImages(slug, projectPath);
    const downloadPath = path.join(publicDir, 'downloads', slug);
    const filesMap = new Map<string, ProjectMeta['files'][number]>();

    for (const dir of [projectPath, downloadPath]) {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
            if (SKIP_FILES.has(file) || file === 'README.md') continue;
            const full = path.join(dir, file);
            if (!fs.statSync(full).isFile()) continue;
            const type = file.endsWith('.pdf') ? 'pdf' : file.endsWith('.md') ? 'md' : 'other';
            if ((type === 'pdf' || type === 'md') && fs.existsSync(path.join(downloadPath, file))) {
                filesMap.set(file, { name: file, path: `/downloads/${slug}/${file}`, type });
            }
        }
    }

    const technicalAssetsMap = new Map<string, ProjectMeta['technicalAssets'][number]>();
    const pushAsset = (absolutePath: string, source: 'project' | 'download') => {
        const ext = path.extname(absolutePath).replace('.', '').toLowerCase();
        if (!ext) return;
        const relativeName = (source === 'project'
            ? path.relative(projectPath, absolutePath)
            : path.relative(downloadPath, absolutePath)
        ).replace(/\\/g, '/');
        if (SKIP_FILES.has(path.basename(relativeName))) return;
        const kind = classifyAsset(ext);
        if (kind === 'other') return;

        const asset: ProjectMeta['technicalAssets'][number] = {
            name: relativeName,
            path: source === 'download' ? `/downloads/${slug}/${relativeName}` : null,
            githubUrl: source === 'project' ? `${GITHUB_BLOB_BASE}/${slug}/${relativeName}` : null,
            ext,
            kind,
            source,
        };
        technicalAssetsMap.set(`${asset.source}:${asset.name}`, asset);
    };

    walkFiles(projectPath).forEach((file) => pushAsset(file, 'project'));
    walkFiles(downloadPath).forEach((file) => pushAsset(file, 'download'));

    const technicalAssets = Array.from(technicalAssetsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    const firmwareFiles = loadFirmwareSnippets(slug, projectPath);

    const lines = readme.split('\n');
    const titleLine = lines.find((l) => l.startsWith('# '));
    const name = titleLine ? titleLine.replace('# ', '').trim() : slug.toUpperCase();
    const descLine = lines.find((l) => l.trim() && !l.startsWith('#'));
    const description = descLine?.trim() || '';

    const docs = fs
        .readdirSync(projectPath)
        .filter((file) => file.endsWith('.md') && file !== 'README.md')
        .map((file) => file.replace(/\.md$/, ''));

    return {
        slug,
        name,
        description,
        status: projectCatalog.find((project) => project.slug === slug)?.status ?? 'wip',
        images,
        readme,
        files: Array.from(filesMap.values()),
        technicalAssets,
        firmwareFiles,
        docs,
    };
}

export function getAllProjects(): ProjectMeta[] {
    return getProjectSlugs()
        .map((slug) => getProjectBySlug(slug))
        .filter((p): p is ProjectMeta => p !== null);
}
