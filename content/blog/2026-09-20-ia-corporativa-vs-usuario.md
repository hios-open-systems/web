---
title: "Servicios remotos y control local: cómo elegir las dependencias"
date: "2026-09-20"
lang: "es"
summary: "Qué revisar al conectar un dispositivo a servicios externos y cómo definir qué funciones deben seguir disponibles sin esa conexión."
tags: ["ia", "opinión", "open-source", "democratización"]
category: "referencia"
---

Un dispositivo conectado puede depender de varios sistemas: su firmware, la red local, un servidor y una API externa. Cada dependencia agrega capacidades y también condiciones de uso, mantenimiento y disponibilidad.

El diseño empieza por una pregunta concreta: ¿qué debería poder hacer el dispositivo cuando alguna de esas partes deja de responder?

## Separá las funciones y sus requisitos

Una consulta a un modelo de lenguaje puede necesitar un servidor. La lectura de un botón o una acción local pueden tener requisitos distintos. Definí esas diferencias antes de conectar todo en un mismo flujo.

| Aspecto | Servicio remoto | Servicio en la red local |
|---|---|---|
| Conectividad | Requiere acceso al servicio a través de internet. | Requiere acceso al equipo que lo ejecuta. |
| Operación | Depende del proveedor y de la configuración de la cuenta. | Requiere mantener el equipo, el software y la red. |
| Datos | Revisá qué información se envía y cómo se trata. | Revisá accesos, registros y servicios externos utilizados. |
| Cambios | Seguí versiones, límites y condiciones de la API. | Administrá versiones y compatibilidad de los componentes. |

«Local» no significa automáticamente «sin conexión»: un dispositivo que consulta un servidor en la red sigue dependiendo de ese servidor. Tampoco define por sí solo la latencia, la privacidad o la seguridad del sistema.

## Definí el comportamiento ante fallos

Para cada consulta de red, establecé qué debe ocurrir si no llega una respuesta, si el formato no es válido o si el servicio rechaza la solicitud. Mostrá un estado que permita distinguir esos casos.

Cuando una operación tarda, la interfaz debería comunicarlo. Si la arquitectura permite separar la consulta de la interacción física, comprobá igualmente cómo se coordinan ambas partes y qué recursos comparten.

Una respuesta generada tampoco debería convertirse directamente en una orden de hardware. Validá el formato, los valores permitidos y la autorización para ejecutar la acción. La decisión sobre qué puede hacer el dispositivo pertenece a la lógica de la aplicación.

## Qué aporta el código disponible

Tener acceso al firmware y a la documentación permite inspeccionar dependencias, adaptar comportamientos y reproducir pruebas. Para hacerlo, también necesitás instrucciones de compilación, versiones identificadas y una licencia que permita el uso previsto.

Esa disponibilidad facilita la revisión, pero no reemplaza las pruebas ni garantiza que todas las funciones estén terminadas. Consultá el estado de cada proyecto y sus limitaciones.

## Un ejemplo en HIOS

El prototipo Node AI consulta Ollama desde un ESP32-S3 y muestra la respuesta en una pantalla OLED. El modelo se ejecuta en otro equipo: el microcontrolador necesita conectarse a ese servidor para obtener una respuesta.

Esa separación permite estudiar la integración entre un dispositivo y un modelo local sin presentar la inferencia como una función que ya corre dentro del ESP32. Las funciones de audio y TinyML mencionadas en el material de diseño siguen siendo desarrollos pendientes.

## Antes de elegir una arquitectura

- Enumerá las funciones que requieren red y las que deben funcionar sin ella.
- Definí tiempos de espera y estados de error comprensibles.
- Revisá qué datos salen del dispositivo y hacia dónde.
- Documentá las versiones y los requisitos de cada servicio.
- Probá desconexiones y respuestas inválidas, además del funcionamiento normal.
