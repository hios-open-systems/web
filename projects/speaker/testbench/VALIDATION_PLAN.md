# Plan de validación técnica

## 1) Encendido y consumo

- Boot del ESP32 sin brownout.
- Medir corriente en idle y con tono activo.
- Confirmar que 5V no cae por debajo de umbral operativo.

## 2) Verificación de canales L/R

- Reproducir tono solo izquierda y luego solo derecha.
- Confirmar correspondencia física de cada parlante.
- Corregir SD/cableado si hay cruce de canales.

## 3) Prueba estéreo simultánea

- Reproducir señal estéreo con diferencia entre canales.
- Confirmar salida simultánea en ambos módulos sin cortes.

## 4) Ruido, distorsión y cortes

- Evaluar ruido en silencio (idle y playback).
- Subir volumen por escalones y detectar punto de distorsión.
- Registrar cortes, pops o clipping percibible.

## 5) Térmica y estabilidad

- Reproducción continua mínima de 30 minutos.
- Verificar ausencia de reinicios y temperatura razonable de módulos.
- Registrar comportamiento al final de la corrida.

---

## Criterios de aceptación

- Audio limpio sin ruido anómalo dominante.
- Canales L/R correctamente asignados.
- Sin reinicios del ESP32 durante pruebas.
- Sin caídas de alimentación críticas.
- Operación estable durante corrida prolongada.
