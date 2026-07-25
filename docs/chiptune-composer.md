# Compositor Chiptune HIOS — guía y formato

Herramienta para componer música chiptune (8-bit) desde el navegador y hacerla
sonar en un parlante HIOS (ESP32). Pensada para que cualquiera —incluidos los
juegos del ecosistema HIOS— tenga un lugar para hacer su música original, y para
que un asistente de IA pueda **generar canciones directamente** en un formato de
texto simple.

- **Composer web:** `/composer` (o Ctrl/Cmd+K → "Compositor Chiptune").
- **Reproductor device:** firmware `player` en `projects/speaker-test/`.
- **Modelo de datos:** [`lib/workbench/chiptune.ts`](../lib/workbench/chiptune.ts).
- **Contrato firmware:** [`SongFormat.h`](../projects/speaker-test/src/player/SongFormat.h) (espejado por `npm run test:song`).

---

## Flujo

1. Componés en `/composer` (piano-roll, voces chiptune, escucha en el navegador).
2. **Exportar para device** → genera el código wire (`.json`) y lo copia al portapapeles.
3. En la LAN abrís la página del parlante (`http://hioschip.local`) y **pegás** el
   código (o subís el `.json`). Suena en vivo.
4. El device **guarda la última canción** y la toca al encender (independiente:
   sin celular, Bluetooth ni red).

> ¿Por qué se pega en la página del device y no se "envía" desde openhios.dev? El
> sitio es HTTPS y el ESP habla HTTP en la LAN; el navegador bloquea ese cruce
> (mixed-content). Por eso el device sirve su propia página.

---

## Voces (instrumentos)

El índice es el `i` del formato wire (el orden es el contrato; ver `SongFormat.h`).

| i | id (`InstrumentId`) | sonido |
|---|---------------------|--------|
| 0 | `pulse-lead`     | pulso 25%, punchy (melodía) |
| 1 | `pulse-soft`     | pulso 50%, más suave |
| 2 | `triangle-bass`  | triángulo cálido (bajo) |
| 3 | `saw-lead`       | sierra brillante |
| 4 | `snes-lead`      | mezcla triángulo+pulso, cálida |
| 5 | `noise-perc`     | ruido; **el pitch elige el golpe**: grave (≤45) = bombo, agudo = hi-hat |

---

## Formato wire `v:2` (lo que consume el device)

JSON compacto y posicional. Lo produce `serializeDeviceSong()` en
`lib/workbench/chiptune.ts` (único productor).

```json
{
  "v": 2,
  "n": "Nombre de la cancion",
  "bpm": 120,
  "ppq": 480,
  "bpb": 4,
  "lb": 4,
  "t": [
    { "i": 0, "m": 0, "vol": 210, "no": [ [72, 0, 240, 100], [76, 240, 240, 100] ] },
    { "i": 2, "m": 0, "vol": 230, "no": [ [48, 0, 960, 90] ] }
  ]
}
```

Campos:

| campo | significado | rango / notas |
|-------|-------------|---------------|
| `v`   | versión del wire | debe ser `2` |
| `n`   | nombre | string (el device trunca a 31 chars) |
| `bpm` | tempo | 40–300 |
| `ppq` | ticks por negra | **480** (fijo; el tick-math lo asume) |
| `bpb` | pulsos por compás | ej. 4 |
| `lb`  | largo en compases | define el loop (`lb*bpb*ppq` ticks) |
| `t[]` | pistas | hasta **8** |
| `t.i` | instrumento | índice 0–5 (tabla de arriba) |
| `t.m` | muteada | `0` / `1` |
| `t.vol` | volumen | 0–255 |
| `t.no[]` | notas | hasta **512** en total (todas las pistas) |
| nota  | `[pitch, start, dur, vel]` | pitch MIDI 0–127, `start`/`dur` en **ticks**, vel 1–127 |

**Tiempo:** `ppq = 480` ticks por negra. Entonces: negra = 480, corchea = 240,
semicorchea = 120, blanca = 960. Una nota que empieza en el tick `start` y dura
`dur` ticks. Segundos ≈ `ticks * 60 / (bpm * 480)`.

**Notas MIDI:** 60 = C4 (Do central), 69 = A4 (La 440 Hz), +12 por octava. El
firmware convierte a Hz con `440 * 2^((m-69)/12)`.

**Tolerancia del device:** valores fuera de rango se recortan; pistas/notas de más
se descartan; instrumento desconocido → `pulse-lead`; JSON inválido → se ignora y
sigue sonando la canción anterior. Body máximo del POST: 16 KB.

---

## Cómo lo usa una IA para componer

Un asistente puede generar una canción emitiendo **directamente el JSON `v:2`**.
El usuario lo pega en la página del device (o, en el composer, se puede importar).

Receta:

1. Elegí `bpm`, `bpb`, `lb` (p.ej. 120, 4, 4 → loop de 4 compases = 7680 ticks).
2. Una pista de melodía (`i:0` o `i:4`), una de bajo (`i:2`), opcional percusión (`i:5`).
3. Poné notas en la grilla de semicorcheas (múltiplos de 120 ticks). Melodía en
   octavas 4–6 (MIDI 60–84), bajo en octavas 2–3 (MIDI 36–52).
4. Para percusión con `i:5`: pitch 36 = bombo, 42 = hi-hat, notas cortas (dur ~120).
5. Mantené el total de notas ≤ 512 y las pistas ≤ 8.

Ejemplo mínimo (un compás, melodía + bajo):

```json
{ "v":2, "n":"IA demo", "bpm":120, "ppq":480, "bpb":4, "lb":1,
  "t":[
    { "i":0, "m":0, "vol":210, "no":[[72,0,240,100],[74,240,240,100],[76,480,240,100],[79,720,480,100],[76,1200,240,100],[72,1440,480,100]] },
    { "i":2, "m":0, "vol":230, "no":[[48,0,960,90],[43,960,960,90]] }
  ] }
```

Enviarlo por consola:

```bash
curl -X POST http://hioschip.local/api/song \
  -H 'Content-Type: application/json' \
  --data-binary @cancion.device.json
```

---

## API del device (HTTP, puerto 80)

| método | ruta | qué hace |
|--------|------|----------|
| GET  | `/` | página para pegar/subir la canción |
| POST | `/api/song` | recibe wire `v:2`, lo guarda y lo toca (`{ok,tracks,notes,dropped}`) |
| GET  | `/api/status` | `{playing,name,bpm,tracks,notes,voices,heap,ip}` |
| POST | `/api/play` / `/api/stop` | reanuda / detiene |

---

## Canciones incluidas (dominio público)

Cinco clásicos universalmente conocidos y **legalmente limpios** (los soundtracks
de juegos famosos tienen copyright y no se incluyen). En
[`lib/workbench/chiptuneSongs.ts`](../lib/workbench/chiptuneSongs.ts):

1. **Korobeiniki** ("Tetris") — folk ruso.
2. **Himno de la Alegría** — Beethoven.
3. **In the Hall of the Mountain King** — Grieg.
4. **Für Elise** — Beethoven.
5. **Canon en Re** — Pachelbel.

Son arreglos compactos y editables: cargalos en el composer y modificalos.

---

## Anti-regresión

`npm run test:song` verifica que el formato no driftee entre la web
(`chiptune.ts`) y el firmware (`SongFormat.h`): constantes espejadas, **orden de
instrumentos idéntico** (el `i` decodifica al mismo instrumento en ambos lados),
y que las 5 canciones entren en los caps del device.
