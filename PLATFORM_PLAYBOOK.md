# PLATFORM_PLAYBOOK.md

Reglas operativas para que el workbench siga siendo local-first sin terminar con datos duplicados, contratos ambiguos o features a medio cerrar.

## 1. Principios

- Local-first por default. La experiencia base tiene que servir sin login.
- Auth es opt-in y agrega backup, sync, ownership y share. No gatea la utilidad principal.
- Cada dato tiene una sola fuente de verdad por modo. Si anonimo y logueado tienen reglas distintas, se escriben explicitas.
- No se hacen merges silenciosos entre local y cloud. Si hay migracion, se ofrece una accion explicita de import o replace.
- Todo feature con red define contrato antes de tocar UI profunda.

## 2. Ownership de datos

| Dato | Usuario anonimo | Usuario con sesion | Rol de la nube | Nota operativa |
| --- | --- | --- | --- | --- |
| Sesion | N/A | Cookie opaca + D1 | Canonico | Si D1 falla, la app vuelve a comportarse como anonima. |
| Theme accent | `localStorage` | `localStorage` hoy, D1 despues | Backup futuro | El cambio visual aplica local inmediato; el sync no debe bloquear UI. |
| Feedback inbox | `localStorage` | `localStorage` | Ninguno por ahora | Primero sirve para capturar y revisar; uplink a servidor es un paso posterior. |
| Snippets | `localStorage` | D1 canonico + cache local | Backup + share | Al iniciar sesion, los snippets locales se importan con una accion explicita. |
| Estado transitorio de tools | URL o estado cliente | URL o estado cliente | Ninguno | No persistir por default salvo que el valor tenga utilidad real fuera de la tab. |

## 3. Regla para features con sync

Cuando una feature pase de local-only a local-plus-cloud:

1. El modo anonimo sigue funcionando completo dentro de su alcance local.
2. En modo logueado, el servidor pasa a ser la fuente canonica para los datos sincronizados.
3. El cache local se usa para arranque, resiliencia o UX, pero no como segunda verdad.
4. La migracion anonimo -> cuenta se resuelve con import explicito, nunca con merge silencioso.
5. Si la escritura remota falla, la UI muestra estado claro y conserva la copia local hasta que el usuario decida reintentar.

## 4. Contrato minimo antes de codear una API

Antes de abrir un slice con red, escribir aunque sea en borrador:

- entidades y ownership
- endpoints y auth requerida
- shape exacto de request y response
- validaciones y errores esperados
- idempotencia y estrategia de retries
- criterio de optimistic/pessimistic update
- comportamiento de import desde local
- smoke test minimo del golden path

Si esto no esta escrito, el slice todavia no esta listo para UI profunda.

## 5. Contrato propuesto para snippets

### Modelo

```ts
interface SnippetRecord {
  id: string;
  title: string;
  body: string;
  tags: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Rutas privadas

- `GET /api/snippets` -> `200 { snippets: SnippetRecord[] }`
- `POST /api/snippets` -> `201 { snippet: SnippetRecord }`
- `PATCH /api/snippets/:id` -> `200 { snippet: SnippetRecord }`
- `DELETE /api/snippets/:id` -> `204`
- `POST /api/snippets/import` -> `200 { imported: number, skipped: number }`

### Ruta publica

- `GET /s/:id` o `GET /api/snippets/public/:id` para snippets con `is_public = 1`

### Reglas de comportamiento

- Sin sesion: solo `localStorage`.
- Con sesion: cargar snapshot remoto al entrar.
- La accion de import aparece una sola vez si existen snippets locales no subidos.
- No hacer dual-write silencioso como contrato permanente; remoto canonico, local cache.
- Solo el owner puede editar o borrar. Publico solo afecta lectura compartida.

## 6. Observabilidad minima en prod

El feedback inbox ya captura valor real. El siguiente paso no es una plataforma de logs entera, sino endurecer la senal.

Campos a sumar cuando se toque el schema local del inbox:

- `source`: `runtime` | `manual`
- `severity`: `info` | `warn` | `error`
- `fingerprint`: hash o string estable para dedupe
- `occurrences`: contador de repeticion
- `lastSeenAt`: ultimo timestamp visto
- `buildId`: version desplegada
- `locale`, `toolSlug`, `authState`
- `userId` opcional si hay sesion

Regla de dedupe inicial:

- fingerprint = `kind + normalized title + first stack frame + pathname`
- si entra un duplicado, incrementar `occurrences` y actualizar `lastSeenAt`
- la UI lista una entrada consolidada, no 20 clones del mismo error

La subida a servidor queda para una fase posterior. Primero ordenar la captura local.

## 7. Definition of done para tools y sistemas

Un slice se considera cerrado cuando cumple esto:

- manifest en `TOOLS.md` actualizado si aplica
- ownership local/auth documentado
- contrato de API escrito si toca red
- smoke test del golden path o skip documentado con causa real
- empty/loading/error states resueltos
- sin TODOs ambiguos ni ramas muertas dejadas por apuro
- cleanup chico al final del slice antes de declararlo listo

## 8. Orden sugerido

1. Cerrar contrato de snippets.
2. Implementar snippets a D1 con import explicito y smoke nuevo.
3. Endurecer feedback inbox con severidad, contexto y dedupe.
4. Recien despues sync de themes per-user.
5. Cleanup tecnico corto despues de snippets y observabilidad.