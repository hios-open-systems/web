# Acceso e identidades en HIOS

## ¿Qué ofrece y cómo funciona el acceso actual?

### Takeaway
La cuenta ya aporta valor concreto: sincroniza espacios, configuraciones y snippets entre dispositivos. La implementación es propia y está acoplada a GitHub; admitir Google requiere separar la cuenta HIOS de las identidades externas. Esta revisión no implementó ni configuró proveedores ni ejecutó un inicio de sesión real.

### Cited Findings
- La base tiene un identificador interno independiente, `users.id`, pero obliga a que todos los usuarios tengan `github_id INTEGER NOT NULL UNIQUE` y `github_login TEXT NOT NULL`. Las sesiones y snippets referencian el identificador interno, por lo que existe una base útil para preservar las cuentas durante una migración. — [Esquema](C:/Users/juanparedez/Desktop/code/web/migrations/0001_init.sql:4)
- El alta/actualización busca exclusivamente por `github_id` y guarda login, nombre, URL de avatar y email. — [Upsert](C:/Users/juanparedez/Desktop/code/web/lib/auth/users.ts:16)
- El tipo de usuario, la consulta de sesión y `/api/auth/me` también contienen campos específicos de GitHub; el endpoint público de sesión devuelve nombre/login/avatar y condición de owner, no email. — [Sesión](C:/Users/juanparedez/Desktop/code/web/lib/auth/session.ts:14); [Me](C:/Users/juanparedez/Desktop/code/web/app/api/auth/me/route.ts:16)
- El administrador se reconoce mediante el ID numérico inmutable de GitHub, no por nombre ni email. Eso debe preservarse explícitamente al agregar proveedores. — [Owner](C:/Users/juanparedez/Desktop/code/web/lib/auth/owner.ts:6)
- OAuth usa state aleatorio, cookie temporal de 10 minutos y validación en callback; restringe el destino posterior a rutas internas. Las cookies de sesión son HttpOnly, Secure y SameSite=Lax, con vigencia de 30 días. — [Inicio](C:/Users/juanparedez/Desktop/code/web/app/api/auth/github/start/route.ts:9); [Callback](C:/Users/juanparedez/Desktop/code/web/app/api/auth/github/callback/route.ts:24); [TTL](C:/Users/juanparedez/Desktop/code/web/lib/auth/session.ts:5)
- El menú ofrece únicamente GitHub y conserva el pathname como destino. La URL externa de avatar se guarda pero el menú solo carga avatares que `isLocalResource` acepta; el fallback son iniciales. — [Menú](C:/Users/juanparedez/Desktop/code/web/components/auth/UserMenu.tsx:51); [Avatar](C:/Users/juanparedez/Desktop/code/web/components/auth/UserMenu.tsx:175)
- El botón de acceso desde espacios envía a `/api/auth/github/start` sin parámetro `next`, a diferencia del menú. Por defecto se vuelve a `/`, lo que interrumpe el contexto de trabajo. — [Espacios](C:/Users/juanparedez/Desktop/code/web/components/workbench/SpacesWorkspace.tsx:111); [Destino seguro por defecto](C:/Users/juanparedez/Desktop/code/web/lib/auth/github.ts:43)
- `WorkspaceProvider` separa almacenamiento anónimo y por cuenta, sincroniza solo para cuentas y vuelve a intentar al recuperar conexión. La API conserva revisiones y detecta conflictos. — [Provider](C:/Users/juanparedez/Desktop/code/web/components/workbench/WorkspaceProvider.tsx:17); [Sincronización](C:/Users/juanparedez/Desktop/code/web/lib/workspaces/sync.ts:30)
- Los snippets se guardan localmente o en cuenta; para compartirlos por enlace se guardan en cuenta y se hacen públicos. Importar los locales es una acción explícita. En tema, el beneficio entre dispositivos es el color de acento; modo claro/oscuro, estilo y temas nombrados siguen siendo locales. — [Textos de producto](C:/Users/juanparedez/Desktop/code/web/messages/en.json:2316); [Alcance del tema](C:/Users/juanparedez/Desktop/code/web/messages/en.json:1714)
- `npm run test:auth` terminó exitosamente el 24-10-2026. Verifica destinos seguros, owner, controles HTTP y límite de solicitudes; no representa un login OAuth de extremo a extremo. — [Pruebas ejecutadas](C:/Users/juanparedez/Desktop/code/web/scripts/auth-selftest.ts:24)

### Inferences
- Prioridad alta: convertir `users` en cuenta interna y añadir `auth_identities` con `user_id`, proveedor/emisor y sujeto externo, con unicidad por identidad. Migrar GitHub conservando exactamente los actuales `users.id`, para no perder espacios, preferencias o snippets. El mecanismo de sesión puede seguir usando ese mismo ID. Es una propuesta, no una migración realizada.
- El rol administrativo debe seguir ligado a la identidad administrativa previamente autorizada o a un rol interno asignado de forma controlada. No elevar usuarios por coincidencia de email/nombre.
- La mejora inmediata de UX es un selector común de acceso que vuelva al espacio/herramienta de origen, con una explicación concreta como «Sincronizá tus espacios y configuraciones entre dispositivos» y la opción de seguir usando HIOS localmente.

### Gaps
- No se inició sesión real, no se accedió a cuentas de usuarios ni se comprobaron secretos/configuración de consolas externas. El código local no demuestra por sí solo el estado de todas las funciones en producción.
- No hay evidencia en este relevamiento de tasas de abandono del login, demanda cuantificada por proveedor ni adopción real de sincronización. Los beneficios están implementados; su impacto comercial sigue siendo una hipótesis.

## ¿Cómo agregar Google y otros proveedores sin romper privacidad ni cuentas?

### Takeaway
Google es el primer candidato razonable para reducir la dependencia de una cuenta de desarrollador. Después consideraría Microsoft para educación/trabajo y GitLab si existe demanda técnica. Mantendría el uso anónimo y local; ingresar con un proveedor no es una operación anónima frente a ese proveedor.

### Cited Findings
- Google ofrece OpenID Connect y un flujo de servidor con intercambio de código; requiere registrar credenciales y URI de retorno. Su documentación aconseja reutilizar bibliotecas probadas. — [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect)
- La referencia actual exige `openid` y al menos `profile`, `email` o ambos. `email` solo se devuelve al solicitar ese permiso; el identificador es `sub`, no el email. `profile` puede aportar nombre e imagen. — [Referencia Google OIDC](https://developers.google.com/identity/openid-connect/reference)
- La verificación debe comprobar firma, audiencia, emisor y caducidad. Google advierte que `email_verified` en una dirección externa a Gmail/Workspace no asegura que Google siga siendo autoridad sobre su titularidad. — [Validación de Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- Una guía oficial de implementación de enlace de cuentas recomienda autenticar ambas cuentas antes de unirlas, para evitar accesos ilegítimos. Se cita por el criterio de seguridad; no se recomienda contratar Auth0. — [Enlace de cuentas, Auth0](https://auth0.com/docs/manage-users/user-accounts/user-account-linking/link-user-accounts)
- Microsoft permite elegir cuentas personales, cuentas laborales/educativas o ambas. Las organizaciones pueden imponer restricciones propias de consentimiento. — [Tipos de cuentas Microsoft](https://learn.microsoft.com/en-us/security/zero-trust/develop/identity-supported-account-types)
- GitLab permite usar GitLab.com como identidad externa y tiene endpoints de autorización, token, userinfo y discovery OIDC. Su permiso `openid` también expone acceso de lectura a perfil y membresías de grupos; requiere revisar los datos realmente consumidos. — [GitLab como proveedor](https://docs.gitlab.com/integration/oauth_provider/)
- Actualmente HIOS pide `read:user user:email` y, si falta email público, consulta `/user/emails`; el fallback puede elegir el primer email aunque no sea el primario verificado. Hoy no lo usa para enlazar cuentas, pero no debe heredarse como supuesto de identidad verificada. — [Permisos actuales](C:/Users/juanparedez/Desktop/code/web/lib/auth/github.ts:14); [Selección de email](C:/Users/juanparedez/Desktop/code/web/lib/auth/github.ts:115)
- GitHub distingue `read:user` de `user:email`; incluso sin scopes permite lectura de información pública. — [Scopes GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

### Inferences
- Recomendación Google para este producto: empezar con `openid profile`, guardar el sujeto estable y, si aporta valor, nombre visible. No pedir email solo para vincular identidades: los beneficios actuales de sincronización dependen del ID HIOS, no del correo. No solicitar Drive, contactos, Gmail ni acceso offline; no conservar tokens externos a largo plazo si se usan únicamente para entrar.
- Mostrar «Continuar con Google» con una nota breve sobre el destino y los datos recibidos, y contactar al proveedor únicamente tras ese clic. Usar redirección de servidor evita introducir un SDK de Google cargado al visitar cualquier página. No cargar automáticamente la foto externa recibida. El mismo criterio se debe aplicar a GitHub y futuros proveedores.
- Ofrecer «Vincular Google» desde una cuenta HIOS existente, con reautenticación de la cuenta actual y de la nueva identidad, y garantía de que la identidad externa no pertenezca ya a otra cuenta. Nunca unir cuentas automáticamente solo porque el email coincida.
- Cada transacción debe vincular proveedor, state, nonce, destino y, si corresponde, PKCE; verificar tokens con biblioteca compatible con Cloudflare. Probar replay, callbacks cruzados, cancelaciones, identidad duplicada, separación entre cuentas y conservación de datos. Evitar implementar validación criptográfica artesanal.
- Orden propuesto: GitHub + Google; Microsoft al priorizar docentes/estudiantes/equipos; GitLab si hay demanda. No introducir una larga lista de botones ni redes sociales. La priorización es de producto, no una conclusión estadística.
- Revisar también si se puede retirar `user:email` de GitHub y dejar de guardar correos OAuth que no tienen uso demostrado en el código revisado. Si algún flujo futuro necesita email, solicitarlo o incorporarlo con propósito explícito y por separado de analítica.

### Gaps
- No se creó proyecto OAuth de Google, no se modificaron credenciales, no se añadieron proveedores y no se desplegó nada. La preparación de la consola y la validación del flujo real siguen pendientes para una futura implementación.
- El impacto de Google sobre la conversión no puede afirmarse sin medición. Tampoco se puede prometer privacidad absoluta: el proveedor participa en el login solicitado por el usuario.

## ¿Qué casos de uso conviene potenciar y qué límites de privacidad aclarar?

### Takeaway
Conviene hacer visibles y pulir los casos existentes antes de sumar herramientas sin demanda observada: continuar un banco de trabajo en otro equipo, conservar configuraciones y compartir recursos elegidos. La cuenta debe aportar continuidad, sin convertirse en requisito para calcular, explorar o trabajar con archivos locales.

### Cited Findings
- El modelo de espacios ya tiene sincronización diferenciada de contenido: rechaza contenido remoto cuando `syncContent` no lo autoriza, y los conflictos tienen respuesta 409. — [Validación de sincronización](C:/Users/juanparedez/Desktop/code/web/lib/workspaces/api.ts:67)
- La eliminación de cuenta borra el usuario y depende de las claves foráneas para limpiar sesiones, snippets, preferencias y espacios. — [Eliminar cuenta](C:/Users/juanparedez/Desktop/code/web/app/api/user/account/route.ts:18); [Espacios en esquema](C:/Users/juanparedez/Desktop/code/web/migrations/0006_workspaces.sql:1)
- Feedback conserva el mensaje y email tras poner `user_id` en NULL; guestbook no depende de users. Los textos de privacidad actuales lo aclaran. El comentario del endpoint que afirma que no queda nada asociable es demasiado amplio y no equivale al comportamiento real. — [Feedback](C:/Users/juanparedez/Desktop/code/web/migrations/0004_feedback.sql:3); [Guestbook](C:/Users/juanparedez/Desktop/code/web/migrations/0005_guestbook.sql:1); [Aviso visible](C:/Users/juanparedez/Desktop/code/web/messages/en.json:3760); [Comentario inexacto](C:/Users/juanparedez/Desktop/code/web/app/api/user/account/route.ts:14)
- La explicación visible de telemetría indica que los eventos de usuarios identificados se asocian a su cuenta cuando la activan. Login y analítica no son actualmente dominios completamente separados. — [Aviso de telemetría](C:/Users/juanparedez/Desktop/code/web/messages/en.json:3747)

### Inferences
- Casos a validar: un docente prepara un espacio con calculadoras/configuraciones para una práctica; un maker retoma su banco de trabajo en otro equipo; un usuario conserva una configuración útil y comparte un snippet público deliberadamente. Son propuestas basadas en capacidades, no demanda demostrada.
- La activación debería ser «guardó una configuración útil o sincronizó su primer espacio», no solamente «creó una cuenta». El agregado de proveedores facilita acceso pero no crea por sí mismo un motivo para volver.
- Separar identificadores de cuenta de estadísticas agregadas ayuda a sostener la promesa de privacidad. No hace falta enlazar navegación a identidades Google/GitHub para mostrar volumen de actividad o dimensionar infraestructura.
- Para el plan de crecimiento: primero claridad y confianza de medición; después Google con migración segura; luego evaluar adopción de esos casos para decidir el siguiente proveedor. Mantener exportación/importación local como opción de portabilidad sin cuenta.

### Gaps
- No hay evidencia suficiente para afirmar que aulas, makers u organizaciones son los segmentos más activos; deben validarse con métricas agregadas y feedback voluntario.
- Esta revisión de auth no evalúa facturación, capacidad real, SEO ni estadísticas históricas; están a cargo de los otros frentes del diagnóstico.
