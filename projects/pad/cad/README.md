# Ensamble volumétrico del HIOS PAD

Primer estudio para conservar todos los componentes del pad, reducir su huella y
darle a la pantalla un recorrido de inclinación útil. Las tres distribuciones
comparten el mismo inventario y una base provisional de 38 mm de alto.

**Estado: concepto dimensional, no fabricación.** Las dimensiones de los módulos
son supuestos editables, no mediciones del hardware ni planos de fabricante.
La referencia existente de 110 × 160 × 35 mm se obtiene de los límites combinados
de `box.stl`, `front_plate.stl` y `tapa-superior.stl`, interpretando sus unidades
como milímetros. Excluye la pantalla, sus soportes, patas y salientes actuales.

## Qué se conserva

- Pantalla de 4 pulgadas, diez teclas de acción y dos ALT.
- Joystick HW-504, encoder KY-040 y sus controles existentes.
- ESP32-S3. El usuario confirmó el 20 de octubre de 2026 que la unidad actual
  **no lleva la GPIO Extension Board**.
- Dos 18650 dentro de su portaceldas existente, BMS 2S USB-C y LM2596S con voltímetro.
- Dos parlantes, dos amplificadores MAX98357A y dos placas de cuatro NeoPixel.
- SW-CELDAS y SW-PANTALLA, documentados en la guía de cableado.
- Reservas para dos condensadores indicados en esa guía; comprobar su presencia
  y tamaño en la unidad física.

No se propone cambiar la alimentación, desarmar el portaceldas ni reemplazar
componentes. La matriz eléctrica 2×5 puede conservarse aunque cambie la disposición
física de las teclas; las etiquetas y agrupaciones de la interfaz deberán seguir
siendo comprensibles con la distribución elegida.

## Distribuciones

| Variante | Base provisional, mm | Reducción de superficie de base | Envolvente de base frente a la referencia |
|---|---|---|---|
| Lineal | 120 × 134 × 38 | 8,6 % | 0,8 % menos volumen |
| Cuadrícula | 128 × 120 × 38 | 12,7 % | 5,2 % menos volumen |
| Doble fila | 124 × 126 × 38 | 11,2 % | 3,6 % menos volumen |

Las tres ganan ancho respecto de los 110 mm actuales y reducen profundidad. El
volumen tabulado es el de una caja envolvente, no material impreso ni volumen del
conjunto con la pantalla abierta.

**Cuadrícula es la candidata inicial:** doce teclas en 4×3, con ALT1 y ALT2 en
las últimas dos posiciones, joystick y encoder a la derecha. A 55° la pantalla
queda dentro de la huella de 128 × 120 mm. A 0° la huella total pasa a 128 × 140 mm:
es un 1,8 % mayor que la base de referencia. Por eso el visor muestra por separado
la base y el conjunto, y permite explorar todo el recorrido.

Lineal conserva las dos filas de cinco y agrega una fila de navegación.
Doble fila mantiene esas diez posiciones y agrega un ALT al extremo de cada fila;
la navegación queda detrás. A 55° esta última ocupa aproximadamente
124 × 131,2 mm incluyendo pantalla: la reducción de huella total es 7,6 %, aunque
la base sola reduzca 11,2 %. A 60° casi coincide con la base.

La comparación de huellas no incluye cables enchufados. No hay una medición del
volumen completo de la unidad actual con la pantalla abierta.

## Distribución interior y pantalla

Los parlantes quedan a izquierda y derecha de la zona delantera. El regulador y
el ESP32 van entre ellos; el portaceldas se reserva detrás de los controles.
NeoPixel y amplificadores ocupan una segunda altura sobre el portaceldas, con
separación de sus envolventes. Eso requerirá un soporte aislante desmontable;
las placas no deben apoyarse físicamente sobre las celdas.

El eje conceptual queda a 46 mm de la mesa, 8 mm por encima de la tapa. Se ubica
cerca del borde inferior de la pantalla y detrás del espacio del pulgar.
La envolvente de pantalla y bisel mide provisionalmente 116 × 72 × 12 mm.
El cuerpo del módulo supuesto es 112 × 68 × 10 mm: no se reutilizan las medidas
del marco legado de 3,5 pulgadas para afirmar compatibilidad con el de 4.

El ángulo se mide desde la horizontal, de 0° a 75°. Se validó el espacio geométrico
en pasos de 1°, con un margen de 1 mm respecto de las cajas de componentes,
la envolvente de la base y una reserva de movimiento de pulgar. La unión prevista
entre bisel y soportes laterales se excluye explícitamente de las colisiones:
esos apoyos aún no tienen eje, rodamientos, ajustes ni fijaciones diseñados.

Este resultado verifica **las envolventes supuestas**, no el mecanismo actual.
Quedan pendientes el rozamiento o bloqueo para sostener el ángulo, topes,
resistencia, estabilidad al pulsar, inclinación real del joystick, radios de
flexión del cable y un prototipo de bisagra. El hueco reservado para el cable
no simula su deformación durante el giro.

La carcasa se representa como volumen de referencia. No tiene paredes,
recortes ni postes fabricables. Las salidas USB son reservas de acceso cuya
posición debe contrastarse con los conectores reales. El segundo USB del ESP32,
la lectura del voltímetro, acústica, difusión de luz, tornillos, conectores
internos y recorrido completo del mazo requieren diseño posterior.

## Archivos y regeneración

- `components.json`: inventario, dimensiones supuestas, estado y notas.
- `layouts.py`: posiciones de teclas, navegación, base y eje para las tres variantes.
- `model.py`: componentes y espacios reservados compartidos.
- `assembly.scad`: fuente OpenSCAD generada, con selector de distribución,
  ángulo de pantalla y visualización de espacios libres.
- `generated/*.glb`: ensambles 3D por componente a su ángulo inicial; metros según
  glTF, con dimensiones en milímetros en los metadatos. Son cajas de ocupación.
- `generated/study.json`: toda la geometría y los resultados de comprobación.
- `generated/preview.html`: fragmento interactivo local, sin solicitudes externas.

Desde la raíz del repositorio, con Python estándar, sin instalar dependencias:

```powershell
python projects/pad/cad/build.py
python -m unittest discover -s projects/pad/cad -p "test_*.py"
```

Editar primero los supuestos en `components.json` y las posiciones en
`model.py` / `layouts.py`; después regenerar. Los volúmenes orientados se
especifican explícitamente en el modelo. Cambiar una medida exige revisar también
su orientación, la distribución y las reservas; no hay un empaquetador automático.

En OpenSCAD abrir `assembly.scad`, elegir `layout_index` entre 0 y 2 y modificar
`screen_angle`. La fuente se inspeccionó y se generó desde el mismo modelo que
los GLB; no se ejecutó OpenSCAD porque no está instalado en este equipo.

## Medidas que más pueden cambiar el resultado

Antes de diseñar agujeros o una carcasa imprimible, medir con calibre:

1. Pantalla completa: PCB, espesores máximos, conectores y centros de fijación.
2. Ambos parlantes: largo con orejas, ancho y profundidad.
3. Portaceldas cargado: largo, ancho, alto y salientes de cables/interruptor.
4. Pulsadores: tamaño de tecla, cuerpo, recorte, altura bajo tapa y soldadura.
5. LM2596S: huella, altura máxima y acceso al voltímetro.
6. Joystick y encoder: placa, ejes, fijaciones y recorrido libre.
7. ESP32, BMS, amplificadores, placas LED e interruptores: envolventes pobladas.

El paso de teclas de 18 mm y la reserva del pulgar son hipótesis ergonómicas.
Conviene probar la distribución elegida en papel a escala 1:1 antes de avanzar
con la estética de la carcasa. El bisel fino, los soportes laterales y una
iluminación indirecta pueden desarrollarse después de confirmar estas medidas.

Fuentes locales: `projects/pad/README.md`, `config/pinouts/pad.ts`,
`config/prints/padPrints.ts` y fotos `pad-5-rev09-top.jpg` /
`pad-6-internals.jpg`. Los modelos anteriores de pantalla se consideran legados.

## Verificación realizada

Seis pruebas geométricas e inventario completas, barrido de 0° a 75° cada 1°,
importación de los tres GLB con Three.js y comparación de las dimensiones
calculadas por Python y el visor en doce combinaciones de variante y ángulo.
También se comprobaron las tres vistas, selección de componentes, espacios
reservados y anchos de 320/360 píxeles, sin solicitudes externas del visor.
La comprobación existente `npm run test:software` del repositorio también pasa.
