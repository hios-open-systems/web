# HIOS - Estructura Estándar de Proyectos

Este documento define la estructura base que deben seguir todos los proyectos HIOS.

---

## Estructura de Carpetas

```
project-name/
├── README.md                    # Overview + Quick Start
├── COMPONENTS.md                # Specs detalladas de cada módulo
├── PINOUT.md                    # Conexiones y diagramas
├── ASSEMBLY.md                  # Guía de ensamblaje paso a paso
├── TROUBLESHOOTING.md           # Problemas comunes y soluciones
├── HIOS_{Name}_Soldering_Guide.pdf  # Guía imprimible de soldadura
├── platformio.ini               # Configuración PlatformIO
├── src/
│   └── main.ino                 # Firmware principal
├── tests/
│   └── test_basic.ino           # Tests de hardware
└── pics/
    ├── modules/                 # Fotos de componentes individuales
    │   ├── componente1.png
    │   └── componente2.png
    └── build/                   # Fotos del proyecto armado
        ├── foto1.jpg
        └── foto2.jpg
```

---

## Archivos Requeridos

### README.md
```markdown
# HIOS {Nombre del Proyecto}

Descripción breve del proyecto (1-2 oraciones).

## Features
- Feature 1
- Feature 2

## Quick Start
1. Clonar repositorio
2. Abrir en PlatformIO
3. Ajustar configuración WiFi/BT
4. Compilar y subir

## Documentación
- [Componentes](COMPONENTS.md)
- [Pinout](PINOUT.md)
- [Ensamblaje](ASSEMBLY.md)
- [Solución de Problemas](TROUBLESHOOTING.md)
```

### COMPONENTS.md
- Especificaciones técnicas de cada módulo
- Por qué se eligió cada componente
- Tabla de especificaciones
- Diagrama de bloques del sistema
- Lista de compras con links/búsquedas

### PINOUT.md
- Diagrama ASCII del microcontrolador
- Tabla de conexiones por sección:
  - Alimentación
  - Audio (I2S)
  - Periféricos (LCD, LED, etc.)
  - Sensores
- Procedimiento de conexión paso a paso
- Diagrama visual del sistema completo
- Notas de seguridad

### ASSEMBLY.md
- Lista de herramientas necesarias
- Preparación previa
- Pasos de ensamblaje con fotos
- Verificaciones intermedias
- Test final

### TROUBLESHOOTING.md
- Tabla de problemas → causas → soluciones
- Diagnósticos con multímetro
- Errores de compilación comunes
- FAQs

### Soldering Guide (PDF/MD)
Formato imprimible con:
- Checklist pre-soldadura
- Tablas de conexiones con checkboxes
- Configuración de jumpers
- Pinout rápido
- Checklist post-soldadura

---

## Convenciones de Nombres

### Archivos
- Documentación: `MAYUSCULAS.md` (README, PINOUT, etc.)
- Guías imprimibles: `HIOS_{Proyecto}_Soldering_Guide.pdf`
- Código: `lowercase.ino`

### Imágenes
- Formato: PNG para diagramas, JPG para fotos
- Nombres: descriptivos en lowercase (`fuente.png`, `display.png`)
- Tamaño máximo recomendado: 1920x1080 o 2MB

### GPIOs
Documentar siempre:
| GPIO | Función | Módulo |
|------|---------|--------|
| 25   | I2S DIN | MAX98357 |

---

## Sincronización

Después de agregar archivos nuevos, ejecutar:
```bash
./scripts/sync-projects.sh
```

Esto copia:
- `projects/*/pics/*` → `public/images/*/`
- `projects/*/*.md` (excepto README) → `public/downloads/*/`
- `projects/*/*.pdf` → `public/downloads/*/`

---

## Checklist Nuevo Proyecto

- [ ] Crear carpeta en `projects/{slug}/`
- [ ] README.md con descripción y quick start
- [ ] COMPONENTS.md con specs de módulos
- [ ] PINOUT.md con todas las conexiones
- [ ] ASSEMBLY.md con pasos de armado
- [ ] TROUBLESHOOTING.md con problemas comunes
- [ ] Soldering Guide (PDF o MD imprimible)
- [ ] platformio.ini configurado
- [ ] src/main.ino con firmware
- [ ] tests/test_basic.ino
- [ ] Fotos en pics/modules/ y pics/build/
- [ ] Ejecutar sync-projects.sh
- [ ] Agregar traducciones en messages/*.json
- [ ] Verificar que aparece en la web

---

## Diferencias Actuales (a unificar)

| Aspecto | btdac | speaker | Estándar |
|---------|-------|---------|----------|
| Soldering Guide | PDF | MD | PDF preferido |
| Build photos | ✓ | ✗ | Requerido |
| Android app | ✓ | ✗ | Opcional |
