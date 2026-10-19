# Pinouts e instrumentos compartidos

## Catálogo

La página `app/[locale]/pinouts/page.tsx` muestra 15 módulos mediante componentes React y SVG locales. `PinoutsContent` reúne el selector móvil, la búsqueda, la navegación por hash y `BreakoutViewer`. Los diagramas se pueden ampliar con `DiagramFrame`.

`config/pinouts/modules/` conserva una única definición de cada módulo: identificador, pines, roles eléctricos, posición física, conexiones con proyectos y capacidades de simulación. Las MCU usan `BoardPinout` con el orden real de los headers. No ordenar los GPIO por número ni inferir la posición de las patillas a partir de un esquema funcional.

Los textos visibles del catálogo viven en `messages/{en,es,de,it}.json`, bajo `Pinouts.Modules.<id>`. `localizeBreakout` aplica el contrato `BreakoutCopy` antes de buscar y renderizar. Incluye nombre, descripción, características, conexiones, advertencias y tablas. Las leyendas están en `Pinouts.Functions`.

- `pins[].name` es la identidad estable del pin; debe coincidir con el catálogo físico.
- `pins[].label` permite traducir una descripción como “demás IOxx” sin cambiar su identidad.
- Las traducciones no cambian roles, geometría, perfiles de laboratorio ni gravedad de advertencias.
- Las notas y filas de tablas siguen el orden de la definición compartida. Actualizar los cuatro idiomas al agregar contenido.
- El contenido de referencia en español de los archivos de configuración no reemplaza la cobertura de traducciones: las pruebas exigen todas las entradas.

Las guías de montaje de proyectos (`config/pinouts/{pad,btdac,speaker}.ts` y `components/wiring-guide/`) tienen su propio modelo. No confundir un pinout genérico de módulo con la asignación de GPIO de un proyecto.

## Reutilización de I²S

`lib/instruments/i2s.ts` es la fuente común del cálculo y las muestras:

- `i2sClockModel(fs, slotBits)` define dos ranuras por trama: `BCLK = fs × 2 × slotBits`, `WS = fs`.
- `i2sBusModel` agrega profundidad de audio, canales de audio, datos útiles y MCLK nominal. Mono no elimina una ranura del bus. La profundidad no puede superar el ancho de ranura.
- `i2sClockSamples` produce flancos digitales ideales, sin interpolar rampas. Los niveles 0/1 no representan voltajes medidos.

`components/instruments/I2sScope.tsx` presenta las dos trazas, colores, unidades, leyendas, pausa y explicación. Usa `TimeScope`/`SignalPlot`. Recibe el modelo y los nombres físicos de BCLK y WS; no posee controles de cálculo ni persistencia.

Se comparte entre la calculadora I²S y los laboratorios PCM5102A (`BCK/LRCK`) y MAX98357A (`BCLK/LRC`). Los demás módulos no activan el instrumento. Para otra familia de señales, reutilizar el renderizador cuando tenga sentido y mantener la física en un modelo específico; no representar buses distintos como si fueran I²S.

La calculadora guarda `i2sSlotBits` junto con el resto de sus valores. Conserva el valor predeterminado de 16 bits para enlaces antiguos; si un enlace anterior especificaba otra profundidad, se interpreta como su ancho implícito de ranura. Los nuevos enlaces con una profundidad no predeterminada incluyen el ancho explícito, incluso si coincide con el predeterminado. Las plantillas de audio usan 16/16 bits a 44.1 kHz y 24/32 bits a 48 kHz.

La animación está ralentizada y respeta movimiento reducido. Cambiar valores actualiza las trazas aun con el visor pausado. DIN y MCLK no se dibujan; MCLK se presenta como cálculo nominal, sujeto a los formatos y relaciones admitidos por el dispositivo real.

## Verificación

`npm run test:instruments` comprueba frecuencias, flancos, mono/estéreo, profundidad/ranura y entradas inválidas. `npm run test:breakouts` comprueba los headers físicos y la integridad del catálogo y sus traducciones, incluyendo valores numéricos en tablas.

Playwright cubre:

- `tests/i2s-shared.spec.ts`: acuerdo calculadora/pinouts, los cuatro idiomas, valores inválidos, pausa, enlaces antiguos, recarga y configuraciones guardadas.
- `tests/pinout-translations.spec.ts`: contenido completo de los 15 módulos y búsqueda localizada; disposición a 320 px en los cuatro idiomas.
- `tests/mobile-instruments.spec.ts`: controles y señales en móvil y tablet.
- `tests/pinouts.spec.ts` y `tests/mobile-pinouts.spec.ts`: selección, historial, identidad de pines y ampliación.

Ejecutar build, lint, pruebas de lógica y Playwright contra la compilación actual antes de integrar en `main` local. Push y deploy corresponden al cierre del día.
