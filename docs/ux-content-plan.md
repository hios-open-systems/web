# Revisión de contenido: Explorar y Mis espacios

Fecha: 10 de octubre de 2026. Propuesta editorial para revisar con la interfaz local; no es una auditoría de usuarios ni una reescritura completa del sitio.

## Qué tiene que resolver el contenido

Una persona debe poder identificar una herramienta, abrirla, guardarla para después y encontrarla de nuevo. El texto tiene que explicar esas decisiones. Una frase más simpática no arregla un destino ambiguo ni una acción que no funciona.

La primera revisión abarca `Workspace`, `Workbench.landing`, `Workbench.packs`, la navegación y los estados de guardado. Después siguen las pantallas de herramientas, proyectos y documentación. Se trabaja primero en español rioplatense y se adapta a los otros idiomas cuando la terminología está resuelta.

## Diagnóstico inicial con textos del repositorio

| Texto revisado | Problema | Decisión propuesta |
| --- | --- | --- |
| «Tus herramientas, proyectos y configuraciones guardadas en un mismo lugar.» | Enumera categorías, pero no explica qué hace un espacio. | «Armá una lista de herramientas y proyectos para volver a usarlos.» |
| «Workbench» y «Mi Workbench» | Se parecen, pero uno es un catálogo y el otro guarda selecciones personales. | Mantener «Mis espacios» para las selecciones. Evaluar «Herramientas» para el catálogo sin cambiar las rutas. |
| «Agregar al espacio» repetido como única acción | No dice a qué espacio; puede parecer obligatorio para usar la herramienta. | Destacar «Abrir». Al guardar, mostrar los espacios disponibles y marcar los que ya contienen el recurso. |
| «Vacío» / «Espacio vacío» | Describe el estado sin ayudar a salir de él. | Explicar qué se puede agregar y ofrecer «Explorar recursos». |
| «Preset» | Es jerga innecesaria fuera de la herramienta; no aclara si guarda ajustes o datos. | Evaluar «Configuraciones guardadas». Explicar el contenido en el momento de guardar. |
| «Escenarios de memoria para IA» | No permite anticipar fácilmente qué dato se ingresa y qué resultado se obtiene. | Evaluar «Estimación de memoria para modelos». Conservar la advertencia sobre el cálculo aproximado junto al resultado. |
| «Generá interfaces y tipos de TypeScript a partir de un ejemplo JSON.» | Explica entrada y resultado sin prometer más de lo que hace. | Conservar. No reescribir por variedad. |
| «Tu primera mesa de trabajo» | Introduce una metáfora adicional para el mismo objeto. | Preferir «Todavía no creaste un espacio». |

## Vocabulario de trabajo

- **Herramienta:** una utilidad que se abre y se usa, como el editor de JSON.
- **Recurso:** término colectivo para herramientas, proyectos, artículos y referencias. En acciones específicas, usar el nombre concreto cuando sea posible.
- **Espacio:** lista personal de accesos para una tarea o proyecto. No es una carpeta que contiene copias de esos proyectos.
- **Guardar en un espacio:** agregar un acceso. Debe poder distinguirse de guardar los datos o la configuración de una herramienta.
- **Quitar:** sacar un acceso de una lista. **Eliminar espacio:** borrar esa lista; explicar que no elimina el proyecto ni la herramienta.
- **Configuración guardada:** candidata a reemplazar «preset». Si también contiene datos ingresados, debe decirlo expresamente.
- **Guardado en este dispositivo / sincronizado / pendiente:** estados distintos, con texto que coincida con lo que realmente ocurrió.

## Plan de trabajo

1. **Inventario por recorrido.** Registrar pantalla, clave de traducción, texto actual, acción que explica y destino. Marcar duplicaciones, jerga, afirmaciones no verificadas y mensajes sin siguiente paso. Prioridad: navegación, guardado y recuperación; luego descripciones; al final ayuda secundaria.
2. **Comprobar el comportamiento.** Abrir cada herramienta antes de redactar su descripción. Anotar entrada, salida, límites y requisitos reales. No atribuir precisión, privacidad, formatos o sincronización que no estén comprobados.
3. **Resolver nombres.** Probar «Herramientas / Explorar / Mis espacios» como tres destinos diferenciados. Decidir si los tres aportan algo o si hay duplicación de navegación. No compensar una arquitectura confusa con un párrafo explicativo.
4. **Redactar una muestra representativa.** Trabajar una herramienta de datos, una de audio y una de hardware; además, guardar un recurso, crear un espacio, quitar un acceso, borrar un espacio y recuperar un error. Entregar antes/después con la razón de cada cambio.
5. **Revisar en pantalla.** Leer con el ancho real de una tarjeta y en móvil. Eliminar texto que repite un título, no cambia una decisión o describe lo que ya se ve. Comprobar que botones y estados no dependan de haber leído la introducción.
6. **Extender y traducir.** Aplicar los criterios al resto de recursos, manteniendo los textos que ya funcionan. Adaptar inglés, alemán e italiano; comprobar claves, plurales, truncamientos y nombres accesibles.

## Criterios de escritura

- Nombre reconocible, descripción concreta y acción predecible. Evitar títulos ingeniosos para funciones comunes.
- Voseo consistente; tono directo, técnico cuando hace falta. No forzar simpatía ni usar muletillas para parecer humano.
- Cada descripción debe aportar un dato propio de esa herramienta. Si puede pegarse en diez tarjetas, hay que revisarla.
- No comenzar todas las frases con la misma estructura por obligación. Tampoco variar palabras si eso cambia el significado de un control.
- Evitar «potenciá», «descubrí el poder», «todo en un solo lugar», «experiencia intuitiva» y promesas sin evidencia.
- Mantener límites reales. Moverlos al lugar donde afectan la decisión; no quitarlos sólo porque hacen menos atractivo el texto.
- Usar ejemplos breves y comprobables cuando aclaran una entrada o una salida. No llenar la interfaz de ejemplos decorativos.

## Cómo validar

Recorridos: abrir un JSON sin crear un espacio; guardarlo en un espacio nuevo; volver después de recargar; distinguir quitar un acceso de eliminar una lista; entender dónde están guardados los datos. Revisar con teclado y en móvil.

Para una prueba con personas, pedir esas tareas sin explicar la navegación. Registrar primer clic, dudas y errores de interpretación. Todavía no se hizo esa prueba: la revisión del código y las pruebas automáticas no demuestran comprensión humana.

Se considera lista cada tanda cuando sus afirmaciones están verificadas, los controles nombran acciones reales, se puede completar el recorrido sin explicación externa y los cuatro idiomas conservan el mismo significado. No usar detectores de IA como criterio de calidad.
