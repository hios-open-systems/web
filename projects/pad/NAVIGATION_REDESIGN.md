# HIOS PAD - Navigation and Config Redesign

Este documento fija el norte antes de seguir sumando Views, acciones y pantallas. La idea es pagar ahora una deuda de arquitectura para que despues agregar funcionalidad sea mas rapido, menos riesgoso y configurable desde el pad o la companion.

## Objetivo

Convertir el pad en una consola configurable por datos:

```text
Menu -> Seccion -> View -> Card -> Gesture -> Action
```

El firmware, el admin, el mirror/emulador y la web remota deben compartir el mismo modelo conceptual. El TFT no deberia ser la fuente de verdad de la UI; debe renderizar una configuracion. La companion/admin tampoco deberia duplicar reglas a mano; debe editar el mismo modelo y enviarlo al pad en una forma compatible.

## Principios de implementacion

- Codigo claro y legible antes que abstracciones ingeniosas.
- Cambios chicos y verificables: mantener compatibilidad mientras migra el modelo.
- SOLID pragmatico: cada modulo con una responsabilidad concreta.
- Componentes reusables para firmware, mirror/emulador y gestion remota.
- Estilos separados de comportamiento: tokens, tema, layout y render no mezclados con acciones.
- Variables centralizadas para colores, tamanos, spacing, iconos, densidad, brillo y skins.
- Configurabilidad permanente: si un valor lo va a querer ajustar el usuario, debe vivir en config o en preferencias, no compilado.
- Skins intercambiables: misma data, distinta presentacion. Una skin no debe cambiar el significado de una View.
- Local-first: el pad debe seguir funcionando sin companion, y la companion potencia configuracion/OS/comandos.

## Estado actual relevante

Ya existe una buena base:

- `Action` es una union etiquetada con teclado, media, mouse, texto, macro, layer, companion cmd, launcher y reservas de red/gamepad.
- `KeyMap` modela bindings por input y labels para UI.
- `ConfigCodec` serializa/deserializa layers, bindings, ALT, textos y macros.
- La companion guarda una configuracion editable rica y resuelve acciones por OS antes de empujar al pad.
- El admin ya edita shortcuts, macros, textos, acciones per-OS y ALT.
- El launcher real ya viaja como `NET_LAUNCH` hacia la companion.

La deuda principal:

- El menu esta hardcodeado en `Menu.cpp` con paginas y nombres de layer.
- Las secciones no viven como datos editables.
- La UI del admin no crea/borra/reordena secciones, Views ni Cards.
- Algunas vistas especiales se deciden por nombre (`General`, `Red`, `Nucleos`, `Disco`).
- Los settings internos estan mezclados con items de menu especiales.
- El mirror/emulador todavia no consume un modelo de navegacion reusable.

## Vocabulario canonico

- **Menu**: entrada global de navegacion.
- **Seccion**: grupo de Views con sentido de producto (`Trabajo`, `Llamadas`, `Multimedia`, `Luces`, `Monitor`, `Sistema`, `Juegos`).
- **View**: pantalla activa del pad. Reemplaza mentalmente a `Layer`, aunque el rename de codigo se hace por etapas.
- **Card**: unidad visual accionable asociada a un boton fisico o virtual.
- **Gesture**: forma de activar una Card/Input (`tap`, `long`, `double`, `alt1Tap`, `alt2Tap`, `rotateCw`, `rotateCcw`).
- **Action**: efecto ejecutable (`key`, `media`, `macro`, `launch`, `companion`, `setting`, `view`, `sound`, `http`, `mqtt`, etc.).
- **Skin**: presentacion alternativa de la misma View/data. No es una View distinta.

## Modelo de config objetivo

El schema final puede versionarse como `v: 2` y convivir un tiempo con el schema actual.

```json
{
  "v": 2,
  "theme": {
    "skin": "cards",
    "accent": 0,
    "density": "normal"
  },
  "navigation": {
    "homeView": "edit",
    "alt": {
      "alt1View": "launcher",
      "alt2View": "macros",
      "lingerMs": 600
    },
    "sections": [
      {
        "id": "work",
        "label": "Trabajo",
        "icon": "briefcase",
        "color": "cyan",
        "views": ["edit", "dev", "apps", "browser"]
      }
    ]
  },
  "views": [
    {
      "id": "edit",
      "label": "Edicion",
      "section": "work",
      "kind": "cards",
      "color": "cyan",
      "skin": "cards",
      "encoder": {
        "cw": { "t": "mouse", "mode": 2, "wheel": 1 },
        "ccw": { "t": "mouse", "mode": 2, "wheel": -1 },
        "label": "Scroll"
      },
      "cards": [
        {
          "slot": 0,
          "label": "Copiar",
          "icon": "copy",
          "state": "none",
          "gestures": {
            "tap": { "t": "key", "mods": 1, "k": [99] },
            "long": { "t": "none" }
          }
        }
      ]
    }
  ],
  "actions": {
    "apps": [],
    "macros": [],
    "texts": [],
    "sounds": [],
    "net": []
  }
}
```

Notas:

- `views.kind` permite renderers especiales (`cards`, `monitor`, `wifi`, `settings`, `game`, `webContent`).
- `cards.slot` mapea a botones fisicos 0..9. El mirror puede renderizar los mismos slots virtuales.
- `gestures` permite sumar double-press sin romper `tap/long`.
- Las acciones per-OS siguen viviendo como config rica en companion y se aplanan para el firmware.
- Los IDs estables evitan depender de nombres visibles o indices.

## Mapa de hardware propuesto

- Botones 1-10: activan las Cards visibles de la View actual.
- ALT1 hold: cambia momentaneamente a `alt1View`; al soltar vuelve con linger configurable.
- ALT2 hold: cambia momentaneamente a `alt2View`.
- Encoder rotate en normal: accion de encoder de la View, o modo override.
- Encoder press: abre overview/menu.
- Encoder long: atras/cerrar/home segun contexto.
- Encoder double: cicla modo override (`View`, `Volumen`, `Scroll`, `Zoom`, `Pestanas`).
- Stick: mouse cuando `mouseOn`; navegacion direccional cuando el contexto sea menu/config.
- Stick click: seleccion/confirmacion en menu/config; configurable en Views normales.

## Arquitectura propuesta

### Firmware

- `Action`: mantener como contrato ejecutable, versionado con nuevos tipos si hace falta.
- `KeyMap`: conservar durante la migracion como runtime plano que el dispatcher ya entiende.
- `NavModel`: nuevo modelo de secciones, Views, Cards y gestures.
- `NavAdapter`: convierte config v2 -> `KeyMap` + metadata de navegacion para no reescribir todo de una vez.
- `MenuModel`: consulta secciones/Views desde `NavModel`, no desde arrays hardcodeados.
- `SettingsRegistry`: expone settings internos como acciones/config items (`brightness`, `theme`, `accent`, `wifi`, `calibrate`, `precision`, `led`).
- `ViewRenderer`: selecciona renderer por `view.kind`.
- `ThemeTokens`: colores, spacing, radios, tipografia, densidades y tokens de skin centralizados.

### Companion/admin

- Schema compartido TypeScript para config rica.
- Editor de navegacion: crear, borrar, reordenar secciones y Views.
- Editor de Cards: slot, label, icon, color, estado, gestures.
- Editor de Actions reusable: mismo componente para shortcut, macro step, launcher, soundboard, WiZ, HTTP/MQTT.
- Resolver por OS antes de empujar al pad.
- Import/export de perfiles.
- Validacion antes de guardar: IDs unicos, slots validos, actions soportadas por destino, limites de firmware.

### Mirror/emulador/web remota

- Consumir `NavModel`, no replicar el render TFT pixel a pixel.
- Renderizar slots, secciones, estado y feedback usando componentes web reutilizables.
- Separar tokens visuales del componente: CSS variables/design tokens.
- Permitir probar acciones sin flashear cuando la accion sea companion-side.

## Fases de migracion

### Fase 0 - Contrato y backlog

- Este documento.
- Backlog actualizado con arquitectura/config como proximo eje.
- No cambia funcionalidad visible.

### Fase 1 - Schema v2 y adaptador

- Definir tipos firmware/TS para `navigation`, `sections`, `views`, `cards`, `gestures`.
- Agregar adapter v2 -> `KeyMap`.
- Exportar config actual como v2 sin cambiar comportamiento.
- Validar con build de firmware y companion.

Estado actual:

- Iniciado en companion: `src/navigation/schema.ts` define `navigation/views` y deriva metadata desde
  el keymap plano actual.
- `configApi` enriquece `GET/POST /api/config` con metadata generada sin cambiar el firmware.
- Antes de empujar al pad, la companion quita `navigation/views` para no duplicar payload en el firmware
  hasta que exista soporte v2 nativo.
- La metadata queda marcada como `generated: true` y se regenera desde `layers` hasta que exista el
  editor real de navegacion.
- Firmware iniciado: `MenuModel` separa el origen de secciones del render y arma el menu desde el
  `KeyMap` cargado. Las Views extra que vengan por config entran en su seccion por grupo hasta el
  limite fisico de 10 slots.

### Fase 2 - Menu data-driven

- Reemplazar `PAGES[]` hardcodeado por `MenuModel` derivado del `KeyMap` cargado.
- Overview 5x2/10 botones segun cantidad de secciones.
- Mantener render visual actual para bajar riesgo.

Estado actual:

- `Menu.cpp` ya no contiene la lista de secciones/items; consume `MenuModel`.
- `MenuModel` mantiene templates por defecto, filtra Views inexistentes y agrega Views nuevas del
  keymap en secciones por `LayerGroup`/nombre.
- Cambio funcional subible: nuevas Views cargadas por config ya pueden aparecer en el menu sin tocar
  el render.

## Roadmap operativo desde el checkpoint subible

Este es el plan de continuidad para no volver a crecer por hardcode. Cada slice debe terminar en un
estado compilable/subible, aunque todavia conviva con el schema plano actual.

### Checkpoint actual

- Firmware subible: `Menu.cpp` consume `MenuModel`, y `MenuModel` arma secciones desde el `KeyMap` cargado.
- Companion genera `navigation/views` como metadata editable a futuro.
- Companion elimina `navigation/views` antes de enviar config al firmware, evitando duplicar payload hasta
  que exista soporte v2 nativo.
- Admin muestra una pestana read-only de navegacion para inspeccionar el modelo generado.
- Validaciones hechas: `pio run`, `pio run -e ota`, `npm run build` en companion y `git diff --check`.

### Antes de mergear este bloque

1. Revisar diff y confirmar que entren los archivos nuevos:
  - `projects/pad/NAVIGATION_REDESIGN.md`
  - `projects/pad/companion/src/navigation/schema.ts`
  - `projects/pad/src/ui/MenuModel.h`
  - `projects/pad/src/ui/MenuModel.cpp`
2. Decidir si `PENDING.md` queda local/privado o si alguna parte debe migrar a docs versionadas.
3. Repetir validacion final si hubo cambios:
  - `cd projects/pad && pio run`
  - `cd projects/pad && pio run -e ota`
  - `cd projects/pad/companion && npm run build`
  - `git diff --check -- projects/pad projects/pad/companion/src/web/configApi.ts projects/pad/companion/src/web/public/admin.html`
4. Si se quiere validar hardware antes del merge:
  - USB: `cd projects/pad && pio run -t upload`
  - OTA: `cd projects/pad && pio run -e ota -t upload`
5. Smoke test manual minimo en el pad:
  - Encoder press abre overview/menu.
  - Botones 1-10 seleccionan items visibles.
  - Secciones Apariencia/Sistema siguen ejecutando settings.
  - Views existentes siguen entrando desde menu.
  - Companion no rompe el envio de config al pad.

### Siguiente slice recomendado: Admin de navegacion editable

Objetivo: que la companion sea el primer lugar donde se pueda editar el modelo rico, sin exigir todavia
que el firmware lo parse directamente.

Pasos:

1. Cambiar `navigation.generated` a editable solo cuando el usuario toque la pestana Navegacion.
2. Permitir reordenar secciones y Views en admin.
3. Permitir asignar `homeView`, `alt1View`, `alt2View` y `lingerMs` desde el modelo de navegacion.
4. Persistir `navigation/views` en `config.edit.json` sin regenerarlo si `generated !== true`.
5. Mantener `toPadConfig()` como frontera: el firmware sigue recibiendo config plana resuelta.
6. Agregar validacion companion-side antes de guardar:
  - IDs unicos.
  - Views referenciadas existen.
  - Slots 0..9 sin duplicados dentro de una View.
  - ALT/Home apuntan a Views existentes.
  - Payload plano final entra en el limite actual del firmware.

Validacion del slice:

- `cd projects/pad/companion && npm run build`
- Abrir admin, editar orden/ALT, guardar, recargar y confirmar que se conserva.
- Enviar config al pad y verificar que no se mandan `navigation/views` al firmware.
- `cd projects/pad && pio run` si se toca contrato compartido o payload.

### Slice siguiente: Firmware v2 nativo

Objetivo: que el firmware pueda leer `navigation/views` y que `MenuModel` deje de depender de templates
internos como fuente principal.

Pasos:

1. Agregar tipos firmware `NavModel`, `NavSection`, `NavView`, `NavCard` con limites explicitos.
2. Extender `ConfigCodec` para parsear opcionalmente `navigation/views`.
3. Implementar `NavAdapter` v2 -> `KeyMap` para que el dispatcher actual siga funcionando.
4. Cambiar `MenuModel::begin()` para preferir `NavModel` si existe y caer a templates+`KeyMap` si no.
5. Mover settings internos a `SettingsRegistry` para representarlos como items/acciones, no casos sueltos.
6. Recién cuando eso compile y funcione, dejar de strippear `navigation/views` desde companion para firmwares
  compatibles.

Validacion del slice:

- Config vieja sin `navigation/views` sigue funcionando.
- Config nueva con `navigation/views` arma el mismo menu que el admin muestra.
- Payload grande no supera memoria/post limits.
- `cd projects/pad && pio run`
- `cd projects/pad && pio run -e ota`

### Slice siguiente: Cards y gestures como datos

Objetivo: que la segunda fila logica, double press y acciones alternativas nazcan del modelo, no de nuevos
ifs en render/dispatcher.

Pasos:

1. Definir `Gesture` firmware/TS: `tap`, `long`, `double`, `alt1Tap`, `alt2Tap`, `rotateCw`, `rotateCcw`.
2. Extender editor de Card con gestures.
3. Aplanar gestures soportados al `KeyMap` actual mientras el dispatcher migra.
4. Agregar `ActionRegistry` companion-side para reutilizar editores de key/media/macro/launch/net/settings.
5. Migrar Soundboard, WiZ scenes y OpenRGB como acciones companion-side registradas.

Validacion del slice:

- Una Card con `tap` y `long` conserva comportamiento actual.
- Una Card con `double` no afecta taps simples.
- Actions no soportadas por firmware quedan companion-side o bloqueadas por validacion.

### Orden recomendado de implementacion

1. Mergear/subir checkpoint actual.
2. Admin editable de navegacion, todavia con firmware plano.
3. Validadores de schema y payload.
4. Firmware v2 nativo con fallback al keymap actual.
5. Cards/gestures/action registry.
6. Mirror/emulador web consumiendo `navigation/views`.
7. Skins/tokens reales sobre el mismo modelo.

### Reglas para no desviarse

- Si una funcionalidad nueva pide menu, primero decidir en que `Section/View/Card/Gesture/Action` vive.
- Si algo necesita un nombre visible, tambien necesita un ID estable.
- Si una accion depende del sistema operativo o de archivos locales, vive en companion y el pad solo dispara.
- Si un dato lo puede querer cambiar el usuario, no debe quedar compilado salvo que sea fallback.
- Si un cambio toca firmware y companion, validar ambos antes de cerrar el slice.
- Si aparece una feature tentadora pero no entra en el modelo, documentarla en backlog y no hardcodearla.

### Fase 3 - Admin de navegacion

- Nueva seccion `Navegacion` en admin.
- Crear/reordenar secciones y Views.
- Asignar Views a ALT1/ALT2.
- Mover Cards entre slots.

### Fase 4 - Action registry y templates

- Catalogo unico de acciones.
- Templates para Llamadas, Media, Launcher, Monitor, WiZ, Soundboard, Macros.
- Agregar pendientes funcionales como datos/templates, no como hardcode nuevo.

### Fase 5 - Mirror/emulador

- Panel virtual basado en modelo.
- Vista live de estado del pad.
- Simulacion de taps/gestures donde sea seguro.

### Fase 6 - Skins reales

- Tokens por skin.
- Renderers que comparten datos.
- Personalizacion de apariencia/LED desde admin y pad.

## Backlog funcional que debe colgar de este modelo

- Segunda fila logica: `double` y gestures alternativos por Card.
- Face-by-face de Meet/Slack/Multimedia/Netflix/Spotify/Disney+/Paramount/WiZ.
- Soundboard companion-side.
- WiZ scenes como acciones companion.
- RGB/OpenRGB via companion, no atajos globales fragiles.
- Apariencia, brillo, tema, LED y skins desde config.
- Juegos como `view.kind = game` al final.
- Clima/noticias como Views de contenido.

## Definition of done para cambios del rediseño

- El cambio tiene una unica fuente de verdad de datos.
- El admin y el firmware usan el mismo concepto, aunque uno tenga representacion rica y otro plana.
- No se agregan nombres magicos nuevos sin ID estable.
- Los estilos/tokens no quedan mezclados con logica de acciones.
- El cambio es compatible con mirror/emulador.
- Hay fallback local si la companion no esta corriendo.
- Build/validacion correspondiente ejecutada o skip documentado con causa.
