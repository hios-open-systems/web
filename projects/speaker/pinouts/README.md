# HIOS Pinouts Interactivos

Diagramas de pinout interactivos para los módulos del proyecto HIOS Speaker.

## Uso

Abrir `index.html` en un navegador. Funciona localmente sin servidor.

### Funcionalidades

- **Filtros por categoría**: Click en los botones para mostrar/ocultar tipos de pines
- **Solo proyecto**: Muestra únicamente los pines usados en este proyecto
- **Imprimir**: Botón para versión imprimible (oculta filtros, optimiza colores)

## Agregar nuevos módulos

Los templates en `modules/` contienen ejemplos para agregar más módulos.

### Estructura de un módulo

```html
<div class="module" id="nombre-modulo">
    <h2>Nombre del Módulo</h2>
    <p class="module-subtitle">Descripción breve</p>

    <div class="pinout">
        <div class="pin-column left">
            <!-- Pines lado izquierdo -->
            <div class="pin-row" data-cat="CATEGORIA">
                <span class="pin-label">NOMBRE</span>
                <span class="pin-number">1</span>
            </div>
        </div>

        <div class="chip-body">
            <span class="chip-label">CHIP</span>
        </div>

        <div class="pin-column right">
            <!-- Pines lado derecho -->
            <div class="pin-row" data-cat="CATEGORIA">
                <span class="pin-number">1</span>
                <span class="pin-label">NOMBRE</span>
            </div>
        </div>
    </div>

    <div class="connections">
        <h3>Conexiones</h3>
        <div class="connection-list">
            <div class="connection-item" data-cat="CATEGORIA">
                <span class="dot"></span>PIN → DESTINO
            </div>
        </div>
    </div>
</div>
```

### Categorías disponibles

| Categoría | Color | Uso |
|-----------|-------|-----|
| `5V` | Rojo | Alimentación 5V |
| `3V3` | Naranja | Alimentación 3.3V |
| `GND` | Gris | Tierra |
| `GPIO` | Verde | GPIO general |
| `I2S` | Azul | Audio I2S |
| `I2C` | Violeta | Bus I2C |
| `ADC` | Rosa | Entradas analógicas |
| `NC` | Gris oscuro | No conectado |

### Agregar nueva categoría

En el CSS de `index.html`, agregar:

```css
:root {
    --nueva-cat: #color;
}

.filter-btn[data-cat="NUEVA"].active { background: var(--nueva-cat); }
.pin-row[data-cat="NUEVA"] .pin-dot { background: var(--nueva-cat); border-color: var(--nueva-cat); }
.pin-row[data-cat="NUEVA"] .pin-label { background: var(--nueva-cat); color: #fff; }
.connection-item[data-cat="NUEVA"] .dot { background: var(--nueva-cat); }
```

Y agregar el botón de filtro:

```html
<button class="filter-btn active" data-cat="NUEVA">NUEVA</button>
```

## Módulos disponibles

- `index.html` - ESP32 DevKit V1, MAX98357 L/R, LCD 16x2
- `modules/pcm5102.html` - Template PCM5102 DAC
- `modules/esp32s3.html` - Template ESP32-S3 DevKitC

## Créditos

- Diseño inspirado en [Luis Llamas](https://www.luisllamas.es/en/esp32-hardware-details-pinout/)
- Proyecto [HIOS - HI Open Systems](https://github.com/hiopsystems)

## Licencia

MIT - Libre para usar, modificar y compartir.
