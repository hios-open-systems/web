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

## Alcance pendiente

La recuperación del diseño no completa todo el temario. Quedan por desarrollar en el mismo formato las próximas lecciones de ondas, propagación y Morse. El programa existente sigue disponible como material complementario. La propuesta de frecuencias licenciadas/no licenciadas y canales de emergencia requiere un trabajo separado con fuentes oficiales vigentes para Argentina.

## Verificación de la recuperación

Pasaron `npm run lint`, `npx tsc --noEmit`, `npm run build`, las comprobaciones de circuitos, electrónica, traducciones, radio y espacios, y las validaciones de SEO y sitemap sobre las páginas generadas. Se verificaron las 31 pruebas de radio en cinco archivos (incluidos móvil y tableta), corrigiendo los selectores de descubrimiento para usar el catálogo Explorar actual. La revisión visual de portada, tensión, bandas y laboratorio no encontró desbordamientos, errores de ejecución ni conexiones externas implícitas.
