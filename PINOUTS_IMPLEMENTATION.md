# Pinouts Interactivos - Implementación

## Descripción

Se ha implementado una página interactiva para explorar los diagramas de pines (pinouts) de los módulos electrónicos utilizados en los proyectos HIOS.

## Estructura Implementada

### Arquitectura y Principios

La implementación sigue los principios de la guía técnica del proyecto:

- **SOLID**: Componentes pequeños con una única responsabilidad
- **DRY**: Lógica centralizada y reutilizable
- **Modular**: CSS separado en archivo module
- **Tipado**: TypeScript strict sin `any`
- **Accesible**: Soporte completo para teclado y semántica HTML

### Componentes Principales

#### 1. **PinoutsContent** (`components/pinouts/PinoutsContent.tsx`)
Contenedor principal que orquesta el flujo de la página.
- Mantiene estado del módulo seleccionado
- Renderiza grid de módulos disponibles
- Renderiza el visor interactivo

#### 2. **ModuleCard** (`components/pinouts/ModuleCard.tsx`)
Tarjeta visual de un módulo individual.
- Muestra nombre, descripción y categoría
- Estilos hover y estado activo
- Botones para seleccionar y acceder al HTML
- Integrada con Ant Design

#### 3. **ModuleSelector** (`components/pinouts/ModuleSelector.tsx`)
Componente de búsqueda y filtrado (actualmente no usado, pero disponible para futuras mejoras).
- Búsqueda por nombre/descripción
- Filtrado por categoría
- Grid responsivo
- Accesibilidad con teclado

#### 4. **ModuleViewer** (`components/pinouts/ModuleViewer.tsx`)
Visor interactivo del pinout HTML.
- Tab para vista interactiva (iframe)
- Tab para especificaciones técnicas
- Loading state
- Alto flexible

### Configuración de Módulos

Archivo: `config/modules.ts`

Define la lista de módulos disponibles y sus metadatos:
```typescript
interface ModuleSpecs {
  voltage?: string;
  resolution?: string;
  features?: string[];
  interface?: string;
  package?: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  category: 'microcontroller' | 'audio' | 'power' | 'amplifier';
  image?: string;
  htmlPath: string;
  datasheetUrl?: string;
  specs?: ModuleSpecs;
}
```

Módulos configurados:
- **ESP32 DevKit V1** - Microcontrolador (38 pines)
- **ESP32-S3 DevKitC** - Microcontrolador (WiFi 6, BLE 5)
- **PCM5102 DAC** - Audio (32-bit/192kHz)
- **MAX98357 Amplifier** - Amplificador I2S (3.2W)
- **LM2596 Buck Converter** - Alimentación (3A)

### Estilos

Archivo: `components/pinouts/pinouts.module.css`

- CSS Modules para aislar estilos
- Variables Ant Design para temas consistentes
- Responsive design (mobile-first)
- Animaciones suaves
- Accesibilidad (contraste, focus states)

### Página Next.js

Archivo: `app/[locale]/pinouts/page.tsx`

- Integrada con i18n
- Metadata dinámico
- Pre-renderizado estático
- Soporta múltiples locales (en, es, de, it)

## Estructura de Archivos

```
components/
└── pinouts/
    ├── ModuleCard.tsx          # Tarjeta de módulo
    ├── ModuleSelector.tsx      # Búsqueda y filtro
    ├── ModuleViewer.tsx        # Visor interactivo
    ├── PinoutsContent.tsx      # Contenedor principal
    ├── pinouts.module.css      # Estilos CSS
    └── index.ts                # Re-exports

config/
└── modules.ts                  # Configuración de módulos

app/[locale]/
└── pinouts/
    └── page.tsx                # Página Next.js

public/pinouts/
├── modules/
│   ├── esp32-devkit-v1.html
│   ├── esp32s3.html
│   ├── pcm5102.html
│   ├── max98357.html
│   └── lm2596.html
└── ...
```

## Características

### ✅ Implementadas

- [x] Página responsive con header y descripción
- [x] Grid de tarjetas de módulos
- [x] Visor interactivo de pinouts (iframe)
- [x] Selector de módulo con selección visual
- [x] Tab para vista de especificaciones
- [x] Integración con tema Ant Design
- [x] Soporte multi-idioma (i18n)
- [x] CSS modular sin estilos globales
- [x] TypeScript strict
- [x] Accesibilidad (keyboard, ARIA)
- [x] Responsive design
- [x] Componentes reutilizables y pequeños

### 🚀 Mejoras Futuras

- [ ] Agregar más módulos (MAX98357, TPA2016D2, etc)
- [ ] Imágenes de módulos en tarjetas
- [ ] Vista de comparación entre módulos
- [ ] Descargas de datasheets
- [ ] Historial de módulos visitados
- [ ] Búsqueda global en la aplicación
- [ ] Integración con proyectos (mostrar módulos por proyecto)
- [ ] Animaciones de zoom en pinouts
- [ ] Exportación de pinouts como PDF

## Uso

### Para agregar un nuevo módulo:

1. Crear archivo HTML del pinout en `public/pinouts/modules/`
2. Agregar entrada en `config/modules.ts`:
   ```typescript
   {
     id: 'nuevo-modulo',
     name: 'Nombre del Módulo',
     description: 'Descripción breve',
     category: 'power',
     htmlPath: '/pinouts/modules/nuevo-modulo.html',
     datasheetUrl: 'https://example.com/datasheet.pdf',
     specs: {
       voltage: '3.3V - 5V',
       features: ['Feature 1', 'Feature 2'],
       interface: 'SPI, I2C',
       package: 'QFN-16',
     },
   }
   ```

### Para customizar estilos:

Editar `components/pinouts/pinouts.module.css` - está organizado en secciones:
- Module Cards
- Selector Styles
- Viewer Styles
- Page Container
- Responsive Media Queries

## Atribución

Los pinouts interactivos están inspirados en el trabajo de [Luis Llamas](https://www.luisllamas.es/), especialmente su excelente recurso de [ESP32 Hardware Details & Pinout](https://www.luisllamas.es/en/esp32-hardware-details-pinout/).

Características diferenciales de HIOS Pinouts:
- Integración con proyectos HIOS
- Especificaciones técnicas detalladas
- Links directos a datasheets oficiales
- Soporte multi-idioma (en, es, de, it)
- Tema oscuro optimizado para makers

## Tecnologías Usadas

- **Next.js 14+** - Framework principal
- **React 18+** - UI
- **TypeScript** - Type safety
- **Ant Design 5.x** - Componentes UI
- **CSS Modules** - Estilos aislados
- **next-intl** - Internacionalización

## Performance

- Pre-rendering estático SSG
- Code splitting automático
- CSS Modules para estilos optimizados
- Lazy loading de componentes (posible con dynamic imports)
- File size optimized (11.5 kB per locale)

## Verificación

Para verificar que todo funciona:

```bash
# Compilar
npm run build

# Ejecutar en desarrollo
npm run dev

# Navegar a
http://localhost:3000/en/pinouts
```

---

Todos los cambios respetan la arquitectura y principios del proyecto base:
- Código limpio y legible
- SOLID principles
- DRY (Don't Repeat Yourself)
- Componentes pequeños y reutilizables
- CSS separado en archivos modulares
- TypeScript strict
