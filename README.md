# HIOS — openhios.dev

> Mi mesa de trabajo. Herramientas que uso a diario.
> _My workbench. Tools I use every day._

🌐 **Live:** **[openhios.dev](https://openhios.dev/)** · Local-first · Open source · 4 idiomas (en / es / de / it)

HIOS (HI Open Systems) empezó como una vitrina de hardware abierto y se volvió lo que de verdad uso: un **patio de herramientas para desarrolladores** —pequeñas, rápidas, sin login— más la documentación honesta del hardware que voy construyendo mientras aprendo electrónica.

No es una demo linda. Es un sitio al que vuelvo durante el día de trabajo.

---

## Qué hay adentro

### 🛠️ Workbench — `/workbench`

Diez herramientas locales, sin gate de categorías, sin servidor de por medio salvo cuando se avisa:

| Tool | Qué hace | Datos |
|---|---|---|
| **Payload Lab** | Formatear / validar / compartir JSON por URL | local |
| **Type Checker** | ¿Un JSON es asignable a un tipo TypeScript? | local |
| **JWT Playground** | Decodificar / firmar / verificar JWT (HS/RS/ES) | local |
| **Object → Types** | JSON real → interfaces TypeScript | local |
| **Object Comparator** | Diff estructural de dos JSON | local |
| **Random String** | Tokens / IDs / secrets con entropía en vivo | local |
| **Snippets Shelf** | Guardar y reusar snippets (sync opcional) | local |
| **DNS Inspector** | Registros DNS en vivo (A/AAAA/MX/TXT/NS/CNAME) | red |
| **Certificate Expiry** | Validez / issuer / riesgo de expiración TLS | red |
| **Site Checker** | Monitoreo de URLs con notificaciones cliente | red |

Sistemas reusables que atraviesan todas las tools:

- **Tutoriales in-tool** — panel "Cómo se usa" colapsable, i18n-driven, estado en `localStorage`.
- **Command palette** — `Ctrl/Cmd+K` global para saltar a cualquier tool o página.
- **Presets local-first** — guardar/cargar estados nombrados sin cuenta.
- **Tool chaining** — mandar la salida de una tool a otra ("Send to →").
- **Deep-links** — `?tool=<id>` y `?tool=random` abren una tool directo.

### 🔢 Calculators — `/calculators`

Calculadoras embebidas para diseño electrónico, todo client-side con estado compartible por URL: resistencia para LED, capacitor por ripple, potencia/térmica, consumo/autonomía, laboratorio de resistencias (bandas ↔ valor), divisor ADC, filtros **RC / RL / RCL serie** (con esquemáticos SVG y curvas de Bode), ganancia de amplificador, clocks I2S. Incluye **normalización E12/E24** (valor estándar más cercano).

### 🔌 Pinouts — `/pinouts`

Visor interactivo de pinouts de módulos.

### 🔧 Hardware — `/projects`

Proyectos de hardware abierto, documentados con los errores incluidos:

| Proyecto | Estado | Descripción |
|---|---|---|
| **BTDAC** | ✅ Funciona | DAC Bluetooth con ESP32 + PCM5102 |
| **WiFi Speaker** | 🚧 WIP | Parlante WiFi con ESP32 + amp I2S MAX98357 |

---

## Filosofía

- **Local-first.** Payloads, notas y estados quedan en tu navegador siempre que tenga sentido. El login (GitHub OAuth) es un backup opcional, nunca un requisito.
- **Compartible.** Cuando un flujo importa, se comparte por URL en vez de explicar diez pasos.
- **Honesto.** Las herramientas de red dicen que son de red. Los proyectos documentan lo que no funciona.
- **Abierto.** Código MIT, hardware CERN-OHL-S, docs CC BY-SA.

## Stack

- **Next.js 14** (App Router) · **TypeScript** estricto · runtime **edge**
- **Ant Design 5** + CSS Modules + variables de tema (dark/light)
- **next-intl** — 4 locales (`en` default, `es`, `de`, `it`)
- **Cloudflare Pages** + **D1** (SQLite) para auth/snippets opcionales — _no Vercel_
- Framer Motion, mermaid, MDX para contenido de proyectos

## Empezar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
npm run lint       # ESLint
```

## Tests

Sin test runner pesado a propósito. La red contra regresiones son **self-tests sin dependencias** (Node ≥ 22, `--experimental-strip-types`) más smoke E2E con Playwright:

```bash
npm run test:calc    # matemática de calculators (calc.ts + curvas)
npm run test:jwt     # matriz cripto del JWT Playground
npm run test:auth    # sanitización de redirect de OAuth
npm run test:e2e     # smoke Playwright (golden paths)
npm run test:e2e:auth # smoke autenticado en Cloudflare Pages + D1 local
```

El smoke autenticado usa un config Playwright aparte: buildea la app, siembra un dataset D1 local determinístico (user/session/snippet/theme) y arranca con `wrangler pages dev`. Necesita un runtime Wrangler que pueda lanzar `workerd` (en Linux, `glibc` del host suficientemente nuevo).

## Estructura

```
app/[locale]/        Rutas (locale-prefixed): workbench, calculators, pinouts, projects, print
  api/               Routes edge: auth (GitHub OAuth), snippets, user, workbench (dns/cert)
components/
  workbench/         Tools, ToolGrid/ToolCard compartido, ToolGuide, ToolPager
  landing/           Hero, ToolShowcase, ProjectsGrid
  tools/calculators/ Calculadoras + viz (esquemáticos SVG, plots, E-series)
  common/            CommandPalette, UrlPresets, SendToMenu
lib/                 auth, snippets, workbench (jwt/network), i18n helpers
config/workbench.ts  Catálogo único de tools (id, href, accent, icon, locality)
messages/            i18n: en/es/de/it.json
projects/            Fuentes de hardware (README, pics, firmware) — btdac, speaker
scripts/             Self-tests zero-dep (jwt/calc/auth)
tests/               Playwright smoke
```

## Deploy

Se deploya en **Cloudflare Pages** desde `main` (push = deploy). Runtime edge en todas las rutas; auth/snippets sobre Cloudflare D1. La carpeta `.vercel` es legacy — el deploy real es Cloudflare.

## Licencia

- **Código:** MIT
- **Diseños de hardware:** CERN-OHL-S v2
- **Documentación:** CC BY-SA 4.0

---

_Construyendo y aprendiendo en público. Compartiendo todo, errores incluidos._
