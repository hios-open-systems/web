# HIOS — openhios.dev

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages%20%2B%20D1-F38020?logo=cloudflare)](https://pages.cloudflare.com)
[![License: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Hardware: CERN-OHL-S](https://img.shields.io/badge/Hardware-CERN--OHL--S%20v2-lightgrey.svg)](LICENSE-HARDWARE)
[![i18n](https://img.shields.io/badge/i18n-4%20idiomas-informational)](messages/)
[![Tráfico Público](https://img.shields.io/badge/Métricas%20en%20vivo-openhios.dev%2Fes%2Fstats-2ba640)](https://openhios.dev/es/stats)

**Ecosistema de hardware abierto, firmware embebido ESP32 y simuladores de ingeniería electrónica y telecomunicaciones.**  
*Open hardware ecosystem, ESP32 embedded firmware, and interactive DSP / telecommunications engineering simulators.*

🌐 **Live:** [openhios.dev](https://openhios.dev) · 📊 **Métricas públicas de uso en vivo:** [openhios.dev/es/stats](https://openhios.dev/es/stats) · 4 idiomas (`en` default, `es`, `de`, `it`) · Local-first

</div>

---

## 🇪🇸 Español

### Qué es
HIOS (HI Open Systems) reúne proyectos de **hardware abierto con firmware en C++**, simuladores interactivos de **procesamiento digital de señales (DSP), filtros analógicos y telecomunicaciones**, complementados con una mesa de trabajo (*workbench*) de utilidades de ingeniería local-first sin login ni intermediación de servidores.

---

### 1. 🔌 Hardware Abierto y Firmware Embebido C++ (En primer plano)
Proyectos físicos documentados de punta a punta, con esquemáticos, guías de soldadura paso a paso, archivos PlatformIO y firmware modular:

| Proyecto | Microcontrolador | Estado | Descripción técnica |
|---|---|:---:|---|
| **HIOS PAD** | ESP32 | ✅ Operativo | Controlador físico / macro-pad con teclas mecánicas, comunicación serie USB y Bluetooth LE, con companion daemon local. |
| **BTDAC** | ESP32 + PCM5102A | ✅ Operativo | Receptor DAC de audio Bluetooth de alta resolución; transmisión I2S de bajo jitter y filtrado analógico de salida. |
| **HIOS Node AI** | ESP32-S3 | 🚧 En desarrollo | Nodo satélite físico para interfaz y control con servidores locales de LLM (LM Studio / Ollama). |
| **WiFi Speaker** | ESP32 + MAX98357A | 🚧 En desarrollo | Parlante inalámbrico conectado por red con amplificador digital I2S clase D de alta eficiencia. |

---

### 2. 📡 Simuladores de Ingeniería, Telecomunicaciones y Audio DSP
Herramientas matemáticas y gráficas ejecutadas 100% en el cliente mediante Web Audio API, Canvas y SVG dinámico:

- **Modulador digital y constelación QPSK:** Simulación en tiempo real de modulación por desplazamiento de fase en cuadratura (QPSK / 4-QAM), con visualización del diagrama de constelación, dispersión por ruido gaussiano (AWGN) y error de fase.
- **Filtros analógicos con diagramas de Bode:** Cálculo interactivo y trazado de curvas de magnitud (dB) y fase (grados) para filtros pasivos **RC, RL y RCL serie** (pasabajos, pasaaltos, pasabanda), con esquemáticos vectoriales SVG generados al vuelo.
- **Suite de Audio DSP:**
  - *Chiptune Synthesizer:* Generador de síntesis sustractiva por software con formas de onda clásicas (cuadrada, pulso con modulación de ciclo, sierra, ruido blanco).
  - *Analizador de espectro FFT:* Medición en tiempo real por transformadas rápidas de Fourier desde entrada de audio o micrófono.
  - *Afinador cromático y frecuencímetro:* Detección de frecuencia fundamental ($f_0$) y precisión en cents.
- **Calculadoras de diseño electrónico:**
  - Normalización automática a series de precisión estándar **E12 y E24** (componente comercial más cercano).
  - Cálculo térmico y disipación de potencia ($P = I^2 R$).
  - Estimación de rizado (*ripple voltage*) para filtros capacitivos de fuentes.
  - Divisor resistivo adaptado a impedancia de entrada ADC de microcontroladores.

---

### 3. 🛠️ Workbench de Desarrollo (Utilidades complementarias)
Suite de más de 50 herramientas cliente para el flujo de trabajo diario de software e infraestructura:
- **Criptografía e identidad:** Decodificador, firmador y verificador de tokens JWT (HS256, RS256, ES256); generador de strings y UUIDv4 con entropía criptográfica real (`crypto.getRandomValues`).
- **Inspección de red e infraestructura:** Consultas directas DNS (A, AAAA, MX, TXT, CNAME), verificador de certificados TLS y vigencia, evaluador de expresiones Cron.
- **Modelado y tipos:** Validador y generador de interfaces TypeScript a partir de JSON en vivo (`Object → Types`), comparador estructural (diff) de JSON y esquemas JSON Schema.
- **Diagramación:** Entorno local integrado con Mermaid.js y Excalidraw sin envío de diagramas a servicios de terceros.

---

### Capturas
| Hardware y Firmware C++ | Simulador QPSK y Diagramas de Bode |
|:---:|:---:|
| ![Hardware ESP32](docs/screenshots/hardware-firmware.png) | ![Simulador QPSK](docs/screenshots/simulador-qpsk-bode.png) |
| **Sintetizador Chiptune y Audio DSP** | **Workbench de Desarrollo** |
| ![Audio DSP](docs/screenshots/audio-dsp-synth.png) | ![Dev Workbench](docs/screenshots/dev-workbench.png) |

---

## 🇬🇧 English

### Overview
HIOS is an open-source hub bringing together **open hardware projects with C++ firmware**, interactive simulators for **digital signal processing (DSP), analog filters, and telecommunications**, complemented by an edge-hosted developer workbench designed around privacy and local-first execution.

### Key Pillars
1. **Open Hardware & ESP32 Firmware:** Production schematics, PlatformIO projects, and soldering guides for audio DACs (PCM5102), macro controllers, and wireless audio streamers.
2. **Interactive Engineering Simulators:** Real-time QPSK constellation mapper with noise modulation, dynamic Bode magnitude/phase plots for RC/RL/RCL filters, FFT audio spectral analyzer, and E12/E24 electronic tolerance calculators.
3. **Developer Workbench:** 50+ client-side utilities (JWT crypto sandbox, TypeScript type extractors, DNS inspectors, Mermaid/Excalidraw canvas).

---

## Stack y Arquitectura

- **Framework:** Next.js 15 (App Router), React 19, TypeScript estricto.
- **Runtime:** Cloudflare Pages (Edge runtime con `@opennextjs/cloudflare`) y base de datos Cloudflare D1 (SQLite) para sincronización opcional de snippets.
- **Diseño:** Ant Design 5 + CSS Modules con sistema de temas claro/oscuro.
- **Internacionalización:** `next-intl` con soporte nativo para 4 idiomas (`en`, `es`, `de`, `it`).
- **Embebidos:** C++ / PlatformIO para microcontroladores ESP32 / ESP32-S3.

## Puesta en marcha

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev        # http://localhost:3000

# Verificaciones
npm run lint       # ESLint
npm run test:calc  # Pruebas matemáticas de calculadoras electrónicas y filtros
npm run test:jwt   # Matriz criptográfica del JWT Playground
npm run build      # Compilación de producción
```

## Licencias

- **Código** (sitio y firmware): MIT, ver [`LICENSE`](LICENSE).
- **Diseños de hardware** (`projects/*/hardware/`, CAD y STL): CERN-OHL-S v2, ver [`LICENSE-HARDWARE`](LICENSE-HARDWARE).
- **Documentación y guías:** CC BY-SA 4.0, ver [`LICENSE-DOCS`](LICENSE-DOCS).
- **Contenido de terceros** mantiene su licencia: samples FluidR3 (CC BY 3.0) y VCSL (CC0), ver [`public/samples/CREDITS.md`](public/samples/CREDITS.md); la perilla del joystick del PAD se basa en un modelo de Thingiverse (thing:6189483) con la licencia que indique su autor.
