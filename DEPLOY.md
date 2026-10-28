# Validación y release local — Cloudflare Workers + OpenNext

Los pushes y PR **no ejecutan GitHub Actions**. `.github/workflows/ci.yml` solo
admite `workflow_dispatch` como respaldo manual de verificación, sin despliegue
ni credenciales de publicación. El cambio entra en vigor al subir ese workflow.
Workers Builds debe seguir desactivado en Cloudflare; el repositorio no controla
ese ajuste externo (se documentó desactivado el 24 de octubre de 2026).

## Preparación

- Node >=22.6, npm, Git y Chromium de Playwright. La validación ejecuta `npm ci`
  desde el lockfile e instala Chromium si falta; necesita acceso a los registros
  de paquetes y descarga de Playwright. En Linux instalar también sus dependencias
  del sistema con `npx playwright install-deps chromium`.
- Gitleaks 8.30.1: instalar desde el release oficial de `gitleaks/gitleaks`, verificar
  el checksum del archivo descargado y dejar el binario en PATH o en
  `.release-tools/gitleaks` (`gitleaks.exe` en Windows). También acepta la ruta
  explícita `HIOS_GITLEAKS_PATH`. Esta carpeta está ignorada por Git.
- `NEXT_PUBLIC_TURNSTILE_SITEKEY` real en `.env.local` (ignorado) o en el entorno.
  El runner carga `.env.local` con las reglas de Next, sin imprimir su contenido.
- Para publicar: login local de Wrangler o un token Cloudflare con permisos del
  Worker. Los secrets runtime siguen en Cloudflare; no se copian al repositorio.

## Secuencia de release

Primero integrar y confirmar los cambios en `main` local. Después:

```bash
npm run release:verify
npm run release:push
npm run deploy
```

Cada comando requiere `main` y árbol limpio, incluidos archivos no versionados
que no estén ignorados. `release:verify` no sube commits, no despliega y no toca
D1 remoto. Los únicos procesos Wrangler de pruebas usan D1 local con fixtures.

La verificación conserva las comprobaciones del antiguo CI:

1. Instalación limpia, Chromium y escaneo redactado de secretos de todo Git.
2. Lint y todos los grupos de self-tests descubiertos automáticamente.
3. Un único build de producción OpenNext.
4. Seguridad, autenticación y métricas contra Worker y D1 locales.
5. SEO renderizado, sitemap y contenido de software.
6. Navegador: contenido, hidratación, privacidad, demos, instrumentos, electrónica,
   traducciones, pinouts, navegación y layouts móviles/tablet; auditorías de rutas
   públicas para conexiones implícitas y ancho móvil.

La lista exacta de suites/anchos está en `scripts/release-browser-plan.json`.
Es la selección anterior de CI: no equivale a ejecutar todos los archivos de
`tests/`. Las suites autenticadas antiguas de Pages siguen fuera de este flujo;
ver [BACKLOG.md](BACKLOG.md). Las pruebas públicas usan `next start`, mientras las
pruebas API de seguridad usan el Worker construido. Ninguna sustituye pruebas
físicas de hardware ni consentimiento real de OAuth/captcha.

Si falla un paso, se detiene sin emitir autorización local. El comprobante anterior
se elimina al empezar una nueva validación. Solo al terminar se guarda
`.release/verified.json` con commit, hash de todo `.open-next`, versión de Node,
hash de la clave pública y etapas completadas; no contiene secretos.

`release:push` verifica ese comprobante y hace un push normal, sin force, del
commit exacto a `origin/main`. `deploy` exige además que `origin/main` coincida,
comprueba los secrets y clave pública con `security-release-check.mjs`, publica
**el mismo artefacto sin reconstruirlo** y comprueba versión y 20 rutas localizadas.
Un cambio de commit, artefacto, clave o Node obliga a repetir la validación.
El comprobante es una protección local contra errores, no una firma de CI remota.
Los comandos directos de Git/Wrangler pueden saltarse este flujo; usar los scripts.

## Fallos y recuperación

Los logs se muestran en la terminal y Playwright conserva diagnósticos en
`test-results/`. Un fallo previo al upload no cambia producción. Si el smoke falla
tras publicar, el comando falla pero no hace rollback automático: investigar y
revertir deliberadamente, validar y publicar de nuevo.

El runner usa `.release/lock` para evitar dos releases simultáneos. Si una
interrupción abrupta deja ese archivo, comprobar que el PID escrito y sus procesos
hijos terminaron antes de eliminarlo y repetir la validación.

El respaldo manual de Actions utiliza la misma validación en Linux; su resultado
no autoriza un artefacto distinto de la máquina local y nunca publica.

## Entorno y migraciones

Worker `hios-platform`, dominio `openhios.dev`, binding D1 `DB` de
`hios-playground`: se conservan. Las migraciones no corren con el despliegue.
Aplicar solo las pendientes según el registro del entorno, con respaldo previo
para producción; `npm run db:migrate:local` y `npm run db:migrate` son operaciones
separadas. Este cambio no requiere migraciones remotas.

`npm run dev` sirve la interfaz; `npm run preview` construye y ejecuta el Worker
con D1 local. Para las pruebas se usan configuraciones aisladas en `tests/fixtures`.
