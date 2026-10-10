# Revisión de contenido de HIOS

Fecha: 10 de octubre de 2026. Criterios editoriales y registro de la revisión. No es una prueba de comprensión con usuarios.

## Revisión aplicada

Corrección de alcance: mejorar la redacción no autoriza ocultar accesos ni sustituir nombres de secciones reconocibles. Maker · visor STL y Devlog conservan sus nombres y tienen acceso desde la navegación de secciones, el menú móvil, el inicio, el pie y el buscador. Las demás secciones también deben permanecer disponibles; cualquier cambio de arquitectura de navegación se evalúa aparte.

Se revisaron las descripciones del catálogo de herramientas, la navegación, Explorar, Mis espacios, ayudas, mensajes de estado, configuración, comentarios, tutoriales, pinouts y calculadoras. También se revisaron las fichas de proyectos y software, el catálogo de software externo y el de impresión 3D. Se conservaron las descripciones técnicas que ya explicaban funciones y límites concretos. Los artículos de referencia consultados sobre modelos locales y desarrollo con IA ya siguen ese criterio; no se reescribieron para introducir variaciones de estilo.

Los cambios compartidos de navegación, espacios, guardado y comentarios se adaptaron a español, inglés, alemán e italiano. El español usa voseo y nombres consistentes. Los catálogos técnicos que ya eran exclusivamente españoles siguen en español; esta revisión no constituye su traducción completa.

| Antes | Ahora | Motivo |
| --- | --- | --- |
| Workbench / Stack / Devlog | Herramientas / Software / Documentación | Nombrar los destinos por su contenido. |
| ¿En qué estás trabajando? | Herramientas y proyectos | Identificar el catálogo sin una pregunta decorativa. |
| Guardar preset | Guardar configuración | Explicar la acción sin jerga innecesaria. |
| Proyecto o referencia guardada en este espacio | Descripción propia del recurso; resumen localizado para artículos | Evitar repetir la misma frase en cada tarjeta. |
| Local-first y privado | Procesamiento | No convertir una ubicación de cálculo en una promesa general de privacidad. |
| Cuando llegue la auth se sincroniza… | El registro de errores permanece en el navegador | El proveedor de comentarios no sincroniza ese registro. |
| Te llega cuando vuelva la conexión | No se pudo enviar; consultar la copia local y reenviar | El envío no implementa reintentos automáticos. |
| Programación sin cables | Carga de firmware por puerto serie | Corregir la descripción de ESP Web Tools. |
| Referencia rápida + gotchas | Descripción del módulo y sus interfaces | Quitar jerga que no aporta información. |
| Próximamente… se editan en config/prints.ts | Estado vacío con acceso a otros repositorios | No mostrar instrucciones de implementación al visitante. |

Se retiraron la fila de afirmaciones repetidas del hero, la segunda frase genérica del pie y etiquetas que repetían los títulos. Los nombres accesibles del encabezado ahora usan el idioma seleccionado.

### Comprobaciones de comportamiento

- `WorkspaceProvider.tsx`: los espacios de una cuenta se sincronizan al cargar, al recuperar conexión y después de cambios; la importación de espacios anónimos es opcional.
- `PresetControls.tsx`: la vista previa distingue datos guardados en el navegador de datos enviados a la cuenta. El contenido se muestra completo en el guardado local.
- `lib/feedback/submit.ts` y `FeedbackProvider.tsx`: envío remoto y registro local independientes, sin cola de reintentos.
- `SnippetsShelf.tsx`: la importación completada elimina la copia local; el mensaje lo explica.
- `migrations/0006_workspaces.sql`: eliminar una cuenta también elimina sus espacios y configuraciones. La confirmación enumera esos datos.
- `PrivacySettings.tsx`: un error al borrar almacenamiento ya no muestra una confirmación de éxito. La prueba de navegador simula almacenamiento bloqueado.
- Las descripciones externas se contrastaron con [ESP Web Tools](https://esphome.github.io/esp-web-tools/) y [OrcaSlicer](https://github.com/OrcaSlicer/OrcaSlicer). Se eliminaron calificativos promocionales y la descripción incorrecta de programación sin cables.

La validación combina compilación, lint, paridad de claves, pruebas de persistencia y navegación, y comprobaciones de ancho móvil. Estas pruebas detectan errores funcionales y de presentación; no sustituyen una evaluación con personas.

## Plan original y criterios de continuidad

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
