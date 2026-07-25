# HIOS Speaker Testbench (Pre-Integración)

Repositorio de pruebas para validar **hardware, cableado y calidad de audio** antes de montar el proyecto final en el dispositivo target.

## Objetivo

Verificar con un ESP32 + **2 módulos MAX98357A** + **2 parlantes recuperados (Bangho Max 1524)**:

- Alimentación estable (sin reinicios ni brownouts)
- Bus I2S funcional
- Asignación correcta de canales L/R
- Audio usable (sin ruido o distorsión crítica)
- Estabilidad térmica y de reproducción continua

## Hardware bajo prueba

- ESP32 DevKit (WROOM-32)
- 2× MAX98357A (uno por canal)
- 2× parlantes reciclados de notebook Bangho Max 1524
- Fuente de laboratorio o buck regulado a 5V
- Multímetro (obligatorio)

## Estructura

- `PINOUT.md` — conexiones y validación de L/R
- `VALIDATION_PLAN.md` — plan técnico + criterios de aceptación
- `CHECKLIST_PRE_MONTAJE.md` — checklist final antes de pasar al proyecto real
- `firmware/` — sketches de prueba por etapa
- `results/` — evidencia y logs de pruebas

## Flujo recomendado

1. Validar energía sin carga de audio.
2. Cargar `firmware/01_power_i2s_smoke.ino`.
3. Cargar `firmware/02_channel_check_lr.ino`.
4. Cargar `firmware/03_stereo_stability.ino`.
5. Registrar cada corrida en `results/logs/`.
6. Completar `CHECKLIST_PRE_MONTAJE.md`.

## Criterio de salida

No pasar al proyecto final hasta cumplir todos los criterios de `VALIDATION_PLAN.md` y checklist completo.
