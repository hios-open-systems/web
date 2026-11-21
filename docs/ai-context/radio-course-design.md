# Documentación de radio: diseño acordado

El usuario pidió retomar este diseño el 20 de noviembre de 2026. Se recuperó el avance de `559af4e`, conservado en `backup/local-main-2026-11-20`, y se integró con la guía existente.

## Criterio de presentación

- Una portada breve con el índice de estudio. No juntar todos los conceptos, el glosario y el laboratorio en una página larga.
- Cada tema tiene su página: tensión, corriente, resistencia, ley de Ohm, serie, paralelo, potencia, medición y práctica.
- Cada explicación conserva su definición, gráfico y ejemplo. Mantener la navegación lateral en escritorio, el selector en móvil y los enlaces anterior/siguiente.
- Bandas, laboratorio, glosario y fuentes son recursos separados. En bandas, el eje común con los límites de frecuencia aparece primero; la tabla, las antenas y los modos complementan el gráfico debajo.
- Conservar el aspecto del curso recuperado: tipografía, ancho de lectura, espaciado, colores del tema y diagramas. Agregar contenido siguiendo estos componentes. Cambiar este criterio requiere un pedido del usuario.

## Rutas

- `/[locale]/radio`: entrada principal e índice del curso.
- `/[locale]/radio/lecciones/[chapter]`: lecciones y recursos del curso recuperado.
- `/[locale]/radio/programa`: índice de la guía del programa Novicio ya existente, con sus capítulos, simuladores, Morse y práctica.
- Los capítulos originales `/[locale]/radio/[chapter]` y la versión para imprimir conservan sus direcciones.
- `/[locale]/workbench/radio-basics` y sus lecciones redirigen a las rutas del curso.

El catálogo Explorar y la calculadora de Ohm enlazan al curso. Las fuentes mantienen el PDF de repaso original (`guia-radioaficionado-novicio.pdf`, con las erratas advertidas). Se comprobó que el archivo existente era idéntico al del avance recuperado; no se reemplazó.

## Alcance del curso

El índice reúne doce lecciones. Después de la práctica de electricidad se estudian ondas, propagación y Morse, con diagramas y ejemplos resueltos. El árbol Morse permite formar una letra y escucharla. El programa existente sigue disponible como material complementario. La propuesta de frecuencias licenciadas/no licenciadas y canales de emergencia requiere un trabajo separado con fuentes oficiales vigentes para Argentina.

## Verificación de la recuperación

Pasaron `npm run lint`, `npx tsc --noEmit`, `npm run build`, las comprobaciones de circuitos, electrónica, traducciones, radio y espacios, y las validaciones de SEO y sitemap sobre las páginas generadas. Se verificaron las 31 pruebas de radio en cinco archivos (incluidos móvil y tableta), corrigiendo los selectores de descubrimiento para usar el catálogo Explorar actual. La revisión visual de portada, tensión, bandas y laboratorio no encontró desbordamientos, errores de ejecución ni conexiones externas implícitas.

## Fórmulas en móvil

El 21 de noviembre el usuario pidió revisar su lectura desde el celular. Cada ecuación completa usa `MathLine`: conserva números, índices, exponentes y denominadores juntos; si no entra, tiene desplazamiento horizontal propio y acceso con teclado. Separar ecuaciones independientes y desarrollar los cálculos largos del laboratorio en pasos breves. No aplicar cortes por carácter a las expresiones. El papel conserva el ajuste al ancho imprimible.

La revisión también corrigió tres inconsistencias heredadas de los simuladores: la onda USB coincide con `fc + fm`, las armónicas filtradas se expresan respecto de su propia portadora en dBc y los límites de resonancia usan los puntos exactos de media potencia. Se cubren con pruebas numéricas en `scripts/radio-selftest.ts`. Las regresiones de lectura móvil están en `tests/mobile-radio-math.spec.ts` y forman parte de la validación de publicación.

Al aclarar el usuario que desconfiaba de los resultados, se revisaron los ejemplos y los simuladores. El laboratorio conserva ahora las potencias pequeñas: 1 V sobre dos resistores de 1 kΩ en serie muestra 0,0005 W de total y 0,00025 W por resistor, en lugar de redondear a cero. El circuito abierto ideal muestra ROE infinita; el semidipolo de ejemplo se redondea a 10,04 m; las conversiones A→mA quedan explícitas. Se corrigieron además las definiciones de Q (factor 2π) y PIRE (ganancia lineal), y los pasos redondeados de la pérdida en espacio libre. La escala del dibujo de antenas contempla tanto su altura como su ancho.

La versión corregida pasó las 49 pruebas de radio (incluidos resultados de simuladores y pantallas de 320, 390 y 768 px), los 55 grupos de self-tests, lint, TypeScript, build, SEO y sitemap.
