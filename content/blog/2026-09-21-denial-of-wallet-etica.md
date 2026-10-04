---
title: "Consumo de APIs de IA: límites y seguimiento"
date: "2026-09-21"
lang: "es"
summary: "Cómo definir límites de solicitudes, respuestas y uso de herramientas para controlar el consumo de una integración con IA."
tags: ["ia", "seguridad", "ética", "opinión"]
category: "referencia"
---

Una integración con IA necesita límites operativos además de una respuesta útil. Si una solicitud puede crecer, repetirse o ejecutar herramientas sin un tope, resulta difícil anticipar cuánto trabajo realizará el sistema.

OWASP incluye el consumo sin límites entre los riesgos de las aplicaciones con modelos de lenguaje. El problema puede afectar disponibilidad, recursos y costos. Las medidas propuestas incluyen límites de uso, control de recursos y seguimiento del consumo. [OWASP: Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).

## Definí qué se limita

Un límite de solicitudes por minuto no describe por sí solo el trabajo que genera cada solicitud. Revisá también el tamaño de entrada, la salida permitida, la concurrencia y las acciones que el modelo puede solicitar.

| Control | Pregunta de diseño |
|---|---|
| Solicitudes | ¿Cuántas puede iniciar cada usuario o cliente en un período? |
| Entrada | ¿Qué tamaño y formatos acepta la aplicación? |
| Salida | ¿Cuánto contenido puede generar una respuesta? |
| Herramientas | ¿Cuántas llamadas o reintentos puede ejecutar una operación? |
| Concurrencia | ¿Cuántas operaciones se procesan al mismo tiempo? |
| Duración | ¿Cuándo se cancela una operación que no termina? |

Los valores deben responder al uso previsto y a las pruebas del sistema. Un número elegido para una demostración no es una configuración universal.

## Diferenciá una alerta de un límite

Una alerta informa que se alcanzó un umbral. Un límite efectivo impide continuar la operación o rechaza trabajo adicional. Verificá cuál de esos comportamientos ofrece cada control del proveedor y cuál implementa tu aplicación.

El mismo criterio aplica a los reintentos: registrá cuándo ocurren, cuántos se permiten y cómo termina la operación si no se recupera. No los dejes crecer sin una condición de salida.

## Aplicalo en el punto que controla el recurso

Un botón del cliente puede evitar pulsaciones repetidas durante una consulta, pero no reemplaza las comprobaciones del servicio que acepta el trabajo. Si varios clientes comparten un servidor, definí dónde se contabiliza el uso conjunto.

En un prototipo local, empezá por registrar solicitudes, duración, fallos y operaciones simultáneas. Si incorporás un proveedor facturado, agregá el seguimiento de consumo que corresponda a su API y a sus condiciones.

## Probá qué ocurre al alcanzar cada límite

Para cada control, prepará un caso que lo alcance y comprobá:

- Que se rechace o cancele el trabajo según lo previsto.
- Que el usuario reciba un estado comprensible.
- Que no aparezcan reintentos automáticos sin fin.
- Que los recursos de la operación se liberen.
- Que el evento quede disponible para diagnóstico.

Esta guía describe criterios de diseño. No implica que todos estos controles estén implementados en los prototipos de HIOS: revisá el alcance publicado de cada proyecto.
