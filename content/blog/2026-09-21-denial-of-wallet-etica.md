---
title: "Denial of Wallet: ética, asimetría y el costo de la indignación"
date: "2026-09-21"
lang: "es"
summary: "Qué es un Denial of Wallet, por qué la venganza técnica contra un chatbot corporativo es un mal negocio, y dónde realmente les duele."
tags: ["ia", "seguridad", "ética", "opinión"]
category: "devlog"
---

Después del episodio que conté en mi post anterior, cuando me encontré bloqueado y peleando contra el bot inútil de un banco, pasé por varias etapas de duelo. Y como soy desarrollador, la etapa de "ira" vino acompañada de ideas técnicamente viables.

La tentación de la venganza técnica es inmensa. Si el sistema te arruina el día con un chatbot automatizado, el primer instinto visceral es devolverle el favor. La lógica es simple: vos automatizaste la frustración hacia mí, ahora yo voy a automatizar mi indignación hacia vos. Y ahí entra en juego el concepto de *Denial of Wallet* (DoW).

## El Denial of Wallet

Un ataque de Denegación de Billetera (DoW) no busca tirar abajo un servidor como el clásico DDoS. Lo que busca es agotar los recursos financieros asociados al consumo de una API. Si el banco usa un modelo que cobra por token (sea OpenAI, Anthropic, o cualquier proveedor cloud) para alimentar a su chatbot, la idea de un DoW es generar un flujo constante, masivo e ininterrumpido de interacciones extremadamente complejas. Queries llenas de tokens, con un contexto larguísimo, que fuercen al modelo a pensar, computar y facturar. 

Cada segundo que el bot está respondiendo un prompt ofuscado sobre la filosofía de Kant mezclada con reclamos bancarios inventados, es plata que el banco está pagando a su proveedor.

La bronca es legítima. Vivimos en un sistema diseñado meticulosamente para que el poderoso pueda joder al menos poderoso sin despeinarse. Cuando tenés los medios para devolver el golpe usando las mismas armas (o al menos explotando sus debilidades), la tentación es dulce.

Pero hay un problema gigante: **no funciona.**

## Matemáticas y Presupuestos

Creés que les estás haciendo daño, pero en realidad ni lo notan.

El CEO del banco no se entera si le saturás el bot. El CFO no transpira. A lo sumo, una mañana, le cae una alerta de CloudWatch a un pibe de operaciones (que probablemente esté más quemado que vos) avisando que hay un pico inusual de consumo en la API. Ese pibe va a apretar un botón, meter un rate-limit en el WAF o bloquear tu IP, y seguirá tomando mate.

El presupuesto de IT de una entidad financiera es obsceno. Tus tokens, por más scripts de Python que tengas corriendo en paralelo, son centavos. Tratar de fundir a un banco gastando su saldo de OpenAI es como intentar vaciar el océano con un gotero.

## El costo real de la indignación

Acá es donde el DoW se vuelve un pésimo negocio para vos. Mientras el banco gasta unas monedas que ni siquiera registran como pérdida, vos estás invirtiendo horas de tu inteligencia, configurando scripts, saltando captchas y gastando tu propia energía mental (y eléctrica) armando un ataque inútil. 

Estás pagando la inoperancia de ellos con tu propia tranquilidad.

La indignación es un recurso carísimo. Agota, consume ancho de banda cognitivo y te deja exhausto. Hay que elegir muy bien dónde invertir ese combustible.

## Dónde les duele de verdad

Si querés joder al sistema en este contexto particular, la tecnología no es la mejor arma. La burocracia sí.

¿Dónde les duele? COPREC, Defensa del Consumidor, BCRA. Instituciones que, cuando reciben un reclamo formal, obligan a la corporación a activar procesos manuales. 

Ese reclamo formal no lo responde una IA. Obliga al banco a poner a un abogado o a un analista legal a leer un expediente, armar un descargo y sentarse en una mediación (aunque sea virtual). El tiempo de ese departamento legal, la hora hombre del abogado y las posibles multas son muchísimo más caros que los millones de tokens de cualquier IA. Es asimétrico, pero a la inversa: vos gastás media hora llenando un formulario, y a ellos les cuesta miles de pesos en tiempo humano especializado.

## El síndrome del Capitán América

Todo esto me lleva a una reflexión de fondo. La tecnología amplifica poder. En un sistema que ya está desbalanceado, simplemente amplifica esa desigualdad. Tenemos que reconocer que la Inteligencia Artificial (incluso cuando usamos modelos open source) opera dentro de estas mismas dinámicas de poder.

La brújula moral de querer equilibrar la balanza funciona bien, pero la estrategia de desgaste técnico no. Es el "síndrome de Capitán América": la intención es noble, pero pelear contra el ejército con los puños desnudos termina mal para vos. 

Ser quirúrgico. No reactivo. Si vamos a pelear batallas, asegurémonos de que el costo lo paguen ellos, no nuestra propia salud mental. Y mientras tanto, sigamos construyendo las alternativas que no dependan de sus APIs.
